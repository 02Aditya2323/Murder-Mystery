import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Users, FileText, AlertCircle, CheckCircle2, Pin, Link as LinkIcon, X, ArrowRight } from 'lucide-react';

interface Suspect {
  id: string;
  name: string;
  role: string;
  statement: string;
}

interface EvidenceCard {
  id: string;
  title: string;
  description: string;
}

export const MatchBoard: React.FC = () => {
  const { levelDetail, submitAnswer } = useGameStore();

  const suspects: Suspect[] = levelDetail?.suspects || [];
  const evidenceCards: EvidenceCard[] = levelDetail?.evidenceCards || [];
  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  const [matches, setMatches] = useState<Record<string, string>>({
    lena: '',
    daniel: '',
    clara: '',
    noah: '',
    adrian: '',
    mira: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ error?: string } | null>(null);

  // Nothing here repopulates the board on solve. A team that has just solved it
  // is already looking at the correct board, their own selections. Writing the
  // canonical mapping here only put the answer key into the bundle.

  const handleSelect = (suspectId: string, evidenceId: string) => {
    if (isSolved) return;
    setMatches((prev) => ({ ...prev, [suspectId]: evidenceId }));
    setFeedback(null);
  };

  const handleClear = (suspectId: string) => {
    if (isSolved) return;
    setMatches((prev) => ({ ...prev, [suspectId]: '' }));
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSolved) return;
    setSubmitting(true);
    setFeedback(null);

    // Calculate display code: Lena number, Daniel number, Clara number, Noah number
    // Four evidence numbers, in suspect order.
    const getNum = (v: string) => v.replace(/^E/, '') || '0';
    const code = `${getNum(matches.lena || '')}${getNum(matches.daniel || '')}${getNum(matches.clara || '')}${getNum(matches.noah || '')}`;

    const res = await submitAnswer(code);

    if (!res.correct) {
      // No client-side answer key and no "n of 6 correct" counter. The old
      // version shipped the canonical mapping in the bundle, and the counter
      // let a team hill-climb to the answer without reading the evidence.
      setFeedback({
        error:
          res.nudge ||
          'The board does not reconcile. At least one statement is matched to evidence that does not actually refute it, and remember that not everyone here is lying.'
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Overview Dossier Banner */}
      <div className="paper-sheet p-4 rounded-lg border-2 border-amber-900/40 shadow-sm text-xs text-ink font-serif flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl leading-relaxed">
          Cross-examine each suspect's recorded alibi against physical evidence retrieved from the Vane residence on Ridge Road. Identify which evidence document directly refutes their testimony, or declare <strong className="text-red-900 font-bold">No Contradiction</strong> if current evidence does not break their statement.
        </p>
        <span className={`stamp text-[10px] ${isSolved ? 'stamp-closed text-emerald-800 border-emerald-800' : 'stamp-open'}`}>
          {isSolved ? 'VERIFIED MATCH MATRIX' : 'CORROBORATION BOARD'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Suspect Statements (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b-2 border-signal/30 text-xs">
            <span className="font-typewriter font-bold text-label flex items-center gap-2">
              <Users className="w-4 h-4 text-signal" />
              SUSPECT INTERROGATION DOSSIERS
            </span>
            <span className="text-[11px] font-mono text-dim">6 DEPOSITIONS RECORDED</span>
          </div>

          <div className="space-y-3">
            {suspects.map((s) => {
              const matchedEv = matches[s.id];

              // Filter evidence options: remove cards already selected by other suspects
              const availableEvidenceForSuspect = evidenceCards.filter((e) => {
                // If it's already selected by this suspect, keep it so it stays selected in dropdown
                if (matches[s.id] === e.id) return true;
                // Exclude if already matched to another suspect
                const isSelectedByOther = Object.entries(matches).some(
                  ([otherId, matchedEvId]) => otherId !== s.id && matchedEvId === e.id
                );
                return !isSelectedByOther;
              });

              return (
                <div
                  key={s.id}
                  className={`relative p-4 rounded-lg bg-gradient-to-r from-[#241e19] to-[#1c1814] border-2 text-xs space-y-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all ${
                    matchedEv && matchedEv !== 'none'
                      ? 'border-red-700/80 shadow-[0_0_15px_rgba(185,28,28,0.25)]'
                      : matchedEv === 'none'
                      ? 'border-emerald-700/60'
                      : 'border-[#5c4631] hover:border-amber-600/60'
                  }`}
                >
                  {/* Pushpin indicator */}
                  <div className="thumbtack absolute -top-2 left-3 z-10" />

                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar silhouette badge */}
                      <div className="w-8 h-8 rounded bg-[#120f0d] border border-[#5c4631] flex items-center justify-center text-amber-500 font-bold text-xs shadow-inner">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-typewriter font-bold text-[#e6d8c3] text-sm tracking-wide">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-amber-500/80 font-mono">
                          {s.role}
                        </div>
                      </div>
                    </div>

                    {/* Match Selection Dropdown & Clear Button */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={matches[s.id] || ''}
                        disabled={isSolved}
                        onChange={(e) => handleSelect(s.id, e.target.value)}
                        className={`bg-[#0f0d0b] text-[#e6d8c3] text-xs font-mono py-1.5 px-2.5 rounded border focus:outline-none shadow-inner transition-colors disabled:opacity-80 ${
                          matchedEv && matchedEv !== 'none'
                            ? 'border-red-600 focus:border-red-500'
                            : matchedEv === 'none'
                            ? 'border-emerald-600 focus:border-emerald-500'
                            : 'border-[#5c4631] focus:border-amber-500'
                        }`}
                      >
                        <option value="">-- Match Evidence --</option>
                        <option value="none">No Contradiction</option>
                        {availableEvidenceForSuspect.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.id}: {e.title.slice(0, 24)}...
                          </option>
                        ))}
                      </select>

                      {matchedEv && !isSolved && (
                        <button
                          type="button"
                          onClick={() => handleClear(s.id)}
                          className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 transition-colors"
                          title="Remove match"
                          aria-label={`Clear match for ${s.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Testimony Block */}
                  <blockquote className="font-serif italic text-zinc-300 text-xs bg-[#120f0d]/80 p-3 rounded border-l-4 border-amber-700 leading-relaxed">
                    "{s.statement}"
                  </blockquote>

                  {/* Red string connection badge */}
                  {matchedEv && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#3d2e20] text-[11px] font-mono">
                      <span className={`flex items-center gap-1.5 font-bold ${matchedEv === 'none' ? 'text-emerald-400' : 'text-red-400'}`}>
                        <LinkIcon className={`w-3 h-3 ${matchedEv === 'none' ? 'text-emerald-500' : 'text-red-500'}`} />
                        {matchedEv === 'none' ? 'DECLARED UNCONTRADICTED' : `THREAD LINKED TO EVIDENCE ${matchedEv}`}
                      </span>
                      <span className="text-[10px] text-zinc-500">EXHIBIT CONNECTION TAG</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Physical Evidence Registry (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b-2 border-signal/30 text-xs">
            <span className="font-typewriter font-bold text-label flex items-center gap-2">
              <FileText className="w-4 h-4 text-signal" />
              PHYSICAL EVIDENCE ARCHIVE
            </span>
            <span className="text-[11px] font-mono text-dim">9 EXHIBITS</span>
          </div>

          <div className="cork-board p-3 rounded-lg border-2 border-[#5c4631] max-h-[620px] overflow-y-auto space-y-2.5 shadow-inner">
            {evidenceCards.map((e) => {
              // Check if any suspect has linked this evidence
              const matchedEntry = Object.entries(matches).find(([_, evId]) => evId === e.id);
              const linkedSuspect = matchedEntry ? suspects.find((s) => s.id === matchedEntry[0]) : null;

              return (
                <div
                  key={e.id}
                  className={`paper-sheet p-3.5 rounded border transition-all relative ${
                    linkedSuspect
                      ? 'border-red-700 bg-[#fff9ee] shadow-[0_0_12px_rgba(185,28,28,0.4)] scale-[1.01]'
                      : 'border-amber-900/30 hover:border-amber-900/60'
                  }`}
                >
                  {/* Brass pushpin on top */}
                  <div className="thumbtack absolute -top-2 right-4 z-10" />

                  <div className="flex items-center justify-between pb-1 border-b border-ink/15 mb-1.5">
                    <span className="font-typewriter font-bold text-xs text-red-950 flex items-center gap-1.5">
                      <Pin className="w-3 h-3 text-red-800" />
                      {e.title}
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-900/10 rounded text-[10px] font-mono font-bold text-amber-900 border border-amber-900/20">
                      {e.id}
                    </span>
                  </div>

                  <p className="font-serif text-xs text-zinc-900 leading-relaxed">
                    {e.description}
                  </p>

                  {linkedSuspect ? (
                    <div className="mt-2 pt-1 border-t border-dashed border-red-400 text-[10px] font-mono font-bold text-red-700 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block mr-1" />
                        CROSS-EXAMINED WITH:
                      </span>
                      <span className="uppercase text-red-900 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                        {linkedSuspect.name}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 pt-1 border-t border-dashed border-amber-900/20 text-[10px] font-mono text-zinc-500">
                      AVAILABLE FOR CORROBORATION
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit / Solved Action Box */}
      {!isSolved ? (
        <div className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-typewriter text-xs text-label font-bold block tracking-wider">
              CONTRADICTION VERIFICATION MATRIX
            </span>
            <span className="text-[11px] font-mono text-dim">
              Select an evidence item (or 'No Contradiction') for each individual to verify findings.
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || Object.values(matches).some((v) => !v)}
            className="px-7 py-2.5 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow-md disabled:opacity-50"
          >
            {submitting ? 'Verifying Statements...' : 'Verify Contradictions'}
          </button>
        </div>
      ) : (
        <div className="p-5 bg-gradient-to-r from-[#172314] via-[#1f301b] to-[#172314] rounded-lg border-2 border-emerald-600/70 shadow-desk flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-typewriter text-sm text-emerald-200 font-bold block uppercase tracking-wider">
                CONTRADICTIONS ESTABLISHED // CASE #05 SOLVED
              </span>
              <span className="text-xs font-serif text-emerald-100/80">
                The depositions have been reconciled against the physical exhibits. The contradiction code checks out.
              </span>
            </div>
          </div>

          {/* advancement is owned by the case room */}
        </div>
      )}

      {/* Clear, Persistent Wrong Answer Feedback Banner */}
      {feedback?.error && (
        <div className="p-4 bg-red-950/90 rounded-lg border-2 border-red-700 text-xs font-serif text-red-200 flex items-start gap-3 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-typewriter font-bold text-red-300 uppercase tracking-wide">
              CORROBORATION MISMATCH DETECTED
            </div>
            <div>{feedback.error}</div>
          </div>
        </div>
      )}
    </div>
  );
};
