import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Lock, FileText, PhoneCall, Newspaper, AlertCircle, Printer, Search, Eye, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const DocViewer: React.FC = () => {
  const { levelDetail, submitAnswer, selectLevel } = useGameStore();
  const isSolved = levelDetail?.status === 'SOLVED';
  const currentStage = levelDetail?.currentStageIndex || 0;

  // Stage 1 Gate state
  const [gateYear, setGateYear] = useState('');
  const [gateSurname, setGateSurname] = useState('');

  // Stage 2 Questions state
  const [minutesInput, setMinutesInput] = useState('');
  const [badgeInput, setBadgeInput] = useState('');
  const [earlyMinutesInput, setEarlyMinutesInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'D2' | 'D3' | 'D4'>('D2');
  const [magnifyMode, setMagnifyMode] = useState(false);

  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateYear.trim() || !gateSurname.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);

    const combined = `${gateYear.trim()}${gateSurname.trim()}`;
    const res = await submitAnswer(combined);
    if (!res.correct) {
      setErrorMessage(res.nudge || 'Invalid archive authorization. Check play premiere year and husband surname.');
    }
    setSubmitting(false);
  };

  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minutesInput.trim() || !badgeInput.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);

    const combined = `${minutesInput.trim()}-${badgeInput.trim()}`;
    const res = await submitAnswer(combined);
    if (!res.correct) {
      setErrorMessage(res.nudge || 'Values do not reconcile with official D2/D3 documents.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* STAGE 1: GATE */}
      {currentStage === 0 && (
        <div className="relative paper-sheet p-6 rounded-lg border-2 border-red-900/60 shadow-[0_8px_25px_rgba(0,0,0,0.5)] space-y-5 overflow-hidden">
          {/* Top Classified Header Strip */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b-2 border-red-900/30 gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-800" />
              <span className="font-typewriter font-bold text-sm text-red-950 uppercase tracking-widest">
                MUMBAI POLICE ARCHIVE // SEALED HOMICIDE DOSSIER
              </span>
            </div>
            <span className="stamp stamp-sealed text-[10px]">RESTRICTED ACCESS</span>
          </div>

          {/* Archival Background Note */}
          <div className="bg-[#edd8be]/70 p-4 rounded border border-[#b89772] space-y-2">
            <p className="font-serif text-xs leading-relaxed text-zinc-900">
              This case file contains sealed 2023 forensic records regarding the demise of Julian Marsh. Due to an active judicial gag order, inspection requires cryptographic pass-key clearance.
            </p>
            <p className="font-serif text-xs leading-relaxed text-zinc-800 italic border-l-2 border-red-800/60 pl-3 py-0.5">
              "Identify Patrick Hamilton's celebrated Victorian psychological thriller where a calculating husband dims the gas fixtures and insists his terrified wife imagined the fading light."
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleStage1Submit} className="space-y-4 bg-manila/80 p-5 rounded border border-ink/20 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-typewriter font-bold text-ink mb-1">
                  Year of London Premiere:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={gateYear}
                  onChange={(e) => setGateYear(e.target.value)}
                  placeholder="Year"
                  className="w-full bg-[#fdfbf7] text-ink font-mono text-sm px-3.5 py-2 rounded border border-ink/40 focus:border-red-900 focus:outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-typewriter font-bold text-ink mb-1">
                  Husband's Surname:
                </label>
                <input
                  type="text"
                  value={gateSurname}
                  onChange={(e) => setGateSurname(e.target.value)}
                  placeholder="Surname"
                  className="w-full bg-[#fdfbf7] text-ink font-mono text-sm px-3.5 py-2 rounded border border-ink/40 focus:border-red-900 focus:outline-none uppercase shadow-inner"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-ink/70">
                COMBINED KEY FORMAT: [YEAR][SURNAME] — four digits then the surname, no space
              </span>
              <button
                type="submit"
                disabled={submitting || !gateYear.trim() || !gateSurname.trim()}
                className="px-6 py-2 bg-gradient-to-b from-[#8b261e] to-[#6d1b14] hover:from-[#a02c23] hover:to-[#7c1f17] text-[#fdfbf7] font-serif font-bold text-xs rounded transition-all shadow-[0_2px_6px_rgba(0,0,0,0.3)] disabled:opacity-50"
              >
                {submitting ? 'Verifying Authorization...' : 'Break Seal & Inspect File'}
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-2 p-2 bg-red-100/80 rounded border border-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* STAGE 2: UNLOCKED DOCUMENTS */}
      {currentStage >= 1 && (
        <div className="space-y-4">
          {/* Document Navigation Tabs styled as Archival Folder Index Tabs */}
          <div className="flex flex-wrap items-center justify-between bg-[#231e1a] p-2 rounded-t-lg border-2 border-b-0 border-[#5c4631] text-xs gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveDocTab('D2')}
                className={`px-3.5 py-2 rounded font-serif text-xs transition-all flex items-center gap-2 border ${
                  activeDocTab === 'D2'
                    ? 'bg-[#f4ece0] text-zinc-950 font-bold border-amber-900/60 shadow-md translate-y-0.5'
                    : 'text-[#c9a777] bg-[#171412] border-[#5c4631]/40 hover:bg-[#2b251f]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-900" />
                <span>DOC 02: Police Report</span>
              </button>

              <button
                onClick={() => setActiveDocTab('D3')}
                className={`px-3.5 py-2 rounded font-serif text-xs transition-all flex items-center gap-2 border ${
                  activeDocTab === 'D3'
                    ? 'bg-[#f4ece0] text-zinc-950 font-bold border-amber-900/60 shadow-md translate-y-0.5'
                    : 'text-[#c9a777] bg-[#171412] border-[#5c4631]/40 hover:bg-[#2b251f]'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-800" />
                <span>DOC 03: BT Phone Records</span>
              </button>

              <button
                onClick={() => setActiveDocTab('D4')}
                className={`px-3.5 py-2 rounded font-serif text-xs transition-all flex items-center gap-2 border ${
                  activeDocTab === 'D4'
                    ? 'bg-[#f4ece0] text-zinc-950 font-bold border-amber-900/60 shadow-md translate-y-0.5'
                    : 'text-[#c9a777] bg-[#171412] border-[#5c4631]/40 hover:bg-[#2b251f]'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5 text-zinc-800" />
                <span>DOC 04: Gazette Press Clip</span>
              </button>
            </div>

            {/* Utility buttons: Magnifying Mode and Print */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMagnifyMode(!magnifyMode)}
                className={`px-2.5 py-1.5 rounded border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                  magnifyMode
                    ? 'bg-amber-600 text-zinc-950 font-bold border-amber-400'
                    : 'bg-[#171412] text-[#c9a777] border-[#5c4631]/40 hover:text-[#e6d8c3]'
                }`}
                title="Toggle document magnification"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{magnifyMode ? 'Magnifier [ON]' : 'Magnifier'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-1.5 text-[#c9a777] hover:text-[#e6d8c3] rounded bg-[#171412] border border-[#5c4631]/40"
                title="Print evidence sheet"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div
            className={`paper-sheet p-6 sm:p-8 rounded-b-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-[#5c4631] text-ink min-h-[340px] relative transition-all ${
              magnifyMode ? 'scale-[1.02] text-sm leading-relaxed' : 'text-xs'
            }`}
          >
            {/* Top corner brass paperclip */}
            <div className="paperclip absolute -top-3 right-8 z-10" />

            {/* DOCUMENT 2: POLICE INCIDENT REPORT */}
            {activeDocTab === 'D2' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between border-b-2 border-ink pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-typewriter text-base sm:text-lg font-bold tracking-widest uppercase text-red-950">
                        MUMBAI POLICE · CRIME BRANCH // INCIDENT REPORT
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-ink/75">
                      REF: CRIM-02-12-23 • SECTOR 4B • SCOTLAND YARD ARCHIVE COPY
                    </p>
                  </div>
                  <span className="stamp stamp-open text-xs">OFFICIAL DOCKET</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono p-3 bg-manila/40 rounded border border-ink/15">
                  <div>
                    <strong>Date of Incident:</strong> 02 December 2023<br />
                    <strong>Location:</strong> Flat 3, Sea Glimpse, Carter Road, Bandra West<br />
                    <strong>Deceased:</strong> Julian Marsh (Male, 27)
                  </div>
                  <div>
                    <strong>112 Emergency Dispatch Logged:</strong> 22:20 IST<br />
                    <strong>First Responding Officer Arrival:</strong> 22:05 IST<br />
                    <strong className="text-red-900">Attending Officer:</strong> Badge 4417
                  </div>
                </div>

                <div className="p-4 bg-manila/60 rounded border border-ink/20 font-serif leading-relaxed space-y-2">
                  <h4 className="font-typewriter font-bold text-xs uppercase tracking-wider text-ink border-b border-ink/15 pb-1">
                    FORENSIC ATTENDANCE & CRIME SCENE SUMMARY:
                  </h4>
                  <p>
                    Responding officer arrived on scene. Discovered subject Julian Marsh deceased in ground floor drawing room. Individual Mira Vale discovered in shock beside the body. Initial rigor and physical state evaluated.
                  </p>
                  <p className="font-mono font-bold text-red-900 bg-red-100/60 p-2 rounded border border-red-300">
                    OFFICIAL ESTIMATED TIME OF DEATH: 20:40 IST
                  </p>
                  <div className="flex items-center justify-between pt-2 text-[11px] text-ink/70 italic border-t border-dashed border-ink/20">
                    <span>Officer Signature: [Smudged stamp: Det. Const. Badge 4417]</span>
                    <span className="font-mono text-zinc-500">EXHIBIT D-2 // VERIFIED</span>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 3: BT PHONE RECORDS */}
            {activeDocTab === 'D3' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b-2 border-ink pb-3 gap-2">
                  <div>
                    <h3 className="font-typewriter text-base sm:text-lg font-bold tracking-widest uppercase">
                      BRITISH TELECOM // SUBSCRIBER CALL RECORD
                    </h3>
                    <p className="text-[11px] font-mono text-ink/75">
                      SUBSCRIBER: JULIAN MARSH • FIXED-LINE ID: 020 7946 0144 • EXCHANGE: HAMPSTEAD
                    </p>
                  </div>
                  <span className="stamp stamp-closed text-xs">CERTIFIED</span>
                </div>

                <div className="font-mono overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-ink/40 text-[11px]">
                        <th className="py-1.5 px-2">TIMESTAMP</th>
                        <th className="py-1.5 px-2">DESTINATION</th>
                        <th className="py-1.5 px-2">CALLED PARTY</th>
                        <th className="py-1.5 px-2">DURATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/15 text-xs">
                      <tr>
                        <td className="py-2 px-2 font-bold">18:40:12</td>
                        <td className="px-2">020 7946 0882</td>
                        <td className="px-2">Helen Marsh (Mother)</td>
                        <td className="px-2">04m 12s</td>
                      </tr>
                      <tr className="bg-amber-100/70 font-bold border-l-4 border-amber-700">
                        <td className="py-2 px-2 text-red-900">21:12:04</td>
                        <td className="px-2 text-red-900">020 7946 0912</td>
                        <td className="px-2 text-red-900">Dr. Elias Vane (Consultant)</td>
                        <td className="px-2 text-red-900">00m 47s</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2">21:45:00</td>
                        <td className="px-2">--</td>
                        <td className="px-2 text-zinc-500">NO OUTGOING TRAFFIC</td>
                        <td className="px-2">--</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-manila/50 rounded border border-ink/20 font-serif leading-relaxed italic text-[11px] text-ink/80">
                  Note: Telecommunications exchange timestamp is synchronized against Rugby atomic reference. Call initiation is verified accurate to within ±200ms.
                </div>
              </div>
            )}

            {/* DOCUMENT 4: GAZETTE PRESS CLIPPING */}
            {activeDocTab === 'D4' && (
              <div className="space-y-4 font-serif bg-[#fbf6ec] p-5 rounded border border-[#c4b59d] shadow-sm transform rotate-[-0.2deg]">
                <div className="border-b-2 border-zinc-900 pb-2 text-center">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 uppercase block font-typewriter">
                    THE NORTH LONDON GAZETTE
                  </span>
                  <span className="text-[11px] text-zinc-600 font-mono block">
                    Wednesday, 5 December 2023 • Late Edition • Price 45p • Page 4
                  </span>
                </div>

                <h4 className="font-bold text-sm sm:text-base leading-snug text-zinc-950 border-b border-zinc-300 pb-1">
                  HAMPSTEAD TRAGEDY: PSYCHOLOGIST'S PATIENT QUESTIONED IN UNRESOLVED DEATH
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-zinc-800 text-justify">
                  <p>
                    Police sources confirmed yesterday that investigators are scrutinizing the final hours of Julian Marsh, found deceased in Park Terrace late Saturday evening. Prominent consultant psychologist Dr. Elias Vane expressed deep sorrow, confirming he had spoken with Mr. Marsh during past clinical assessments.
                  </p>
                  <p>
                    A police spokesperson stated that responding officers arrived swiftly, noting the victim was estimated to have expired well before 9:00 PM. Inquiries continue regarding the timeline of emergency communications.
                  </p>
                </div>

                <div className="pt-2 border-t border-dashed border-zinc-400 text-right text-[10px] font-mono text-zinc-500">
                  PRESS ARCHIVE CLIPPING // D-04
                </div>
              </div>
            )}
          </div>

          {/* Stage 2 Discrepancy Reconciliation Form or Solved State */}
          {isSolved ? (
            <div className="p-5 bg-gradient-to-r from-[#172b1c] to-[#122015] rounded border-2 border-ok/80 shadow-desk space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-ok/30">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-ok" />
                  <span className="font-typewriter font-bold text-xs uppercase tracking-wider text-ok">
                    FORENSIC DISCREPANCY VERIFIED & ACCEPTED: 32-4417
                  </span>
                </div>
                <span className="stamp stamp-closed text-[10px]">CASE SOLVED &bull; INPUT LOCKED</span>
              </div>

              <p className="font-serif text-xs text-dim leading-relaxed">
                The timeline and officer discrepancy (arrival 32 minutes prior to dispatch by Officer 4417) has been corroborated and entered into the central case file. Submission is locked.
              </p>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => selectLevel(4)}
                  className="px-5 py-2 bg-signal hover:bg-signal/90 text-ink font-typewriter font-bold text-xs rounded transition-all shadow flex items-center gap-2"
                >
                  <span>Proceed to Case #04: The Database Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStage2Submit} className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-signal/30 text-xs font-typewriter font-bold text-label">
                <Sparkles className="w-4 h-4 text-signal" />
                <span>FORENSIC TIMELINE RECONCILIATION DOSSIER</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-serif text-label font-medium mb-1">
                    Minutes between estimated TOD (20:40) and Julian's call (21:12):
                  </label>
                  <input
                    type="text"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(e.target.value)}
                    placeholder="Minutes"
                    className="w-full bg-ink text-label font-mono px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-serif text-label font-medium mb-1">
                    Badge number of the first responding officer on scene:
                  </label>
                  <input
                    type="text"
                    value={badgeInput}
                    onChange={(e) => setBadgeInput(e.target.value)}
                    placeholder="Badge"
                    className="w-full bg-ink text-label font-mono px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block font-serif text-dim text-[11px] mb-1">
                  Optional: Minutes the officer arrived before 112 call was logged (recorded for organizers):
                </label>
                <input
                  type="text"
                  value={earlyMinutesInput}
                  onChange={(e) => setEarlyMinutesInput(e.target.value)}
                  placeholder="Minutes"
                  className="w-32 bg-ink text-label font-mono text-xs px-3 py-1.5 rounded border border-dim/40 focus:border-signal focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-mono text-dim">
                  SUBMISSION FORMAT: [Minutes]-[Badge] — the difference in minutes, a hyphen, the four-digit badge
                </span>
                <button
                  type="submit"
                  disabled={submitting || !minutesInput.trim() || !badgeInput.trim()}
                  className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
                >
                  {submitting ? 'Checking Dossier...' : 'Submit Forensic Discrepancy'}
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-2 p-2 bg-red-950/60 rounded border border-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};
