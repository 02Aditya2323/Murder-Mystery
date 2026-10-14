import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import { MarkdownText } from '../components/LevelWorkspace.js';
import {
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Square,
  Radio,
  Eye,
  EyeOff,
  Upload,
  Download,
  Cpu,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LogOut
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'live' | 'teams' | 'kits' | 'overrides' | 'theories' | 'preview'
  >('live');

  const [previewLevel, setPreviewLevel] = useState(1);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Broadcast state
  const [bannerText, setBannerText] = useState('');
  const [toastText, setToastText] = useState('');

  // Teams import
  const [csvInput, setCsvInput] = useState('');
  const [replaceTeams, setReplaceTeams] = useState(false);

  // Kit answers
  const [selectedKitNo, setSelectedKitNo] = useState(1);
  const [kitAnswerInput, setKitAnswerInput] = useState('');
  const [kitAltsInput, setKitAltsInput] = useState('');

  // Overrides
  const [overrideTeamId, setOverrideTeamId] = useState('');
  const [overrideLevel, setOverrideLevel] = useState(1);
  const [overrideAction, setOverrideAction] = useState<'UNLOCK' | 'RESET'>('UNLOCK');
  const [overrideReason, setOverrideReason] = useState('');

  // Theories
  const [theoriesData, setTheoriesData] = useState<any>(null);
  const [selectedTheoryTeamId, setSelectedTheoryTeamId] = useState<string>('');
  const [marksState, setMarksState] = useState<Record<string, string>>({});
  const [theoryNotes, setTheoryNotes] = useState('');

  const fetchOverview = async () => {
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
      if (data.liveBoard && data.liveBoard.length > 0 && !overrideTeamId) {
        setOverrideTeamId(data.liveBoard[0].team.id);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      navigate('/hq');
    } finally {
      setLoading(false);
    }
  };

  const fetchTheories = async () => {
    try {
      const data = await api.getTheories();
      setTheoriesData(data);
      if (data.theories && data.theories.length > 0 && !selectedTheoryTeamId) {
        setSelectedTheoryTeamId(data.theories[0].team_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLevelPreview = async (level: number) => {
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewData(null);

    try {
      const data = await api.getAdminLevelPreview(level);
      setPreviewData(data);
    } catch (error: any) {
      setPreviewError(error.message || 'Unable to load level preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'theories') {
      fetchTheories();
    }
  }, [activeTab]);

  const handleEventAction = async (action: string) => {
    try {
      await api.setEventAction(action);
      fetchOverview();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    }
  };

  const handleBroadcast = async () => {
    if (!toastText && !bannerText) return;
    try {
      await api.setBanner(bannerText || null, toastText || undefined);
      setToastText('');
      fetchOverview();
      alert('Broadcast transmitted to all teams via SSE.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleLeaderboard = async (hide: boolean) => {
    try {
      await api.toggleLeaderboard(hide);
      fetchOverview();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleImportTeams = async () => {
    if (!csvInput.trim()) return;
    try {
      const res = await api.importTeams(csvInput.trim(), replaceTeams);
      alert(`Successfully imported ${res.importedCount} squads.`);
      setCsvInput('');
      fetchOverview();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateKit = async () => {
    if (!kitAnswerInput.trim()) return;
    try {
      const alts = kitAltsInput.split(',').map(s => s.trim()).filter(Boolean);
      await api.updateKit(selectedKitNo, kitAnswerInput.trim(), alts);
      alert(`Kit #${selectedKitNo} answer successfully hashed and updated.`);
      setKitAnswerInput('');
      setKitAltsInput('');
      fetchOverview();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExecuteOverride = async () => {
    if (!overrideTeamId || !overrideReason.trim()) {
      alert('Please select a team and provide an override rationale.');
      return;
    }
    try {
      await api.manualOverride(overrideTeamId, overrideLevel, overrideAction, overrideReason.trim());
      alert(`Override applied: Level ${overrideLevel} ${overrideAction}.`);
      setOverrideReason('');
      fetchOverview();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveTheoryReview = async () => {
    if (!selectedTheoryTeamId) return;
    try {
      await api.reviewTheory(selectedTheoryTeamId, { marks: marksState, notes: theoryNotes }, 'Lead Examiner');
      alert('Theory marks and review notes saved.');
      fetchTheories();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await api.adminLogout();
    navigate('/hq');
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-dim font-serif">
        Loading Command Center...
      </div>
    );
  }

  const { clock, liveBoard, kits, readiness, leaderboardHidden } = overview;

  return (
    <div className="min-h-screen bg-ink text-label flex flex-col font-serif">
      {/* Top Admin Header */}
      <header className="bg-tape border-b-2 border-alarm px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-desk">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border-2 border-alarm flex items-center justify-center font-typewriter text-alarm font-bold text-sm bg-ink">
            HQ
          </div>
          <div>
            <h1 className="font-typewriter text-lg font-bold tracking-wider text-label uppercase flex items-center gap-2">
              INCIDENT HEADQUARTERS // CONTROL PANEL
              <span className="stamp stamp-skipped text-[10px]">ORGANIZER DESK</span>
            </h1>
            <span className="text-xs text-dim font-mono">Case-2026-2310 • Master Administration Console</span>
          </div>
        </div>

        {/* Clock Controls */}
        <div className="flex items-center gap-2 bg-ink/90 p-1.5 rounded border border-signal/40">
          <span className="font-mono text-sm px-2 text-signal font-bold">
            {clock.state} ({Math.floor(clock.remainingSeconds / 60)}m left)
          </span>

          {clock.state === 'NOT_STARTED' && (
            <button
              onClick={() => handleEventAction('start')}
              className="px-3 py-1 bg-ok hover:bg-ok/90 text-label font-typewriter text-xs rounded font-bold flex items-center gap-1 shadow"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START EVENT</span>
            </button>
          )}

          {clock.state === 'RUNNING' && (
            <button
              onClick={() => handleEventAction('pause')}
              className="px-3 py-1 bg-signal hover:bg-signal/90 text-ink font-typewriter text-xs rounded font-bold flex items-center gap-1 shadow"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>
          )}

          {clock.state === 'PAUSED' && (
            <button
              onClick={() => handleEventAction('resume')}
              className="px-3 py-1 bg-ok hover:bg-ok/90 text-label font-typewriter text-xs rounded font-bold flex items-center gap-1 shadow"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>RESUME</span>
            </button>
          )}

          {clock.state !== 'ENDED' && (
            <button
              onClick={() => {
                if (confirm('Conclude the event? Submissions will be locked.')) {
                  handleEventAction('end');
                }
              }}
              className="px-2.5 py-1 bg-alarm hover:bg-alarm/90 text-label font-typewriter text-xs rounded font-bold flex items-center gap-1"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>END</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-1 text-dim hover:text-alarm rounded ml-2"
            title="Log out from HQ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Readiness Check Banner */}
      {!readiness.ready && (
        <div className="bg-alarm/20 border-b border-alarm/50 p-2.5 text-xs text-label flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-alarm shrink-0" />
            <span>
              <strong>Pre-Flight Readiness Warning:</strong> {readiness.issues.join(' • ')}
            </span>
          </div>
          <span className="stamp stamp-skipped text-[10px]">ACTION REQUIRED</span>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="bg-tape/70 border-b border-signal/20 px-4 flex gap-2 text-xs font-typewriter overflow-x-auto">
        {[
          { id: 'live', label: 'Live Squad Board' },
          { id: 'teams', label: 'Squad Import / Export' },
          { id: 'kits', label: 'Kit Answers (Level 8)' },
          { id: 'overrides', label: 'Manual Overrides' },
          { id: 'theories', label: 'Theory Grading' },
          { id: 'preview', label: 'Level Preview' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-signal text-signal bg-ink/50'
                : 'border-transparent text-dim hover:text-label'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* 1. LIVE SQUAD BOARD */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Broadcast & Controls Bar */}
            <div className="p-3 bg-tape rounded border border-signal/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-xl">
                <Radio className="w-4 h-4 text-signal shrink-0" />
                <input
                  type="text"
                  value={toastText}
                  onChange={(e) => setToastText(e.target.value)}
                  placeholder="Type an urgent message or clue clarification to broadcast to all teams..."
                  className="flex-1 bg-ink text-label px-3 py-1.5 rounded border border-signal/30 focus:outline-none"
                />
                <button
                  onClick={handleBroadcast}
                  className="px-4 py-1.5 bg-signal hover:bg-signal/90 text-ink font-bold rounded shadow shrink-0"
                >
                  Broadcast Toast
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLeaderboard(!leaderboardHidden)}
                  className={`px-3 py-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
                    leaderboardHidden
                      ? 'bg-alarm/20 border-alarm/50 text-alarm'
                      : 'bg-ink border-signal/30 text-dim hover:text-label'
                  }`}
                >
                  {leaderboardHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{leaderboardHidden ? 'Leaderboard Hidden (Classified)' : 'Leaderboard Visible'}</span>
                </button>

                <a
                  href="/api/admin/results/export"
                  download="final_results.csv"
                  className="px-3 py-1.5 bg-ink hover:bg-ink/80 text-label border border-signal/30 rounded flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-signal" />
                  <span>Export Results CSV</span>
                </a>
              </div>
            </div>

            {/* Live Board Table */}
            <div className="rounded border border-signal/30 bg-ink shadow-desk overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-tape text-label sticky top-0 border-b border-signal/30">
                  <tr>
                    <th className="py-2.5 px-3">SQUAD NAME</th>
                    <th className="py-2.5 px-3">CODE</th>
                    <th className="py-2.5 px-3">KIT #</th>
                    <th className="py-2.5 px-3">PROGRESS (1..10)</th>
                    <th className="py-2.5 px-3 text-center">SOLVED</th>
                    <th className="py-2.5 px-3 text-center">HINTS</th>
                    <th className="py-2.5 px-3 text-center">WRONGS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dim/20">
                  {liveBoard.map((row: any) => {
                    const solvedCount = row.states.filter((s: any) => s.status === 'SOLVED').length;
                    const hintsTotal = row.states.reduce((acc: number, s: any) => acc + s.hints_used, 0);
                    const wrongTotal = row.states.reduce((acc: number, s: any) => acc + s.wrong_attempts, 0);

                    return (
                      <tr key={row.team.id} className="hover:bg-tape/40 transition-colors">
                        <td className="py-2 px-3 font-serif font-bold text-label">
                          {row.team.name}
                        </td>
                        <td className="py-2 px-3 text-signal">
                          {row.team.code}
                        </td>
                        <td className="py-2 px-3 text-dim">
                          Kit #{row.team.kitNo}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            {row.states.map((st: any) => (
                              <span
                                key={st.level}
                                title={`Case ${st.level}: ${st.status}`}
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                  st.status === 'SOLVED'
                                    ? 'bg-ok text-label'
                                    : st.status === 'SKIPPED'
                                    ? 'bg-alarm text-label'
                                    : st.status === 'OPEN'
                                    ? 'bg-signal text-ink animate-pulse'
                                    : 'bg-dim/20 text-dim/50'
                                }`}
                              >
                                {st.level}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-signal">
                          {solvedCount} / 10
                        </td>
                        <td className="py-2 px-3 text-center text-dim">
                          {hintsTotal}
                        </td>
                        <td className="py-2 px-3 text-center text-alarm">
                          {wrongTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TEAMS IMPORT / EXPORT */}
        {activeTab === 'teams' && (
          <div className="space-y-4 max-w-3xl">
            <div className="paper-sheet p-5 rounded text-ink space-y-4 border border-ink/20">
              <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                <span className="font-typewriter font-bold text-sm uppercase">
                  IMPORT SQUADS FROM CSV
                </span>
                <a
                  href="/api/admin/teams/export"
                  download="squad_credentials.csv"
                  className="px-3 py-1 bg-ink text-label font-serif text-xs rounded flex items-center gap-1 shadow"
                >
                  <Download className="w-3.5 h-3.5 text-signal" />
                  <span>Download Credentials Sheet</span>
                </a>
              </div>

              <p className="font-serif text-xs leading-relaxed text-ink/80">
                Paste CSV data including headers: <code>name,code,password,kit_no,members</code>. Semicolon separates team members.
              </p>

              <textarea
                rows={6}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="name,code,password,kit_no,members&#10;Baker Street Unit,BAKER,case1986,1,Inspector Lestrade;Dr. Watson&#10;Scotland Yard Bravo,YARD,case1986,2,Sgt. Miller;Constable Evans"
                className="w-full bg-label/90 text-ink font-mono text-xs p-3 rounded border border-ink/30 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-serif text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceTeams}
                    onChange={(e) => setReplaceTeams(e.target.checked)}
                    className="accent-signal"
                  />
                  <span>Replace existing squad roster</span>
                </label>

                <button
                  onClick={handleImportTeams}
                  className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-bold text-xs rounded transition-colors shadow flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Squad List</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. KIT ANSWERS */}
        {activeTab === 'kits' && (
          <div className="space-y-4 max-w-3xl">
            <div className="paper-sheet p-5 rounded text-ink space-y-4 border border-ink/20">
              <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                <span className="font-typewriter font-bold text-sm uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-signal" />
                  PHYSICAL DE KIT ANSWER REGISTRY (LEVEL 8)
                </span>
                <span className="stamp stamp-open text-xs">OFFLINE HARDWARE</span>
              </div>

              <p className="font-serif text-xs leading-relaxed text-ink/80">
                Configure the secret answer for each hardware kit. Answers are immediately hashed with HMAC-SHA256 and never stored in plaintext.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-typewriter font-bold mb-1">Kit Number:</label>
                  <select
                    value={selectedKitNo}
                    onChange={(e) => setSelectedKitNo(parseInt(e.target.value, 10))}
                    className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
                      <option key={k} value={k}>
                        Kit #{k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-typewriter font-bold mb-1">Canonical Answer:</label>
                  <input
                    type="text"
                    value={kitAnswerInput}
                    onChange={(e) => setKitAnswerInput(e.target.value)}
                    placeholder="e.g. 67"
                    className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-typewriter font-bold mb-1">Alternates (comma separated):</label>
                  <input
                    type="text"
                    value={kitAltsInput}
                    onChange={(e) => setKitAltsInput(e.target.value)}
                    placeholder="e.g. 067, 67H"
                    className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30 uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateKit}
                  disabled={!kitAnswerInput.trim()}
                  className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
                >
                  Save & Hash Kit Answer
                </button>
              </div>

              {/* Status table */}
              <div className="mt-4 pt-4 border-t border-ink/20">
                <h4 className="font-typewriter font-bold text-xs mb-2">CURRENT REGISTERED KITS:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                  {kits.map((k: any) => (
                    <div key={k.kit_no} className="p-2 bg-manila/50 rounded border border-ink/20 text-center">
                      <div className="font-bold">Kit #{k.kit_no}</div>
                      <div className="text-[10px] text-ok mt-0.5">HASH CONFIGURED</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. MANUAL OVERRIDES */}
        {activeTab === 'overrides' && (
          <div className="space-y-4 max-w-2xl">
            <div className="paper-sheet p-5 rounded text-ink space-y-4 border border-ink/20">
              <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                <span className="font-typewriter font-bold text-sm uppercase">
                  MANUAL SQUAD OVERRIDE CONSOLE
                </span>
                <span className="stamp stamp-skipped text-xs">OFFICIAL AUDIT</span>
              </div>

              <p className="font-serif text-xs text-ink/80 leading-relaxed">
                Unlock or reset a case for a squad if technical or physical hardware issues occur during the live competition. An entry will be permanently logged in the audit table.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-typewriter font-bold mb-1">Target Squad:</label>
                  <select
                    value={overrideTeamId}
                    onChange={(e) => setOverrideTeamId(e.target.value)}
                    className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30"
                  >
                    {liveBoard.map((r: any) => (
                      <option key={r.team.id} value={r.team.id}>
                        {r.team.name} ({r.team.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-typewriter font-bold mb-1">Case Number:</label>
                    <select
                      value={overrideLevel}
                      onChange={(e) => setOverrideLevel(parseInt(e.target.value, 10))}
                      className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                        <option key={l} value={l}>
                          Case #{l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-typewriter font-bold mb-1">Override Action:</label>
                    <select
                      value={overrideAction}
                      onChange={(e) => setOverrideAction(e.target.value as any)}
                      className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30"
                    >
                      <option value="UNLOCK">UNLOCK (Mark Solved & Advance)</option>
                      <option value="RESET">RESET (Clear Attempts & Reset to Open)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-typewriter font-bold mb-1">Audit Rationale:</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Hardware wire fault on Kit #2; replacement verified"
                    className="w-full bg-label/90 text-ink font-mono p-2 rounded border border-ink/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExecuteOverride}
                  className="px-6 py-2 bg-alarm hover:bg-alarm/90 text-label font-bold text-xs rounded transition-colors shadow"
                >
                  Apply Audit Override
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. THEORY GRADING */}
        {activeTab === 'theories' && theoriesData && (
          <div className="space-y-4">
            <div className="paper-sheet p-5 rounded text-ink space-y-4 border border-ink/20">
              <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                <span className="font-typewriter font-bold text-sm uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-signal" />
                  CASE THEORY PROSECUTION REVIEW
                </span>
                <span className="stamp stamp-closed text-xs">EXAMINER DOCKET</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="font-typewriter font-bold text-xs">Select Squad Dossier:</label>
                <select
                  value={selectedTheoryTeamId}
                  onChange={(e) => setSelectedTheoryTeamId(e.target.value)}
                  className="bg-label/90 text-ink font-mono text-xs p-1.5 rounded border border-ink/30"
                >
                  {theoriesData.theories?.map((t: any) => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.team_name} (Kit #{t.kit_no})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTheoryTeamId && (() => {
                const currentTheory = theoriesData.theories?.find((t: any) => t.team_id === selectedTheoryTeamId);
                if (!currentTheory) return <div>No theory found for selected squad.</div>;

                return (
                  <div className="space-y-6 pt-3">
                    {theoriesData.questions?.map((q: any, i: number) => {
                      const qKey = q.id;
                      const teamAnswer = currentTheory[qKey] || '(No response provided)';
                      const canonicalAnswer = theoriesData.canonical[qKey];
                      const currentMark = marksState[qKey] || 'correct';

                      return (
                        <div key={qKey} className="p-4 rounded bg-manila/40 border border-ink/20 space-y-3">
                          <div className="font-typewriter font-bold text-xs flex items-center justify-between">
                            <span>Q{i + 1}: {q.text}</span>
                            {/* Marks Selector */}
                            <div className="flex items-center gap-1">
                              {(['correct', 'partial', 'missed'] as const).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setMarksState(prev => ({ ...prev, [qKey]: m }))}
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                                    currentMark === m
                                      ? m === 'correct' ? 'bg-ok text-label font-bold' : m === 'partial' ? 'bg-signal text-ink font-bold' : 'bg-alarm text-label font-bold'
                                      : 'bg-ink/10 text-ink/60'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif">
                            <div className="bg-label/70 p-3 rounded border border-ink/10">
                              <span className="font-typewriter font-bold text-signal text-[11px] block mb-1">
                                SQUAD RESPONSE:
                              </span>
                              <p className="leading-relaxed whitespace-pre-wrap">{teamAnswer}</p>
                            </div>

                            <div className="bg-tape/10 p-3 rounded border border-ink/10">
                              <span className="font-typewriter font-bold text-ok text-[11px] block mb-1">
                                CANONICAL FINDING:
                              </span>
                              <p className="leading-relaxed">{canonicalAnswer}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-3 border-t border-ink/20 flex items-center justify-between">
                      <input
                        type="text"
                        value={theoryNotes}
                        onChange={(e) => setTheoryNotes(e.target.value)}
                        placeholder="Examiner overall feedback notes..."
                        className="flex-1 max-w-lg bg-label/90 text-ink font-serif text-xs p-2 rounded border border-ink/30 mr-3"
                      />

                      <button
                        onClick={handleSaveTheoryReview}
                        className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-bold text-xs rounded transition-colors shadow"
                      >
                        Save Theory Marks
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 6. READ-ONLY LEVEL PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-4 max-w-5xl">
            <div className="paper-sheet p-5 rounded text-ink space-y-4 border border-ink/20">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-ink/20">
                <div>
                  <h2 className="font-typewriter font-bold text-sm uppercase">Level Preview // Organizer View</h2>
                  <p className="text-xs mt-1">Read-only inspection. Squad progress is not affected.</p>
                </div>
                <span className="stamp stamp-open text-xs">ADMIN ONLY</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="font-typewriter font-bold text-xs" htmlFor="preview-level">Select Level:</label>
                <select
                  id="preview-level"
                  value={previewLevel}
                  onChange={(e) => {
                    const level = Number(e.target.value);
                    setPreviewLevel(level);
                    fetchLevelPreview(level);
                  }}
                  className="bg-label/90 text-ink font-mono text-xs p-2 rounded border border-ink/30"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
                <button
                  onClick={() => fetchLevelPreview(previewLevel)}
                  disabled={previewLoading}
                  className="px-4 py-2 bg-signal text-ink font-bold text-xs rounded disabled:opacity-50"
                >
                  {previewLoading ? 'Loading...' : 'Load Preview'}
                </button>
              </div>

              {previewError && (
                <div className="p-3 rounded border border-alarm/40 bg-alarm/10 text-xs">{previewError}</div>
              )}
              {previewLoading && <p className="text-xs font-mono">Loading level files...</p>}
              {!previewLoading && !previewError && !previewData && (
                <p className="text-xs">Select a level and click Load Preview.</p>
              )}

              {previewData && !previewLoading && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded bg-manila/50 border border-ink/10">
                      <p className="text-[10px] font-typewriter font-bold">LEVEL</p>
                      <p className="text-lg font-bold">{previewData.id ?? previewLevel}</p>
                    </div>
                    <div className="p-3 rounded bg-manila/50 border border-ink/10">
                      <p className="text-[10px] font-typewriter font-bold">TYPE</p>
                      <p className="text-sm">{previewData.type || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded bg-manila/50 border border-ink/10">
                      <p className="text-[10px] font-typewriter font-bold">TOOL</p>
                      <p className="text-sm">{previewData.tool || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded bg-manila/50 border border-ink/10">
                      <p className="text-[10px] font-typewriter font-bold">ESTIMATED TIME</p>
                      <p className="text-sm">{previewData.estimatedMinutes ?? '?'} minutes</p>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h3 className="font-typewriter font-bold text-sm">{previewData.title || `Level ${previewLevel}`}</h3>
                    <div className="p-4 bg-label/60 rounded border border-ink/10 text-sm leading-relaxed">
                      <MarkdownText text={previewData.story || 'No story content found.'} />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-typewriter font-bold text-sm">Stages ({previewData.stages?.length || 0})</h3>
                    {previewData.stages?.length ? (
                      previewData.stages.map((stage: any, index: number) => (
                        <div key={stage.index ?? index} className="p-4 bg-manila/50 rounded border border-ink/10 space-y-2">
                          <h4 className="font-typewriter font-bold text-xs">
                            Stage {stage.index ?? index + 1}: {stage.name}
                          </h4>
                          <p className="text-sm leading-relaxed">
                            {stage.instruction || 'No stage instructions provided.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs">No stage information found.</p>
                    )}
                  </section>

                  <p className="text-[10px] font-mono border-t border-ink/20 pt-3">
                    PREVIEW ONLY: answer submission, hints, reveals, and game-state changes are disabled.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};