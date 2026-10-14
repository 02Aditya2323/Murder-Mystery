import { Response } from 'express';
import { db } from './db.js';
import { LeaderboardEntry } from './types.js';
import { getEventClock } from './event-clock.js';

interface Client {
  id: number;
  res: Response;
}

let clients: Client[] = [];
let nextClientId = 1;
let hideLeaderboard = false;

export function setHideLeaderboard(hide: boolean) {
  hideLeaderboard = hide;
  broadcastLeaderboard();
}

export function isLeaderboardHidden() {
  return hideLeaderboard;
}

export function registerSSEClient(res: Response): number {
  const clientId = nextClientId++;
  clients.push({ id: clientId, res });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial data immediately
  sendToClient(res, 'event', getEventClock());
  sendToClient(res, 'leaderboard', getLeaderboardData());

  return clientId;
}

export function unregisterSSEClient(clientId: number) {
  clients = clients.filter(c => c.id !== clientId);
}

function sendToClient(res: Response, event: string, data: any) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function broadcast(event: string, data: any) {
  for (const client of clients) {
    try {
      sendToClient(client.res, event, data);
    } catch (e) {
      // Ignore dropped connection; will be cleaned up on close
    }
  }
}

export function broadcastEventUpdate() {
  broadcast('event', getEventClock());
}

export function broadcastToast(message: string, severity: 'info' | 'warning' | 'alert' = 'info') {
  broadcast('toast', { message, severity, timestamp: new Date().toISOString() });
}

export function getLeaderboardData(): { hidden: boolean; entries: LeaderboardEntry[] } {
  if (hideLeaderboard) {
    return { hidden: true, entries: [] };
  }

  const teams = db.prepare('SELECT id, name, kit_no FROM teams').all() as Array<{
    id: string;
    name: string;
    kit_no: number;
  }>;

  const entries: LeaderboardEntry[] = [];

  for (const t of teams) {
    const states = db.prepare(`
      SELECT level, status, started_at, solved_at, hints_used, wrong_attempts, skipped, penalty_seconds
      FROM level_state
      WHERE team_id = ?
      ORDER BY level ASC
    `).all(t.id) as Array<{
      level: number;
      status: string;
      started_at: string | null;
      solved_at: string | null;
      hints_used: number;
      wrong_attempts: number;
      skipped: number;
      penalty_seconds: number;
    }>;

    let solvedCount = 0;
    let skippedCount = 0;
    let totalElapsedSeconds = 0;
    let totalHints = 0;
    let totalWrongs = 0;
    let currentLevel = 1;
    let lastSolvedAt: string | null = null;
    let totalPenaltySeconds = 0;

    for (const s of states) {
      totalHints += s.hints_used;
      totalWrongs += s.wrong_attempts;
      // Hint time is charged whether or not the level was ever finished.
      totalPenaltySeconds += s.penalty_seconds || 0;

      if (s.status === 'SOLVED') {
        solvedCount++;
        if (s.started_at && s.solved_at) {
          const dur = Math.max(0, Math.floor((new Date(s.solved_at).getTime() - new Date(s.started_at).getTime()) / 1000));
          totalElapsedSeconds += dur;
        }
        if (!lastSolvedAt || (s.solved_at && new Date(s.solved_at) > new Date(lastSolvedAt))) {
          lastSolvedAt = s.solved_at;
        }
      } else if (s.status === 'SKIPPED') {
        skippedCount++;
        if (s.started_at && s.solved_at) {
          const dur = Math.max(0, Math.floor((new Date(s.solved_at).getTime() - new Date(s.started_at).getTime()) / 1000));
          totalElapsedSeconds += dur;
        }
      }

      if (s.status === 'OPEN') {
        currentLevel = s.level;
      }
    }

    entries.push({
      teamId: t.id,
      teamName: t.name,
      kitNo: t.kit_no,
      levelsSolved: solvedCount,
      levelsSkipped: skippedCount,
      currentLevel,
      totalElapsedSeconds: totalElapsedSeconds + totalPenaltySeconds,
      rawElapsedSeconds: totalElapsedSeconds,
      penaltySeconds: totalPenaltySeconds,
      totalHintsUsed: totalHints,
      totalWrongAttempts: totalWrongs,
      lastSolvedAt
    });
  }

  // Ranking: Levels solved descending, then total elapsed seconds ascending
  entries.sort((a, b) => {
    if (b.levelsSolved !== a.levelsSolved) {
      return b.levelsSolved - a.levelsSolved;
    }
    if (a.totalElapsedSeconds !== b.totalElapsedSeconds) {
      return a.totalElapsedSeconds - b.totalElapsedSeconds;
    }
    if (a.lastSolvedAt && b.lastSolvedAt) {
      return new Date(a.lastSolvedAt).getTime() - new Date(b.lastSolvedAt).getTime();
    }
    return 0;
  });

  return { hidden: false, entries };
}

export function broadcastLeaderboard() {
  broadcast('leaderboard', getLeaderboardData());
}
