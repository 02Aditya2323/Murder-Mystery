export type LevelStatus = 'SEALED' | 'OPEN' | 'SOLVED' | 'SKIPPED';
export type EventState = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED';

export interface TeamInfo {
  id: string;
  name: string;
  code: string;
  kitNo: number;
  members: string[];
}

export interface LevelSummary {
  id: number;
  title: string;
  type: string;
  estimatedMinutes: number;
  softCapMinutes: number;
  status: LevelStatus;
  startedAt: string | null;
  solvedAt: string | null;
  skipped: boolean;
}

export interface LevelStage {
  index: number;
  name: string;
  instruction: string;
}

export interface LevelDetail {
  id: number;
  title: string;
  type: string;
  tool: string;
  estimatedMinutes: number;
  softCapMinutes: number;
  stages: LevelStage[];
  currentStageIndex: number;
  story: string;
  hintsRevealed: string[];
  hintsUsed: number;
  totalHints: number;
  status: LevelStatus;
  elapsedSeconds: number;
  canSkip: boolean;
  remainingUntilSkip: number;
  wrongAttempts: number;
  reveal: string | null;

  // Tool specific data
  logs?: any[];
  suspects?: any[];
  evidenceCards?: any[];
  diaryPages?: any[];
  photoUrl?: string;
  attribution?: string;
  kitNo?: number;
  codeTemplates?: any;
}

export interface EventClock {
  state: EventState;
  startedAt: string | null;
  endedAt: string | null;
  pausedTotalMs: number;
  banner: string | null;
  totalDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  canSubmit: boolean;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  kitNo: number;
  levelsSolved: number;
  levelsSkipped: number;
  currentLevel: number;
  totalElapsedSeconds: number;
  rawElapsedSeconds?: number;
  penaltySeconds?: number;
  totalHintsUsed: number;
  totalWrongAttempts: number;
  lastSolvedAt: string | null;
}
