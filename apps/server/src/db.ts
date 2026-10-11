import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ANSWER_SECRET, rootDir } from './config.js';

const dataDir = path.resolve(rootDir, 'apps/server/data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_SALT_1986').digest('hex');
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS event (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state TEXT NOT NULL DEFAULT 'NOT_STARTED',
      started_at TEXT,
      paused_total_ms INTEGER NOT NULL DEFAULT 0,
      pause_started_at TEXT,
      ended_at TEXT,
      banner TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      pass_hash TEXT NOT NULL,
      kit_no INTEGER NOT NULL,
      members_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kits (
      kit_no INTEGER PRIMARY KEY,
      answer_hash TEXT NOT NULL,
      alternates_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS level_state (
      team_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'SEALED',
      started_at TEXT,
      solved_at TEXT,
      stage_index INTEGER NOT NULL DEFAULT 0,
      hints_used INTEGER NOT NULL DEFAULT 0,
      wrong_attempts INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (team_id, level),
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      stage INTEGER NOT NULL,
      answer_norm TEXT NOT NULL,
      correct INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notebook (
      team_id TEXT PRIMARY KEY,
      text TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS theory (
      team_id TEXT PRIMARY KEY,
      q1 TEXT NOT NULL DEFAULT '',
      q2 TEXT NOT NULL DEFAULT '',
      q3 TEXT NOT NULL DEFAULT '',
      q4 TEXT NOT NULL DEFAULT '',
      q5 TEXT NOT NULL DEFAULT '',
      q6 TEXT NOT NULL DEFAULT '',
      q7 TEXT NOT NULL DEFAULT '',
      q8 TEXT NOT NULL DEFAULT '',
      submitted_at TEXT NOT NULL,
      marks_json TEXT,
      reviewed_by TEXT,
      FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS overrides_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      admin_user TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure initial event row
  const row = db.prepare('SELECT id FROM event WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO event (id, state, started_at, paused_total_ms, pause_started_at, ended_at, banner)
      VALUES (1, 'NOT_STARTED', NULL, 0, NULL, NULL, NULL)
    `).run();
  }

  // Seed default kits 1..10 if empty
  const kitCount = db.prepare('SELECT count(*) as count FROM kits').get() as { count: number };
  if (kitCount.count === 0) {
    const insertKit = db.prepare(`
      INSERT INTO kits (kit_no, answer_hash, alternates_json, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    const defaultAnswers: Record<number, string> = {
      1: '42',
      2: '67',
      3: '89',
      4: '55',
      5: '31',
      6: '94',
      7: '18',
      8: '73',
      9: '62',
      10: '49'
    };

    for (let k = 1; k <= 10; k++) {
      const ans = defaultAnswers[k] || `CHANGE_ME_${k}`;
      const hmac = crypto.createHmac('sha256', ANSWER_SECRET);
      hmac.update(`KIT_${k}_SALT_1986:${ans}`);
      const hash = hmac.digest('hex');
      insertKit.run(k, hash, JSON.stringify([ans]));
    }
  }

  // Seed default demo teams if empty
  const teamCount = db.prepare('SELECT count(*) as count FROM teams').get() as { count: number };
  if (teamCount.count === 0) {
    const demoTeams = [
      {
        id: 'team-1',
        name: 'Baker Street Unit',
        code: 'BAKER',
        password: 'case1986',
        kit_no: 1,
        members: ['Inspector Lestrade', 'Dr. Watson']
      },
      {
        id: 'team-2',
        name: 'Scotland Yard Bravo',
        code: 'YARD',
        password: 'case1986',
        kit_no: 2,
        members: ['Sgt. Miller', 'Constable Evans']
      },
      {
        id: 'team-3',
        name: 'Hampstead Watch',
        code: 'WATCH',
        password: 'case1986',
        kit_no: 3,
        members: ['Officer Davis', 'Analyst Price']
      }
    ];

    const insertTeam = db.prepare(`
      INSERT INTO teams (id, name, code, pass_hash, kit_no, members_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    for (const t of demoTeams) {
      insertTeam.run(
        t.id,
        t.name,
        t.code,
        hashPassword(t.password),
        t.kit_no,
        JSON.stringify(t.members)
      );
      initTeamLevelState(t.id);
    }
  }
}

export function initTeamLevelState(teamId: string) {
  const check = db.prepare('SELECT count(*) as count FROM level_state WHERE team_id = ?').get(teamId) as { count: number };
  if (check.count === 0) {
    const insertState = db.prepare(`
      INSERT INTO level_state (team_id, level, status, started_at, solved_at, stage_index, hints_used, wrong_attempts, skipped)
      VALUES (?, ?, ?, ?, NULL, 0, 0, 0, 0)
    `);
    // Level 1 starts OPEN, levels 2..10 SEALED
    insertState.run(teamId, 1, 'OPEN', new Date().toISOString());
    for (let l = 2; l <= 10; l++) {
      insertState.run(teamId, l, 'SEALED', null);
    }
  }
}
