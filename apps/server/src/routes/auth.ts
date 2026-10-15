import { Router, Response } from 'express';
import { db, hashPassword, initTeamLevelState } from '../db.js';
import { verifyToken, signToken, AuthenticatedRequest } from '../auth.js';
import { getEventClock } from '../event-clock.js';
import { Team, LevelStateRow } from '../types.js';

const router = Router();

router.post('/login', (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) {
    return res.status(400).json({ error: 'Team code and password required.' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE UPPER(code) = UPPER(?)').get(code.trim()) as Team | undefined;
  if (!team) {
    return res.status(401).json({ error: 'Invalid team code.' });
  }

  if (team.pass_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  // Start this team's clock on first login, not at roster import. With
  // staggered batches (12-3, 1-4, 2-5) and ranking on elapsed time, stamping
  // at import would hand the first batch the podium before anyone sat down.
  db.prepare(
    "UPDATE level_state SET started_at = ? WHERE team_id = ? AND level = 1 AND started_at IS NULL"
  ).run(new Date().toISOString(), team.id);

  const token = signToken(team.id);

  // httpOnly signed cookie
  res.cookie('investigation_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  return res.json({
    ok: true,
    team: {
      id: team.id,
      name: team.name,
      code: team.code,
      kitNo: team.kit_no
    }
  });
});

/**
 * Sign-up at the machine.
 *
 * The organiser sets the kit number on each PC once per batch; the squad then
 * types the name they want and starts immediately. kit_no is deliberately NOT
 * unique across teams: kit 1 is reused by the first squad of every batch, and
 * those squads are never in the room at the same time.
 *
 * There is no password to remember. The session cookie is the auth. We hand
 * back a short recovery code so a squad that closes the tab can get back into
 * their own run instead of starting a second clock.
 */
const MAX_KIT = 8;
const RECOVERY_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679'; // no O/0, I/1, S/5, B/8

function makeRecoveryCode(): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += RECOVERY_ALPHABET[Math.floor(Math.random() * RECOVERY_ALPHABET.length)];
  }
  return out;
}

router.post('/register', (req, res) => {
  const rawName = typeof req.body?.teamName === 'string' ? req.body.teamName.trim() : '';
  const kitNo = parseInt(req.body?.kitNo, 10);

  if (!rawName) {
    return res.status(400).json({ error: 'Pick a team name first.' });
  }
  if (rawName.length < 2 || rawName.length > 40) {
    return res.status(400).json({ error: 'Team names run from 2 to 40 characters.' });
  }
  if (!Number.isInteger(kitNo) || kitNo < 1 || kitNo > MAX_KIT) {
    return res.status(400).json({ error: 'This machine has no kit number set. Ask an organiser.' });
  }

  const clash = db.prepare('SELECT id FROM teams WHERE lower(name) = lower(?)').get(rawName);
  if (clash) {
    return res.status(409).json({ error: 'Another squad has taken that name. Pick a different one.' });
  }

  // The recovery code doubles as the squad's sign-in code.
  let code = '';
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = makeRecoveryCode();
    if (!db.prepare('SELECT id FROM teams WHERE code = ?').get(candidate)) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return res.status(500).json({ error: 'Could not allocate a recovery code. Tell an organiser.' });
  }

  const id = 'team-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  db.prepare(
    'INSERT INTO teams (id, name, code, pass_hash, kit_no, members_json, created_at) ' +
    "VALUES (?, ?, ?, ?, ?, '[]', datetime('now'))"
  ).run(id, rawName, code, hashPassword(code), kitNo);

  initTeamLevelState(id);

  // The clock starts here, for this squad only. Batches are staggered, so a
  // 2pm squad must not inherit the 12pm squad's elapsed time.
  db.prepare(
    'UPDATE level_state SET started_at = ? WHERE team_id = ? AND level = 1 AND started_at IS NULL'
  ).run(new Date().toISOString(), id);

  res.cookie('investigation_session', signToken(id), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  return res.json({
    ok: true,
    recoveryCode: code,
    team: { id, name: rawName, code, kitNo }
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('investigation_session');
  res.clearCookie('investigation_admin');
  return res.json({ ok: true });
});

router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  const cookie = req.cookies?.investigation_session;
  const adminCookie = req.cookies?.investigation_admin;

  let teamData = null;
  let levelStates: LevelStateRow[] = [];
  let notebookText = '';
  let theoryData = null;

  if (cookie) {
    const teamId = verifyToken(cookie);
    if (teamId) {
      const team = db.prepare('SELECT id, name, code, kit_no, members_json FROM teams WHERE id = ?').get(teamId) as any;
      if (team) {
        teamData = {
          id: team.id,
          name: team.name,
          code: team.code,
          kitNo: team.kit_no,
          members: JSON.parse(team.members_json || '[]')
        };

        levelStates = db.prepare('SELECT * FROM level_state WHERE team_id = ? ORDER BY level ASC').all(teamId) as LevelStateRow[];
        const note = db.prepare('SELECT text FROM notebook WHERE team_id = ?').get(teamId) as { text: string } | undefined;
        notebookText = note?.text || '';

        theoryData = db.prepare('SELECT * FROM theory WHERE team_id = ?').get(teamId);
      }
    }
  }

  const isAdmin = adminCookie ? verifyToken(adminCookie) === 'admin' : false;

  return res.json({
    team: teamData,
    isAdmin,
    levelStates,
    notebook: notebookText,
    theory: theoryData,
    clock: getEventClock()
  });
});

export default router;
