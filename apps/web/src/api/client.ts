export interface TimelineEvent {
  id: string;
  level: number;
  sort: string;
  when: string;
  text: string;
}

export interface TermEntry {
  id: string;
  level: number;
  term: string;
  category: string;
  description: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'include'
  });

  const contentType = res.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : `Request failed with status ${res.status}`);
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (code: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ code, password }) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),

  // Levels
  getLevels: () => apiRequest<{ levels: any[]; theoryUnlocked: boolean }>('/levels'),
  getLevelDetail: (level: number) => apiRequest(`/levels/${level}`),
  submitAnswer: (level: number, stage: number, answer: string) =>
    apiRequest(`/levels/${level}/submit`, { method: 'POST', body: JSON.stringify({ stage, answer }) }),
  requestHint: (level: number) =>
    apiRequest(`/levels/${level}/hint`, { method: 'POST' }),
  skipLevel: (level: number) =>
    apiRequest(`/levels/${level}/skip`, { method: 'POST' }),
  getMorseData: () => apiRequest('/levels/2/morse'),
  checkBlanks: (picks: string[]) =>
    apiRequest('/levels/9/check-blanks', { method: 'POST', body: JSON.stringify({ picks }) }),
  getTimeline: () => apiRequest<{ events: TimelineEvent[] }>('/timeline'),
  getTerms: () => apiRequest<{ terms: TermEntry[] }>('/terms'),
  getCharacters: () => apiRequest<{ characters: any[]; levelsCompleted: number }>('/characters'),
  getCase: () => apiRequest<any>('/case'),

  // Notebook
  getNotebook: () => apiRequest('/notebook'),
  saveNotebook: (text: string) =>
    apiRequest('/notebook', { method: 'PUT', body: JSON.stringify({ text }) }),

  // Theory
  getTheory: () => apiRequest('/theory'),
  saveTheory: (body: any) =>
    apiRequest('/theory', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  adminLogin: (password: string) =>
    apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminLogout: () => apiRequest('/admin/logout', { method: 'POST' }),
  getAdminOverview: () => apiRequest('/admin/overview'),
  setEventAction: (action: string) =>
    apiRequest('/admin/event/action', { method: 'POST', body: JSON.stringify({ action }) }),
  setBanner: (banner: string | null, toastMessage?: string, severity?: string) =>
    apiRequest('/admin/event/banner', { method: 'POST', body: JSON.stringify({ banner, toastMessage, severity }) }),
  toggleLeaderboard: (hide: boolean) =>
    apiRequest('/admin/event/leaderboard-visibility', { method: 'POST', body: JSON.stringify({ hide }) }),
  importTeams: (csvText: string, replaceExisting: boolean = false) =>
    apiRequest('/admin/teams/import', { method: 'POST', body: JSON.stringify({ csvText, replaceExisting }) }),
  getKits: () => apiRequest('/admin/kits'),
  updateKit: (kit_no: number, answer: string, alternates: string[]) =>
    apiRequest('/admin/kits/update', { method: 'POST', body: JSON.stringify({ kit_no, answer, alternates }) }),
  manualOverride: (team_id: string, level: number, action: string, reason: string) =>
    apiRequest('/admin/override', { method: 'POST', body: JSON.stringify({ team_id, level, action, reason }) }),
  getTheories: () => apiRequest('/admin/theories'),
  reviewTheory: (teamId: string, marks: any, reviewedBy?: string) =>
    apiRequest(`/admin/theories/${teamId}/review`, {
      method: 'POST',
      body: JSON.stringify({ marks, reviewedBy })
    }),
  getAdminLevelPreview: (level: number) =>
    apiRequest(`/admin/level-preview/${level}`)
};

