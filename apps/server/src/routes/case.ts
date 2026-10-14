import { Router, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../db.js';
import { requireTeamAuth, AuthenticatedRequest } from '../auth.js';
import { rootDir } from '../config.js';
import { resolveTemplates } from '../content-loader.js';

const router = Router();

interface CastField { k: string; v: string; at: number }
interface CastPerson {
  id: string;
  name: string;
  short: string;
  age: number;
  role: string;
  introducedAt: number;
  standing: string;
  portraitKey: string;
  summary: string;
  fields: CastField[];
}
interface BoardChange { who: string; to: string; why: string }
interface Beat {
  id: number;
  title: string;
  place: string;
  time: string;
  arrive: string;
  depart: string;
  belief: string;
  openQuestion: string;
  board: BoardChange[];
}

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(rootDir, rel), 'utf8')) as T;
}

/**
 * GET /api/case
 *
 * The whole investigation state in one call, filtered by what this team has
 * actually earned. A beat that is still sealed contributes nothing: not its
 * title, not its board changes, not the people it would introduce.
 *
 * Gating rules:
 *   reached(n)  -> beat n is OPEN, SOLVED or SKIPPED  (we are there, or past it)
 *   closed(n)   -> beat n is SOLVED or SKIPPED        (we finished it)
 *
 * A person appears once their introducing beat is REACHED, but their facts and
 * their standing only move once a beat is CLOSED. So the team meets someone
 * before they learn anything about them, which is how an investigation works.
 */
router.get('/', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.team!.id;

  const states = db
    .prepare('SELECT level, status FROM level_state WHERE team_id = ? ORDER BY level ASC')
    .all(teamId) as Array<{ level: number; status: string }>;

  const statusOf = new Map(states.map((s) => [s.level, s.status]));
  const closed = (n: number) => {
    const s = statusOf.get(n);
    return s === 'SOLVED' || s === 'SKIPPED';
  };
  const reached = (n: number) => {
    const s = statusOf.get(n);
    return s === 'OPEN' || s === 'SOLVED' || s === 'SKIPPED';
  };

  const cast = readJson<{ setting: any; standings: any; people: CastPerson[] }>('content/cast.json');
  const scenes = readJson<{ opening: any; beats: Beat[]; closing: any }>('content/scenes.json');

  const currentBeat = states.find((s) => s.status === 'OPEN')?.level ?? null;
  const closedCount = states.filter((s) => s.status === 'SOLVED' || s.status === 'SKIPPED').length;

  // ── Board standings: replay every closed beat in order ──────────────────
  const standing = new Map<string, { to: string; why: string }>();
  for (const p of cast.people) {
    standing.set(p.id, { to: p.standing, why: '' });
  }
  for (const beat of scenes.beats) {
    if (!closed(beat.id)) continue;
    for (const change of beat.board || []) {
      standing.set(change.who, { to: change.to, why: change.why });
    }
  }

  // ── People, filtered ────────────────────────────────────────────────────
  const people = cast.people
    .filter((p) => p.introducedAt === 0 || reached(p.introducedAt))
    .map((p) => {
      const st = standing.get(p.id)!;
      return {
        id: p.id,
        name: p.name,
        short: p.short,
        age: p.age,
        role: p.role,
        portraitKey: p.portraitKey,
        summary: resolveTemplates(p.summary),
        standing: st.to,
        standingWhy: st.why,
        standingLabel: cast.standings[st.to]?.label ?? st.to,
        standingTone: cast.standings[st.to]?.tone ?? 'neutral',
        introducedAt: p.introducedAt,
        // Facts only once the beat that produced them is finished.
        fields: p.fields
          .filter((f) => f.at === 0 || closed(f.at))
          .map((f) => ({ k: f.k, v: resolveTemplates(f.v), at: f.at }))
      };
    });

  // ── Scenes, filtered ────────────────────────────────────────────────────
  const beats = scenes.beats
    .filter((b) => reached(b.id))
    .map((b) => {
      const isClosed = closed(b.id);
      return {
        id: b.id,
        title: b.title,
        place: b.place,
        time: b.time,
        arrive: resolveTemplates(b.arrive),
        closed: isClosed,
        current: b.id === currentBeat,
        // Everything below is the consequence of solving. Sealed until then.
        depart: isClosed ? resolveTemplates(b.depart) : null,
        belief: isClosed ? resolveTemplates(b.belief) : null,
        openQuestion: isClosed ? resolveTemplates(b.openQuestion) : null,
        board: isClosed
          ? (b.board || []).map((c) => ({
              who: c.who,
              name: cast.people.find((p) => p.id === c.who)?.name ?? c.who,
              to: c.to,
              toLabel: cast.standings[c.to]?.label ?? c.to,
              tone: cast.standings[c.to]?.tone ?? 'neutral',
              why: resolveTemplates(c.why)
            }))
          : []
      };
    });

  const allClosed = scenes.beats.every((b) => closed(b.id));

  return res.json({
    setting: cast.setting,
    standings: cast.standings,
    opening: {
      title: scenes.opening.title,
      place: resolveTemplates(scenes.opening.place),
      time: scenes.opening.time,
      text: resolveTemplates(scenes.opening.text),
      openQuestion: resolveTemplates(scenes.opening.openQuestion)
    },
    closing: allClosed ? scenes.closing : null,
    people,
    beats,
    currentBeat,
    closedCount,
    totalBeats: scenes.beats.length
  });
});

export default router;
