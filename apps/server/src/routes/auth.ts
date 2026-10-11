import { Router, Response } from 'express';
import { db, hashPassword } from '../db.js';
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
