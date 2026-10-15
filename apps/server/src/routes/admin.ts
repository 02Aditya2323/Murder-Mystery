import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db, hashPassword, initTeamLevelState } from '../db.js';
import { requireAdminAuth, signToken, AuthenticatedRequest } from '../auth.js';
import {
  getLevelMeta,
  getLevelStory
} from '../content-loader.js';
import {
  getEventClock,
  startEvent,
  pauseEvent,
  resumeEvent,
  endEvent,
  setEventBanner
} from '../event-clock.js';
import {
  broadcastToast,
  broadcastLeaderboard,
  setHideLeaderboard,
  isLeaderboardHidden,
  getLeaderboardData
} from '../sse.js';
import { ADMIN_PASSWORD, ANSWER_SECRET, rootDir } from '../config.js';
import { LevelStateRow, Team } from '../types.js';
import { normalizeAnswer } from '../level-validator.js';
import { THEORY_QUESTIONS } from './theory.js';

const router = Router();

export const CANONICAL_THEORY_ANSWERS = {
  q1: 'Adrian Cross.',
  q2: 'He re-entered through the garage during the unlogged maintenance window, confronted Elias about Julian and the falsified records, it turned violent and he killed him with the letter opener around 22:50.',
  q3: 'Adrian staged it after the killing to fake the time of death and line it up with his alibi photo at 22:21.',
  q4: "Julian discovered Elias's falsified records. Elias killed him. Rowan backdated the time of death to 20:40 to clear Elias and steered the case toward Mira.",
  q5: 'Elias convinced her that her memory could not be trusted, so anything she said would be dismissed.',
  q6: 'She found the body, feared her own secret (Recording Three, a falsified record she signed) would come out, deleted it, wiped the room, relocked the door and lied.',
  q7: "He is Julian's half-brother using his father's surname, so he could get close to Elias and collect evidence.",
  q8: "Rowan already knew the killer because he was Adrian's accomplice. He opened the maintenance window, had the lock export cleaned and steered suspicion toward Lena, to bury Recording Nine and his own confession."
};

// Admin Login
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid emergency administration passcode.' });
  }

  const token = signToken('admin');
  res.cookie('investigation_admin', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  return res.json({ ok: true });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('investigation_admin');
  return res.json({ ok: true });
});

// Admin Overview & Readiness Check
router.get('/overview', requireAdminAuth, (_req: Request, res: Response) => {
  const clock = getEventClock();
  const teams = db.prepare('SELECT * FROM teams ORDER BY name ASC').all() as Team[];
  const kits = db.prepare('SELECT kit_no, answer_hash, alternates_json, updated_at FROM kits ORDER BY kit_no ASC').all() as any[];

  const liveBoard = teams.map(t => {
    const states = db.prepare('SELECT * FROM level_state WHERE team_id = ? ORDER BY level ASC').all(t.id) as LevelStateRow[];
    return {
      team: {
        id: t.id,
        name: t.name,
        code: t.code,
        kitNo: t.kit_no,
        members: JSON.parse(t.members_json || '[]')
      },
      states
    };
  });

  // Readiness Check
  const issues: string[] = [];
  if (teams.length === 0) {
    issues.push('No teams imported in database.');
  }
  for (const t of teams) {
    if (!t.kit_no) {
      issues.push(`Team "${t.name}" has no kit assigned.`);
    }
  }
  for (const k of kits) {
    if (!k.answer_hash) {
      issues.push(`Kit #${k.kit_no} has no answer configured.`);
    }
  }

  return res.json({
    clock,
    leaderboardHidden: isLeaderboardHidden(),
    teamsCount: teams.length,
    readiness: {
      ready: issues.length === 0,
      issues
    },
    liveBoard,
    kits
  });
});

// Event Control
router.post('/event/action', requireAdminAuth, (req: Request, res: Response) => {
  const { action, force } = req.body;
  try {
    if (action === 'start') {
      startEvent();
    } else if (action === 'pause') {
      pauseEvent();
    } else if (action === 'resume') {
      resumeEvent();
    } else if (action === 'end') {
      endEvent();
    } else {
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    return res.json({ ok: true, clock: getEventClock() });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Broadcast Banner / Toast
router.post('/event/banner', requireAdminAuth, (req: Request, res: Response) => {
  const { banner, toastMessage, severity = 'info' } = req.body;
  if (banner !== undefined) {
    setEventBanner(banner);
  }
  if (toastMessage) {
    broadcastToast(toastMessage, severity);
  }
  return res.json({ ok: true });
});

// Leaderboard visibility toggle
router.post('/event/leaderboard-visibility', requireAdminAuth, (req: Request, res: Response) => {
  const { hide } = req.body;
  setHideLeaderboard(!!hide);
  return res.json({ ok: true, hidden: isLeaderboardHidden() });
});

// Import Teams (CSV)
router.post('/teams/import', requireAdminAuth, (req: Request, res: Response) => {
  const { csvText, replaceExisting = false } = req.body;
  if (!csvText) {
    return res.status(400).json({ error: 'CSV text required.' });
  }

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return res.status(400).json({ error: 'CSV must contain a header and at least one team row.' });
  }

  const header = lines[0].toLowerCase().split(',').map((h: string) => h.trim().replace(/^"/, '').replace(/"$/, ''));
  const nameIdx = header.indexOf('name') !== -1 ? header.indexOf('name') : header.indexOf('team_name');
  const codeIdx = header.indexOf('code');
  const passIdx = header.indexOf('password');
  const kitIdx = header.indexOf('kit_no') !== -1 ? header.indexOf('kit_no') : header.indexOf('kit');
  const membersIdx = header.indexOf('members');

  if (nameIdx === -1 || codeIdx === -1 || passIdx === -1) {
    return res.status(400).json({ error: 'CSV must contain columns: name, code, password, kit_no' });
  }

  if (replaceExisting) {
    db.prepare('DELETE FROM teams').run();
  }

  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, code, pass_hash, kit_no, members_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      pass_hash = excluded.pass_hash,
      kit_no = excluded.kit_no,
      members_json = excluded.members_json
  `);

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',').map((p: string) => p.trim().replace(/^"/, '').replace(/"$/, ''));

    const name = parts[nameIdx];
    const code = parts[codeIdx];
    const password = parts[passIdx];
    const kitNo = kitIdx !== -1 ? parseInt(parts[kitIdx], 10) || 1 : 1;
    const members = membersIdx !== -1 && parts[membersIdx] ? parts[membersIdx].split(';').map((m: string) => m.trim()) : [];

    const id = `team-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`;
    insertTeam.run(id, name, code, hashPassword(password), kitNo, JSON.stringify(members));

    // Ensure state
    const existing = db.prepare('SELECT id FROM teams WHERE UPPER(code) = UPPER(?)').get(code) as { id: string };
    initTeamLevelState(existing.id);
    count++;
  }

  broadcastLeaderboard();
  return res.json({ ok: true, importedCount: count });
});

// Export Teams CSV
router.get('/teams/export', requireAdminAuth, (_req: Request, res: Response) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY kit_no ASC').all() as Team[];
  let csv = 'id,name,code,kit_no,members,created_at\n';
  for (const t of teams) {
    const members = JSON.parse(t.members_json || '[]').join(';');
    csv += `"${t.id}","${t.name}","${t.code}",${t.kit_no},"${members}","${t.created_at}"\n`;
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="teams_credentials.csv"');
  return res.send(csv);
});

// Kits list
router.get('/kits', requireAdminAuth, (_req: Request, res: Response) => {
  const kits = db.prepare('SELECT * FROM kits ORDER BY kit_no ASC').all();
  return res.json({ kits });
});

// Update Kit Answer
router.post('/kits/update', requireAdminAuth, (req: Request, res: Response) => {
  const { kit_no, answer, alternates = [] } = req.body;
  if (!kit_no || !answer) {
    return res.status(400).json({ error: 'Kit number and answer required.' });
  }

  const normalized = normalizeAnswer(answer);
  const hmac = crypto.createHmac('sha256', ANSWER_SECRET);
  hmac.update(`KIT_${kit_no}_SALT_1986:${normalized}`);
  const hash = hmac.digest('hex');

  const altsJson = JSON.stringify(alternates);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO kits (kit_no, answer_hash, alternates_json, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(kit_no) DO UPDATE SET
      answer_hash = excluded.answer_hash,
      alternates_json = excluded.alternates_json,
      updated_at = excluded.updated_at
  `).run(kit_no, hash, altsJson, now);

  return res.json({ ok: true, kit_no, hashPreview: hash.slice(0, 10) + '...' });
});

// Manual Team Override (Unlock / Reset)
router.post('/override', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { team_id, level, action, reason } = req.body;
  if (!team_id || !level || !action || !reason) {
    return res.status(400).json({ error: 'team_id, level, action and reason required.' });
  }

  const now = new Date().toISOString();

  if (action === 'UNLOCK') {
    db.prepare(`
      UPDATE level_state
      SET status = 'SOLVED', solved_at = ?
      WHERE team_id = ? AND level = ?
    `).run(now, team_id, level);

    if (level < 10) {
      db.prepare(`
        UPDATE level_state
        SET status = 'OPEN', started_at = ?
        WHERE team_id = ? AND level = ?
      `).run(now, team_id, level + 1);
    }
  } else if (action === 'RESET') {
    db.prepare(`
      UPDATE level_state
      SET status = 'OPEN', started_at = ?, solved_at = NULL, stage_index = 0, hints_used = 0, wrong_attempts = 0, skipped = 0
      WHERE team_id = ? AND level = ?
    `).run(now, team_id, level);
  } else {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  db.prepare(`
    INSERT INTO overrides_log (team_id, level, action, reason, admin_user, created_at)
    VALUES (?, ?, ?, ?, 'admin', ?)
  `).run(team_id, level, action, reason, now);

  broadcastLeaderboard();
  return res.json({ ok: true });
});

// Final Theory Review list
/**
 * The whole answer key, for the organiser running the room.
 *
 * Reads content/answers.key.json, which is git-ignored, plus the live kit
 * table so the kit column always reflects what the server will actually
 * accept rather than what a document says it should.
 */
router.get('/answer-key', requireAdminAuth, (_req: Request, res: Response) => {
  let key: any = { beats: [], kits: [] };
  try {
    const p = path.resolve(rootDir, 'content/answers.key.json');
    if (fs.existsSync(p)) key = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return res.status(500).json({ error: 'The answer key file could not be read.' });
  }

  let kitsJson: any[] = [];
  try {
    kitsJson = JSON.parse(
      fs.readFileSync(path.resolve(rootDir, 'content/kits.json'), 'utf8')
    ).kits || [];
  } catch { /* fall back to the key file alone */ }

  const seeded = db.prepare('SELECT kit_no FROM kits ORDER BY kit_no ASC').all() as Array<{ kit_no: number }>;
  const seededSet = new Set(seeded.map((k) => k.kit_no));

  const kits = (key.kits || []).map((row: any) => {
    const live = kitsJson.find((k) => k.kit_no === row.kit_no);
    return {
      ...row,
      answer: live ? live.answer : row.answer,
      ics: live && live.ics ? live.ics.join(' + ') : row.ics,
      seeded: seededSet.has(row.kit_no)
    };
  });

  return res.json({ beats: key.beats || [], kits, warning: key._WARNING || null });
});

router.get('/theories', requireAdminAuth, (_req: Request, res: Response) => {
  const theories = db.prepare(`
    SELECT t.*, tm.name as team_name, tm.code as team_code, tm.kit_no
    FROM theory t
    JOIN teams tm ON t.team_id = tm.id
    ORDER BY t.submitted_at ASC
  `).all();

  return res.json({
    theories,
    canonical: CANONICAL_THEORY_ANSWERS,
    questions: THEORY_QUESTIONS
  });
});

// Grade/Review Team Theory
router.post('/theories/:teamId/review', requireAdminAuth, (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { marks, reviewedBy = 'organizer' } = req.body;

  db.prepare(`
    UPDATE theory
    SET marks_json = ?, reviewed_by = ?
    WHERE team_id = ?
  `).run(JSON.stringify(marks), reviewedBy, teamId);

  return res.json({ ok: true });
});

// Export Results CSV
router.get('/results/export', requireAdminAuth, (_req: Request, res: Response) => {
  const leaderboard = getLeaderboardData();
  let csv = 'Rank,Team Name,Kit No,Levels Solved,Levels Skipped,Current Level,Elapsed Seconds,Hints Used,Wrong Attempts,Last Solved\n';

  leaderboard.entries.forEach((e, idx) => {
    csv += `${idx + 1},"${e.teamName}",${e.kitNo},${e.levelsSolved},${e.levelsSkipped},${e.currentLevel},${e.totalElapsedSeconds},${e.totalHintsUsed},${e.totalWrongAttempts},"${e.lastSolvedAt || ''}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="final_results.csv"');
  return res.send(csv);
});

// Read-only level preview for authenticated administrators
router.get('/level-preview/:n', requireAdminAuth, (req: Request, res: Response) => {
  const levelNum = Number.parseInt(req.params.n, 10);

  if (!Number.isInteger(levelNum) || levelNum < 1 || levelNum > 10) {
    return res.status(404).json({ error: 'Level not found.' });
  }

  try {
    const meta = getLevelMeta(levelNum);
    const story = getLevelStory(levelNum);

    return res.json({
      id: meta.id,
      title: meta.title,
      type: meta.type,
      tool: meta.tool,
      estimatedMinutes: meta.estimated_minutes,
      softCapMinutes: meta.soft_cap_minutes,
      stages: meta.stages,
      story,
      previewOnly: true
    });
  } catch (error) {
    console.error(`Unable to preview level ${levelNum}:`, error);
    return res.status(500).json({ error: 'Unable to load this level preview.' });
  }
});

export default router;
