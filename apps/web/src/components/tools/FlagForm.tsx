import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { ShieldAlert, KeyRound, AlertCircle, Volume2, FileText, CheckCircle2, User, Award, ExternalLink } from 'lucide-react';

export const FlagForm: React.FC = () => {
  const { levelDetail, submitAnswer, setTheoryModalOpen } = useGameStore();

  const [flagInput, setFlagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await submitAnswer(flagInput.trim());
    if (!res.correct) {
      setErrorMessage('Verification flag rejected. Follow the OSINT marker referencing badge 4417.');
    } else {
      setFlagInput('');
    }
    setSubmitting(false);
  };

  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  return (
    <div className="space-y-5">
      {/* Interrogation Room Scene Briefing Dossier */}
      <div className="paper-sheet p-6 rounded-lg border-l-4 border-red-800 text-ink shadow-[0_10px_25px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-2 border-b-2 border-ink/20 gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-800" />
            <span className="font-typewriter font-bold text-xs sm:text-sm uppercase tracking-widest text-red-950">
              NEW SCOTLAND YARD // INTERROGATION ROOM 3: ADRIAN CROSS STATEMENT
            </span>
          </div>
          <span className="stamp stamp-closed text-[9px]">OFFICIAL DEPOSITION</span>
        </div>

        {/* Adrian's Key Statement */}
        <blockquote className="font-serif italic text-xs sm:text-sm leading-relaxed text-zinc-950 bg-manila/80 p-4 rounded-lg border-l-4 border-red-800 shadow-inner">
          "You think I acted alone? I'm not a network administrator. I didn't schedule that security maintenance window from 21:20 to 23:50 that blinded every sensor in the house. I didn't delete my name from the system log export. Ask who requested account <strong className="text-red-900 font-mono">LIAISON_4417</strong>. And ask who signed Julian's altered death report three years ago."
        </blockquote>

        {/* OSINT Analysis Box */}
        <div className="p-3.5 bg-amber-950/10 rounded-lg border border-amber-900/20 text-xs font-serif leading-relaxed text-zinc-900 space-y-1">
          <div className="font-typewriter font-bold text-red-950 uppercase text-[11px] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-800" />
            OSINT INTELLIGENCE DISCOVERY TRAIL:
          </div>
          <p>
            External intelligence indicates that club members' public social profiles contain encoded Base64 parameters pointing toward QR verification targets. Trace the identity associated with badge/liaison <strong className="font-mono text-red-900">4417</strong>.
          </p>
        </div>
      </div>

      {/* Flag Form */}
      {!isSolved && (
        <form onSubmit={handleSubmit} className="p-5 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-3">
          <div className="flex items-center gap-2 text-xs font-serif text-label font-medium">
            <KeyRound className="w-4 h-4 text-signal" />
            <span>Enter Case Verification Flag (e.g. FLAG&#123;NAME_SURNAME&#125;):</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              placeholder="FLAG{...}"
              className="flex-1 bg-ink text-label font-mono text-sm px-3.5 py-2.5 rounded border border-signal/40 focus:border-signal focus:outline-none uppercase shadow-inner tracking-widest"
            />
            <button
              type="submit"
              disabled={submitting || !flagInput.trim()}
              className="px-7 py-2.5 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow-md disabled:opacity-50"
            >
              {submitting ? 'Verifying Flag...' : 'Submit Final Flag'}
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-1 p-2 bg-red-950/60 rounded border border-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      )}

      {/* Unlocked Artifacts: Recording Nine & Elias's Note */}
      {isSolved && (
        <div className="space-y-5 pt-3 border-t-2 border-[#5c4631]">
          {/* Recording Nine */}
          <div className="paper-sheet p-5 rounded-lg border-l-4 border-red-800 text-ink shadow-[0_6px_20px_rgba(0,0,0,0.3)] space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-ink/20">
              <span className="font-typewriter font-bold text-xs text-red-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-red-800" />
                TRANSCRIPT: RECORDING NINE
              </span>
              <span className="stamp stamp-skipped text-[9px]">CRIMINAL CONFESSION</span>
            </div>
            <div className="font-serif text-xs leading-relaxed text-zinc-950 italic bg-manila/60 p-4 rounded-lg border border-ink/15">
              <strong>DETECTIVE ROWAN HALE:</strong> "I altered the time of death on Julian's file to 20:40 because you told me you were at that dinner until 9:15, Elias. You told me it was an accident. But if anyone ever links badge 4417 to that crime scene before the 112 dispatch was logged... we both go down for murder."
            </div>
          </div>

          {/* Elias's Last Note */}
          <div className="paper-sheet p-5 rounded-lg border-l-4 border-signal text-ink shadow-[0_6px_20px_rgba(0,0,0,0.3)] space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-ink/20">
              <span className="font-typewriter font-bold text-xs text-zinc-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-signal" />
                DR. ELIAS VANE: SEALED FINAL TESTAMENT NOTE
              </span>
              <span className="stamp stamp-closed text-[9px]">EXHIBIT 10</span>
            </div>
            <div className="font-serif text-base leading-relaxed text-zinc-950 font-bold text-center py-4 bg-manila/50 rounded-lg border border-ink/15">
              "The person investigating my death already knows who killed me."
              <span className="block text-xs font-normal text-zinc-600 mt-2 font-mono">
                Filed under Archive Subject: Detective Rowan Hale (Badge #4417)
              </span>
            </div>
          </div>

          {/* Proceed to Final Theory Action Button */}
          <div className="relative bg-gradient-to-r from-[#2e1d14] via-[#241710] to-[#1c120c] p-6 rounded-xl border-2 border-[#b8860b] shadow-[0_12px_35px_rgba(0,0,0,0.7)] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-typewriter text-sm font-bold text-amber-400 block tracking-wider flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                ALL 10 FORENSIC EVIDENCE DOSSIERS CONCLUDED
              </span>
              <span className="text-xs font-serif text-[#e6d8c3]/90 block max-w-lg">
                The evidence chain is unbroken. Proceed to the Final Case Theory of the Prosecution to submit your official finding to the Chief Inspector.
              </span>
            </div>

            <button
              onClick={() => setTheoryModalOpen(true)}
              className="px-7 py-3 bg-gradient-to-b from-[#b8860b] to-[#926808] hover:from-[#d4af37] hover:to-[#b8860b] text-zinc-950 font-serif font-bold text-xs sm:text-sm rounded-lg shadow-[0_4px_15px_rgba(212,175,55,0.4)] transition-all animate-pulse border border-yellow-300/40"
            >
              Open Final Case Theory Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
