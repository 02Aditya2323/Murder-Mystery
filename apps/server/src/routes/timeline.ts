import { Router, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db.js';
import { requireTeamAuth, AuthenticatedRequest } from '../auth.js';
import { rootDir } from '../config.js';

const router = Router();

interface TimelineEvent {
  id: string;
  level: number;
  sort: string;
  when: string;
  text: string;
}

let cache: TimelineEvent[] | null = null;

function loadEvents(): TimelineEvent[] {
  if (!cache) {
    const file = path.resolve(rootDir, 'content/timeline.json');
    cache = JSON.parse(fs.readFileSync(file, 'utf8')).events as TimelineEvent[];
  }
  return cache;
}

// GET /api/timeline: events discovered so far.
// An event is returned only once its level is SOLVED or SKIPPED (the same
// moment the level's reveal is shown), so future events are never sent.
router.get('/', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare('SELECT level FROM level_state WHERE team_id = ? AND (status = ? OR status = ?)')
    .all(req.team!.id, 'SOLVED', 'SKIPPED') as Array<{ level: number }>;
  const done = new Set(rows.map((r) => r.level));

  const events = loadEvents()
    .filter((e) => done.has(e.level))
    .sort((a, b) => a.sort.localeCompare(b.sort));
  return res.json({ events });
});

export default router;
