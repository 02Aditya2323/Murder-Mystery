import { create } from 'zustand';
import { api, type TermEntry, type TimelineEvent } from '../api/client.js';
import {
  TeamInfo,
  LevelSummary,
  LevelDetail,
  EventClock,
  LeaderboardEntry
} from '../types.js';

interface Toast {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
}

interface EvidenceCard {
  level: number;
  title: string;
  text: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  classification: string;
  status: string;
  knownFacts: string[];
  timeline: string[];
  linkedEvidence: string[];
  redacted: boolean;
  patientCode?: string;
}

interface GameState {
  team: TeamInfo | null;
  isAdmin: boolean;
  levels: LevelSummary[];
  theoryUnlocked: boolean;
  selectedLevelId: number;
  levelDetail: LevelDetail | null;
  loadingLevel: boolean;
  notebookText: string;
  notebookSaved: boolean;
  eventClock: EventClock | null;
  leaderboard: LeaderboardEntry[];
  leaderboardHidden: boolean;
  toasts: Toast[];
  newlyUnlockedClue: { level: number; title: string; text: string } | null;
  evidenceBoard: EvidenceCard[];
  isTheoryModalOpen: boolean;
  isPrintModalOpen: boolean;
  activeDrawerTab: 'notebook' | 'hints' | 'leaderboard';
  characters: CharacterProfile[];
  terms: TermEntry[];
  timeline: TimelineEvent[];
  caseData: any | null;

  // Actions
  init: () => Promise<void>;
  selectLevel: (levelId: number) => Promise<void>;
  submitAnswer: (answer: string) => Promise<{ correct: boolean; nudge?: string }>;
  requestHint: () => Promise<void>;
  skipLevel: () => Promise<void>;
  setNotebookText: (text: string) => void;
  saveNotebook: () => Promise<void>;
  addToast: (message: string, severity?: 'info' | 'warning' | 'alert') => void;
  removeToast: (id: string) => void;
  closeClueModal: () => void;
  setTheoryModalOpen: (open: boolean) => void;
  setPrintModalOpen: (open: boolean) => void;
  setActiveDrawerTab: (tab: 'notebook' | 'hints' | 'leaderboard') => void;
  loadCharacters: () => Promise<void>;
  loadCase: () => Promise<void>;
  loadTerms: () => Promise<void>;
  loadTimeline: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  team: null,
  isAdmin: false,
  levels: [],
  theoryUnlocked: false,
  selectedLevelId: 1,
  levelDetail: null,
  loadingLevel: false,
  notebookText: '',
  notebookSaved: true,
  eventClock: null,
  leaderboard: [],
  leaderboardHidden: false,
  toasts: [],
  newlyUnlockedClue: null,
  evidenceBoard: [],
  isTheoryModalOpen: false,
  isPrintModalOpen: false,
  activeDrawerTab: 'notebook',
  characters: [],
  terms: [],
  timeline: [],
  caseData: null,

  init: async () => {
    try {
      const me = await api.getMe();
      set({
        team: me.team,
        isAdmin: me.isAdmin,
        eventClock: me.clock,
        notebookText: me.notebook || ''
      });

      if (me.team) {
        await get().loadCharacters();
        await get().loadTerms();
        await get().loadTimeline();
        await get().loadCase();

        const levelsRes = await api.getLevels();
        const levelsList: LevelSummary[] = levelsRes.levels;
        set({ levels: levelsList, theoryUnlocked: !!levelsRes.theoryUnlocked });

        // Find active level (first OPEN or SOLVED or 1)
        const openLevel = levelsList.find(l => l.status === 'OPEN') || levelsList[0];
        const initialLevelId = openLevel ? openLevel.id : 1;
        set({ selectedLevelId: initialLevelId });

        // Fetch detail
        await get().selectLevel(initialLevelId);

        // Fetch unlocked clue cards for Evidence Board
        const evidence: EvidenceCard[] = [];
        for (const l of levelsList) {
          if (l.status === 'SOLVED' || l.status === 'SKIPPED') {
            try {
              const d = await api.getLevelDetail(l.id);
              if (d.reveal) {
                evidence.push({ level: l.id, title: l.title, text: d.reveal });
              }
            } catch (e) {
              // ignore
            }
          }
        }
        set({ evidenceBoard: evidence });

        // Start SSE Stream
        const sse = new EventSource('/api/leaderboard/stream');
        sse.addEventListener('event', (e) => {
          const clockData = JSON.parse(e.data);
          set({ eventClock: clockData });
        });
        sse.addEventListener('leaderboard', (e) => {
          const lbData = JSON.parse(e.data);
          set({
            leaderboardHidden: lbData.hidden,
            leaderboard: lbData.entries
          });
        });
        sse.addEventListener('toast', (e) => {
          const toastData = JSON.parse(e.data);
          get().addToast(toastData.message, toastData.severity);
        });
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
  },

  selectLevel: async (levelId: number) => {
    set({ loadingLevel: true, selectedLevelId: levelId });
    try {
      const detail: LevelDetail = await api.getLevelDetail(levelId);
      set({ levelDetail: detail, loadingLevel: false });
    } catch (err: any) {
      set({ loadingLevel: false });
      get().addToast(err.message || 'Could not load level file', 'warning');
    }
  },

  submitAnswer: async (answer: string) => {
    const { selectedLevelId, levelDetail } = get();
    if (!levelDetail) return { correct: false };

    try {
      const res = await api.submitAnswer(selectedLevelId, levelDetail.currentStageIndex, answer);

      if (res.correct) {
        if (res.solved) {
          // Level solved! Add to evidence board & show clue modal
          const newCard = { level: selectedLevelId, title: levelDetail.title, text: res.reveal };
          set((state) => ({
            evidenceBoard: [...state.evidenceBoard.filter(c => c.level !== selectedLevelId), newCard],
            newlyUnlockedClue: newCard,
          }));

          // Refresh levels list and current detail
          const levelsRes = await api.getLevels();
          set({ levels: levelsRes.levels, theoryUnlocked: !!levelsRes.theoryUnlocked });
          await get().loadCharacters();
          await get().loadTerms();
          await get().loadTimeline();
          await get().loadCase();
          await get().selectLevel(selectedLevelId);
        } else if (res.nextStage) {
          // Advance to next stage in current level
          await get().selectLevel(selectedLevelId);
        }
        return { correct: true };
      } else {
        // Wrong answer: Update wrongAttempts quietly without toggling loadingLevel or unmounting active tool
        set((state) => {
          if (!state.levelDetail) return state;
          return {
            levelDetail: {
              ...state.levelDetail,
              wrongAttempts: (state.levelDetail.wrongAttempts || 0) + 1
            }
          };
        });

        if (res.nudge) {
          get().addToast(`Case Note: ${res.nudge}`, 'warning');
        } else {
          get().addToast('Incorrect deduction. Re-examine the case file and try again.', 'alert');
        }
        return { correct: false, nudge: res.nudge };
      }
    } catch (err: any) {
      get().addToast(err.message || 'Submission failed', 'alert');
      return { correct: false, nudge: err.message };
    }
  },

  requestHint: async () => {
    const { selectedLevelId } = get();
    try {
      const res = await api.requestHint(selectedLevelId);
      set((state) => {
        if (!state.levelDetail) return state;
        return {
          levelDetail: {
            ...state.levelDetail,
            hintsUsed: res.hintsUsed,
            hintsRevealed: res.allRevealed
          },
          activeDrawerTab: 'hints'
        };
      });
      get().addToast(`Hint Tier ${res.hintsUsed} unlocked`, 'info');
    } catch (err: any) {
      get().addToast(err.message || 'Could not unlock hint', 'warning');
    }
  },

  skipLevel: async () => {
    get().addToast('Level skipping is disabled for this investigation. All cases must be solved.', 'warning');
  },

  setNotebookText: (text: string) => {
    set({ notebookText: text, notebookSaved: false });
  },

  saveNotebook: async () => {
    const { notebookText } = get();
    try {
      await api.saveNotebook(notebookText);
      set({ notebookSaved: true });
    } catch (err) {
      console.error('Failed to autosave notebook:', err);
    }
  },

  addToast: (message: string, severity: 'info' | 'warning' | 'alert' = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const newToast: Toast = { id, message, severity };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 5500);
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  closeClueModal: () => {
    set({ newlyUnlockedClue: null });
  },

  setTheoryModalOpen: (open: boolean) => {
    set({ isTheoryModalOpen: open });
  },

  setPrintModalOpen: (open: boolean) => {
    set({ isPrintModalOpen: open });
  },

  setActiveDrawerTab: (
    tab: 'notebook' | 'hints' | 'leaderboard'
  ) => {
    set({ activeDrawerTab: tab });
  },
loadTimeline: async () => {
  try {
    const response = await api.getTimeline();
    set({ timeline: response.events ?? [] });
  } catch (err) {
    console.error('Failed to load timeline:', err);
  }
},
loadTerms: async () => {
  try {
    const response = await api.getTerms();
    set({ terms: response.terms ?? [] });
  } catch (err) {
    console.error('Failed to load important terms:', err);
  }
},
loadCharacters: async () => {
  try {
    const response = await api.getCharacters();
    set({ characters: response.characters ?? [] });
  } catch (err) {
    console.error('Failed to load character profiles:', err);
  }
},
loadCase: async () => {
  try {
    const response = await api.getCase();
    set({ caseData: response });
  } catch (err) {
    console.error('Failed to load case state:', err);
  }
},
  logout: async () => {
    await api.logout();
    set({ team: null, isAdmin: false, levelDetail: null, levels: [], theoryUnlocked: false });
    window.location.href = '/enter';
  }
}));
