export type LevelStatus = 'SEALED' | 'OPEN' | 'SOLVED' | 'SKIPPED';
export type EventState = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED';

export interface Team {
  id: string;
  name: string;
  code: string;
  pass_hash: string;
  kit_no: number;
  members_json: string;
  created_at: string;
}

export interface Kit {
  kit_no: number;
  answer_hash: string;
  alternates_json: string;
  updated_at: string;
}

export interface Session {
  id: string;
  team_id: string;
  created_at: string;
  last_seen: string;
}

export interface LevelStateRow {
  team_id: string;
  level: number;
  status: LevelStatus;
  started_at: string | null;
  solved_at: string | null;
  stage_index: number;
  hints_used: number;
  wrong_attempts: number;
  skipped: number; // 0 or 1
  penalty_seconds: number; // hint time charged against this level
}

export interface AttemptRow {
  id: number;
  team_id: string;
  level: number;
  stage: number;
  answer_norm: string;
  correct: number; // 0 or 1
  created_at: string;
}

export interface NotebookRow {
  team_id: string;
  text: string;
  updated_at: string;
}

export interface TheoryRow {
  team_id: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  submitted_at: string;
  marks_json: string | null;
  reviewed_by: string | null;
}

export interface EventRow {
  id: number;
  state: EventState;
  started_at: string | null;
  paused_total_ms: number;
  pause_started_at: string | null;
  ended_at: string | null;
  banner: string | null;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  kitNo: number;
  levelsSolved: number;
  levelsSkipped: number;
  currentLevel: number;
  totalElapsedSeconds: number;
  rawElapsedSeconds: number;
  penaltySeconds: number;
  totalHintsUsed: number;
  totalWrongAttempts: number;
  lastSolvedAt: string | null;
}
