import { Router, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db.js';
import { requireTeamAuth, AuthenticatedRequest } from '../auth.js';
import { rootDir } from '../config.js';

const router = Router();

interface TermEntry {
  id: string;
  level: number;
  term: string;
  category: string;
  description: string;
}

let cache: TermEntry[] | null = null;

function loadTerms(): TermEntry[] {
  if (!cache) {
    const file = path.resolve(rootDir, 'content/terms.json');
    cache = JSON.parse(fs.readFileSync(file, 'utf8')).terms as TermEntry[];
  }
  return cache;
}

// GET /api/terms — important terms found so far.
// A term is returned only once its level is SOLVED or SKIPPED (the same
// moment the level's reveal is shown), so future terms are never sent.
router.get('/', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const rows = db
    .prepare('SELECT level FROM level_state WHERE team_id = ? AND (status = ? OR status = ?)')
    .all(req.team!.id, 'SOLVED', 'SKIPPED') as Array<{ level: number }>;
  const done = new Set(rows.map((r) => r.level));

  const terms = loadTerms().filter((t) => done.has(t.level));
  return res.json({ terms });
});

export default router;
