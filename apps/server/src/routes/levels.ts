import { Router, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db.js';
import { requireTeamAuth, AuthenticatedRequest } from '../auth.js';
import { getEventClock } from '../event-clock.js';
import {
  getLevelMeta,
  getLevelStory,
  getLevelHints,
  getLevelReveal,
  getLevel2MorsePulses
} from '../content-loader.js';
import { validateAnswer } from '../level-validator.js';
import { broadcastLeaderboard } from '../sse.js';
import { LevelStateRow } from '../types.js';
import { rootDir } from '../config.js';

const router = Router();

/**
 * Mira's diary. `canonical` is what the answer key is hashed against; `token` is
 * the only thing the browser ever sees. Tokens are archive exhibit refs and carry
 * no ordering information.
 */
const DIARY_PAGES = [
  { canonical: 'P1', token: 'MV-73', text: 'The night after it happened. Julian was on the phone around quarter past nine, shouting Elias’s name. Alive. Much later I heard the side door open and a police radio—two quick chirps and a click—before any sirens or emergency call were logged. Nobody believes what I heard.' },
  { canonical: 'P2', token: 'MV-18', text: 'The morning of the funeral. The police report came out in the papers. It claims Julian was gone before nine o’clock. I keep shouting that the time is impossible, that he was talking to Elias, but my words sound hollow even to my own ears.' },
  { canonical: 'P3', token: 'MV-41', text: 'Three days after the funeral. Dr. Vane sat beside my chair. He said grief does violent things to perception, that my memories are mixing up the sequence. He spoke so calmly, like a physician prescribing certainty, telling me the clock in my mind is broken.' },
  { canonical: 'P4', token: 'MV-66', text: 'The Sunday after our session. Dr. Vane visited the flat again. He looked at my notebook on the table and gently asked me to stop writing things down. He said committing these fractured impressions to paper only cements false trauma.' },
  { canonical: 'P5', token: 'MV-05', text: 'The day after Elias told me to stop. I took the diary pages and the small wooden music box Julian gave me for my birthday and hid them beneath the floorboard. If I cannot write the truth, I must at least protect what Julian touched.' },
  { canonical: 'P6', token: 'MV-29', text: 'The first day I did not speak. Not a syllable. When words only serve to let others rearrange your reality, silence is the only fortress. I will not explain myself again until someone sees what really took place.' }
];

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic per-team shuffle: stable across refreshes, different per team. */
function getDiaryPagesFor(teamId: string) {
  const pages = DIARY_PAGES.map((p) => ({ id: p.token, label: `Loose sheet ${p.token}`, text: p.text }));
  let seed = seedFrom(teamId) || 1;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = pages.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pages[i], pages[j]] = [pages[j], pages[i]];
  }
  return pages;
}

/** Map a submitted token order back to the canonical ids the key is hashed against. */
function translateDiaryOrder(answer: string): string {
  const parts = String(answer).split(',').map((x) => x.trim().toUpperCase());
  const byToken = new Map(DIARY_PAGES.map((p) => [p.token.toUpperCase(), p.canonical]));
  if (parts.length !== DIARY_PAGES.length) return answer;
  const mapped = parts.map((t) => byToken.get(t));
  if (mapped.some((m) => !m)) return answer;
  return mapped.join(',');
}


// GET /api/levels - list of all levels with status
router.get('/', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.team!.id;
  const states = db.prepare('SELECT level, status, started_at, solved_at, skipped FROM level_state WHERE team_id = ? ORDER BY level ASC').all(teamId) as LevelStateRow[];

  const levelsList = [];
  for (let i = 1; i <= 10; i++) {
    const meta = getLevelMeta(i);
    const state = states.find(s => s.level === i) || { status: 'SEALED', started_at: null, solved_at: null, skipped: 0 };
    // Sealed (future) levels are never sent: no future titles, types or total count.
    if (state.status === 'SEALED') continue;
    levelsList.push({
      id: meta.id,
      title: meta.title,
      type: meta.type,
      estimatedMinutes: meta.estimated_minutes,
      softCapMinutes: meta.soft_cap_minutes,
      status: state.status,
      startedAt: state.started_at,
      solvedAt: state.solved_at,
      skipped: !!state.skipped
    });
  }

  // Same condition the header used to derive client-side from the full list.
  const theoryUnlocked = states.some(s => s.level === 10 && s.status === 'SOLVED');

  return res.json({ levels: levelsList, theoryUnlocked });
});

// GET /api/levels/:n - detail of level N
router.get('/:n', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const levelNum = parseInt(req.params.n, 10);
  if (isNaN(levelNum) || levelNum < 1 || levelNum > 10) {
    return res.status(404).json({ error: 'Level not found.' });
  }

  const teamId = req.team!.id;
  const state = db.prepare('SELECT * FROM level_state WHERE team_id = ? AND level = ?').get(teamId, levelNum) as LevelStateRow | undefined;

  if (!state || state.status === 'SEALED') {
    return res.status(403).json({ error: 'This level is sealed. Solve preceding cases to unlock.' });
  }

  const meta = getLevelMeta(levelNum);
  const story = getLevelStory(levelNum);
  const allHints = getLevelHints(levelNum);
  const hintsRevealed = allHints.slice(0, state.hints_used);

  let elapsedSeconds = 0;
  if (state.started_at) {
    const startMs = new Date(state.started_at).getTime();
    const endMs = state.solved_at ? new Date(state.solved_at).getTime() : Date.now();
    elapsedSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  }

  const softCapSeconds = meta.soft_cap_minutes * 60;
  const canSkip = false;
  const remainingUntilSkip = 0;

  const payload: any = {
    id: meta.id,
    title: meta.title,
    type: meta.type,
    tool: meta.tool,
    estimatedMinutes: meta.estimated_minutes,
    softCapMinutes: meta.soft_cap_minutes,
    stages: meta.stages,
    currentStageIndex: state.stage_index,
    story,
    hintsRevealed,
    hintsUsed: state.hints_used,
    totalHints: meta.hint_count,
    status: state.status,
    elapsedSeconds,
    canSkip,
    remainingUntilSkip,
    wrongAttempts: state.wrong_attempts,
    reveal: (state.status === 'SOLVED' || state.status === 'SKIPPED') ? getLevelReveal(levelNum) : null
  };

  // Attach tool-specific data
  if (levelNum === 1) {
    const logsPath = path.resolve(rootDir, 'content/assets-private/level1_logs.json');
    console.log('[Level 1] Working directory:', process.cwd());
    console.log('[Level 1] Logs path:', logsPath);
    console.log('[Level 1] File exists:', fs.existsSync(logsPath));
    if (fs.existsSync(logsPath)) {
      payload.logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
    }
  } else if (levelNum === 5) {
    payload.suspects = [
      { id: 'lena', name: 'Lena Vane', role: 'Wife', statement: 'I was at the charity dinner until midnight, then straight home.' },
      { id: 'daniel', name: 'Daniel Reed', role: 'Former Patient', statement: "I haven't been near Elias since my angry email months ago." },
      { id: 'clara', name: 'Clara Vane', role: 'Sister', statement: 'We barely spoke for months.' },
      { id: 'noah', name: 'Noah Mercer', role: 'Journalist', statement: 'I never went near that house.' },
      { id: 'adrian', name: 'Adrian Cross', role: 'Assistant', statement: "I left at 9:18 and was across the city at 10:21. Here's my photo." },
      { id: 'mira', name: 'Mira Vale', role: 'Former Patient', statement: 'Nothing I say will count.' }
    ];
    payload.evidenceCards = [
      { id: 'E1', title: 'E1: Clock & Desk Photographs', description: 'Crime scene photos of the smashed desk clock stopped at 22:17 with glass fragments.' },
      { id: 'E2', title: 'E2: Café & Bank Records', description: 'Four discrete bank payments and café receipts between Elias and Clara over the last eight weeks.' },
      { id: 'E3', title: 'E3: Parking Ticket & Doorbell Video', description: 'Charity dinner garage exit barrier ticket at 22:58, plus neighbour camera footage of Lena\'s sedan outside Keats Grove at 23:38.' },
      { id: 'E4', title: 'E4: Seaside Promenade Photograph', description: 'Photograph uploaded by Adrian Cross at 22:21 captioned with a coastal view.' },
      { id: 'E5', title: 'E5: Text Message Extract', description: 'SMS message sent from Daniel Reed\'s mobile to Dr. Elias Vane 48 hours prior: "This isn\'t over."' },
      { id: 'E6', title: 'E6: Desk Appointment Diary', description: 'Leather calendar agenda recording Dr. Vane\'s clinical consultations and scheduled commitments.' },
      { id: 'E7', title: 'E7: Private Hire Vehicle Dispatch', description: 'Licensed taxi dispatch record showing Noah Mercer dropped off on the corner of Keats Grove at 21:00.' },
      { id: 'E8', title: 'E8: Medical Examiner Preliminary Summary', description: 'Pathologist report establishing time of death 45 to 75 minutes post verified physical activity.' },
      { id: 'E9', title: 'E9: Audio Archive Session Three Transcript', description: 'Damaged transcript of Lena Vane disputing clinical certifications and professional liability.' }
    ];
  } else if (levelNum === 6) {
    // Pages carry opaque exhibit refs, never ordered ids. The old payload shipped
    // id:"P1".."P6" and the answer was those ids in ascending order, so sorting by
    // id solved the level. Display order is seeded per team so one team's ordering
    // cannot be read off another team's screen.
    payload.diaryPages = getDiaryPagesFor(teamId);
  } else if (levelNum === 7) {
    payload.photoUrl = `/api/levels/7/assets/l7_geo_photo.jpg`;
    const geoConfigPath = path.resolve(rootDir, 'content/assets-private/l7_geo_config.json');
    if (fs.existsSync(geoConfigPath)) {
      const geo = JSON.parse(fs.readFileSync(geoConfigPath, 'utf8'));
      payload.attribution = geo.attribution || 'Archive Photo';
    }
  } else if (levelNum === 8) {
    payload.kitNo = req.team!.kit_no;
  } else if (levelNum === 9) {
    payload.codeTemplates = {
      python: {
        code: `SHIFT_MIN = 42\nDROPPED_SOURCE = "LIAISON_4417"\nforged = "22:26"              # the only INTERIOR_PANEL row in the export\n\nhour, minute = forged.split(":")\ntotal = int(hour) * ___BLANK_1___ + int(minute)        # blank 1\ntotal = total ___BLANK_2___ SHIFT_MIN                   # blank 2\nreal_hour = total // 60\nreal_minute = total ___BLANK_3___ 60                    # blank 3\nprint(f"{real_hour:02d}{real_minute:02d}-{DROPPED_SOURCE[-4:]}")`,
        options: {
          b1: ['24', '60', '100', '3600'],
          b2: ['+', '-', '*', '//'],
          b3: ['//', '%', '/', '**']
        }
      },
      java: {
        code: `int shiftMin = 42;\nString droppedSource = "LIAISON_4417";\nString forged = "22:26";\n\nString[] parts = forged.split(":");\nint total = Integer.parseInt(parts[0]) * ___BLANK_1___ + Integer.parseInt(parts[1]);\ntotal = total ___BLANK_2___ shiftMin;\nint realHour = total / 60;\nint realMinute = total ___BLANK_3___ 60;\nSystem.out.printf("%02d%02d-%s\\n", realHour, realMinute, droppedSource.substring(droppedSource.length() - 4));`,
        options: {
          b1: ['24', '60', '100', '3600'],
          b2: ['+', '-', '*', '/'],
          b3: ['/', '%', '*', '&']
        }
      },
      cpp: {
        code: `const int SHIFT_MIN = 42;\nstd::string dropped_source = "LIAISON_4417";\nstd::string forged = "22:26";\n\nint hour = std::stoi(forged.substr(0, 2));\nint minute = std::stoi(forged.substr(3, 2));\nint total = hour * ___BLANK_1___ + minute;\ntotal = total ___BLANK_2___ SHIFT_MIN;\nint real_hour = total / 60;\nint real_minute = total ___BLANK_3___ 60;\nstd::cout << (real_hour < 10 ? "0" : "") << real_hour << (real_minute < 10 ? "0" : "") << real_minute << "-" << dropped_source.substr(dropped_source.length() - 4) << std::endl;`,
        options: {
          b1: ['24', '60', '100', '3600'],
          b2: ['+', '-', '*', '/'],
          b3: ['/', '%', '*', '&']
        }
      }
    };
  }

  return res.json(payload);
});

// GET /api/levels/2/morse - audio timing pulses
router.get('/2/morse', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const teamId = req.team!.id;
  const state = db.prepare('SELECT status FROM level_state WHERE team_id = ? AND level = 2').get(teamId) as { status: string } | undefined;
  if (!state || state.status === 'SEALED') {
    return res.status(403).json({ error: 'Level 2 is sealed.' });
  }

  return res.json(getLevel2MorsePulses());
});

// GET /api/levels/:n/assets/* - authenticated private asset route
router.get('/:n/assets/:assetName(*)', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const levelNum = parseInt(req.params.n, 10);
  const assetName = req.params.assetName;
  const teamId = req.team!.id;

  const state = db.prepare('SELECT status FROM level_state WHERE team_id = ? AND level = ?').get(teamId, levelNum) as { status: string } | undefined;
  if (!state || state.status === 'SEALED') {
    return res.status(403).json({ error: 'Asset forbidden. Level is sealed.' });
  }

  // Prevent directory traversal
  const safeAsset = path.normalize(assetName).replace(/^(\.\.[\/\\])+/, '');
  const assetPath = path.resolve(rootDir, 'content/assets-private', safeAsset);

  if (!fs.existsSync(assetPath)) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  return res.sendFile(assetPath);
});

// POST /api/levels/:n/submit - answer submission
router.post('/:n/submit', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const clock = getEventClock();
  if (!clock.canSubmit) {
    return res.status(400).json({ error: `Event is currently ${clock.state.toLowerCase()}. Submissions are closed.` });
  }

  const levelNum = parseInt(req.params.n, 10);
  const teamId = req.team!.id;
  const { stage = 0, answer } = req.body;

  if (answer === undefined || answer === null || String(answer).trim() === '') {
    return res.status(400).json({ error: 'Answer cannot be empty.' });
  }

  const state = db.prepare('SELECT * FROM level_state WHERE team_id = ? AND level = ?').get(teamId, levelNum) as LevelStateRow | undefined;
  if (!state || state.status !== 'OPEN') {
    return res.status(400).json({ error: 'Level is not open for submissions.' });
  }

  // Rate limiting: max 6 attempts per minute per level
  const oneMinAgo = new Date(Date.now() - 60000).toISOString();
  const recentCount = db.prepare(`
    SELECT count(*) as count FROM attempts
    WHERE team_id = ? AND level = ? AND created_at >= ?
  `).get(teamId, levelNum, oneMinAgo) as { count: number };

  if (recentCount.count >= 6) {
    return res.status(429).json({ error: 'Rate limit exceeded: maximum 6 submissions per minute.' });
  }

  // Lockout check: 10 consecutive wrong answers within 60s
  const last10 = db.prepare(`
    SELECT correct, created_at FROM attempts
    WHERE team_id = ? AND level = ?
    ORDER BY created_at DESC LIMIT 10
  `).all(teamId, levelNum) as Array<{ correct: number; created_at: string }>;

  if (last10.length >= 10 && last10.every(a => a.correct === 0)) {
    const newestAttempt = new Date(last10[0].created_at).getTime();
    if (Date.now() - newestAttempt < 60000) {
      const waitSec = Math.ceil((60000 - (Date.now() - newestAttempt)) / 1000);
      return res.status(429).json({ error: `Security lockout: 10 consecutive wrong attempts. Please wait ${waitSec} seconds.` });
    }
  }

  const meta = getLevelMeta(levelNum);
  const answerForCheck = levelNum === 6 ? translateDiaryOrder(String(answer)) : String(answer);
  const validation = validateAnswer({
    level: levelNum,
    stage,
    answer: answerForCheck,
    teamKitNo: req.team!.kit_no
  });

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO attempts (team_id, level, stage, answer_norm, correct, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teamId, levelNum, stage, String(answer).trim(), validation.correct ? 1 : 0, now);

  if (validation.correct) {
    const isLastStage = stage >= (meta.stages.length - 1);

    if (!isLastStage) {
      // Advance stage
      db.prepare(`
        UPDATE level_state
        SET stage_index = stage_index + 1
        WHERE team_id = ? AND level = ?
      `).run(teamId, levelNum);

      return res.json({
        correct: true,
        solved: false,
        nextStage: true,
        newStageIndex: stage + 1
      });
    } else {
      // Solve level
      const reveal = getLevelReveal(levelNum);
      db.prepare(`
        UPDATE level_state
        SET status = 'SOLVED', solved_at = ?
        WHERE team_id = ? AND level = ?
      `).run(now, teamId, levelNum);

      // Open level N+1
      if (levelNum < 10) {
        db.prepare(`
          UPDATE level_state
          SET status = 'OPEN', started_at = ?
          WHERE team_id = ? AND level = ?
        `).run(now, teamId, levelNum + 1);
      }

      broadcastLeaderboard();

      return res.json({
        correct: true,
        solved: true,
        reveal,
        nextLevelOpen: levelNum < 10
      });
    }
  } else {
    // Wrong answer
    db.prepare(`
      UPDATE level_state
      SET wrong_attempts = wrong_attempts + 1
      WHERE team_id = ? AND level = ?
    `).run(teamId, levelNum);

    const attemptsLeft = Math.max(0, 6 - (recentCount.count + 1));

    return res.json({
      correct: false,
      nudge: validation.nudge,
      freeAttemptsLeft: attemptsLeft
    });
  }
});

// POST /api/levels/:n/hint - unlock next hint tier
router.post('/:n/hint', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const levelNum = parseInt(req.params.n, 10);
  const teamId = req.team!.id;

  const state = db.prepare('SELECT * FROM level_state WHERE team_id = ? AND level = ?').get(teamId, levelNum) as LevelStateRow | undefined;
  if (!state || state.status === 'SEALED') {
    return res.status(403).json({ error: 'Level is sealed.' });
  }

  const allHints = getLevelHints(levelNum);
  const newHintsUsed = Math.min(allHints.length, state.hints_used + 1);

  db.prepare(`
    UPDATE level_state
    SET hints_used = ?
    WHERE team_id = ? AND level = ?
  `).run(newHintsUsed, teamId, levelNum);

  return res.json({
    hintsUsed: newHintsUsed,
    hintText: allHints[newHintsUsed - 1],
    allRevealed: allHints.slice(0, newHintsUsed)
  });
});

// POST /api/levels/:n/skip - soft cap skip disabled
router.post('/:n/skip', requireTeamAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.status(403).json({ error: 'Level skipping is disabled. All case files must be solved directly.' });
});

// POST /api/levels/9/check-blanks - check blanks without revealing answer
router.post('/9/check-blanks', requireTeamAuth, (req: AuthenticatedRequest, res: Response) => {
  const { picks } = req.body;
  if (!Array.isArray(picks) || picks.length !== 3) {
    return res.status(400).json({ error: 'Expected 3 picks.' });
  }

  const correctBlanks = ['60', '+', '%'];
  const results = [
    String(picks[0]).trim() === correctBlanks[0],
    String(picks[1]).trim() === correctBlanks[1],
    String(picks[2]).trim() === correctBlanks[2]
  ];

  return res.json({ results });
});

export default router;
