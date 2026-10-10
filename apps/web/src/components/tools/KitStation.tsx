import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Cpu, Printer, AlertCircle, CheckCircle2, Zap, Activity, Wrench, ShieldAlert } from 'lucide-react';

export const KitStation: React.FC = () => {
  const { team, levelDetail, submitAnswer } = useGameStore();

  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const kitNo = team?.kitNo || levelDetail?.kitNo || 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await submitAnswer(answerInput.trim());
    if (!res.correct) {
      setErrorMessage('Hardware register output does not reconcile with Kit #' + kitNo + '. Inspect truth table connections.');
    } else {
      setAnswerInput('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Physical Electronics Workbench Station Chassis */}
      <div className="relative bg-gradient-to-b from-[#211e1b] via-[#1a1715] to-[#12100e] p-5 sm:p-6 rounded-lg border-2 border-[#5c4631] shadow-[0_12px_30px_rgba(0,0,0,0.6)] space-y-4">
        {/* Machine Screws in 4 corners */}
        <div className="absolute top-2.5 left-2.5 text-[#5c4631] font-mono text-[10px] select-none">⊕</div>
        <div className="absolute top-2.5 right-2.5 text-[#5c4631] font-mono text-[10px] select-none">⊕</div>
        <div className="absolute bottom-2.5 left-2.5 text-[#5c4631] font-mono text-[10px] select-none">⊕</div>
        <div className="absolute bottom-2.5 right-2.5 text-[#5c4631] font-mono text-[10px] select-none">⊕</div>

        {/* Hazard Caution Strip */}
        <div className="h-2 w-full rounded bg-[repeating-linear-gradient(45deg,#d97706,#d97706_10px,#1c1917_10px,#1c1917_20px)] opacity-70" />

        {/* Workbench Header */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#5c4631]/60 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <span className="font-typewriter font-bold text-[#e6d8c3] tracking-wider text-xs sm:text-sm uppercase">
              WORKBENCH 08 // GARAGE RELAY CONTROLLER LOGIC DECODER
            </span>
          </div>
          <span className="stamp stamp-open text-[10px]">HARDWARE TEST BENCH</span>
        </div>

        <p className="font-serif text-xs leading-relaxed text-[#c9a777]/90">
          The garage controller runs dedicated electromechanical relay logic and stores internal non-volatile memory registers. Refer to the physical digital electronics breadboard kit placed on your squad table to reconstruct the logic gate circuit.
        </p>

        {/* Hardware Register LED Panel & Unit Assignment */}
        <div className="p-4 sm:p-5 bg-[#0f0d0b] rounded-lg border-2 border-[#3d2e20] flex flex-wrap items-center justify-between gap-4 shadow-inner">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#8c7457] tracking-wider uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              ASSIGNED PHYSICAL HARDWARE APPARATUS:
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-typewriter text-3xl sm:text-4xl font-bold text-amber-400 tracking-wider">
                KIT #{kitNo}
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                POWER: 12V OK
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {/* Status indicator LEDs */}
            <div className="hidden md:flex items-center gap-3 bg-[#171412] px-3 py-1.5 rounded border border-[#3d2e20] text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                RELAY A: ACTIVE
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                CLOCK: SYNCED
              </span>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 bg-[#261f19] hover:bg-[#382d24] text-[#e6d8c3] font-serif text-xs rounded border border-[#5c4631] flex items-center gap-2 transition-all shadow active:translate-y-0.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              <span>Printable Task Worksheet</span>
            </button>
          </div>
        </div>

        {/* Technical Schematic Reference Card */}
        <div className="paper-sheet p-3.5 rounded border border-[#bfa888] font-mono text-[11px] text-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between font-typewriter font-bold text-zinc-950 border-b border-zinc-300 pb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-800" />
              LOGIC REGISTER RECOVERY PROTOCOL
            </span>
            <span className="text-[10px] text-zinc-500">SCHEMATIC REF: DWG-7714</span>
          </div>
          <p className="font-serif text-xs text-zinc-700 leading-relaxed">
            Wire the IC inputs according to the truth table matching Kit #{kitNo}. Measure the output voltage or count the active register bits displayed across the bench segment LEDs.
          </p>
        </div>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-3">
        <label className="block text-xs font-serif text-label font-medium flex items-center gap-2">
          <Wrench className="w-4 h-4 text-signal" />
          <span>Enter the calculated register value verified from your physical Kit #{kitNo}:</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            placeholder="e.g. 67"
            className="flex-1 bg-ink text-label font-mono text-sm px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={submitting || !answerInput.trim()}
            className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
          >
            {submitting ? 'Verifying Hardware...' : 'Submit Kit Value'}
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-1 p-2 bg-red-950/60 rounded border border-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>

      {/* Printable Task Sheet Modal */}
      {showPrintModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="worksheet-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white"
        >
          <div className="paper-sheet max-w-2xl w-full p-8 rounded-lg text-ink shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#5c4631] relative print:border-none print:shadow-none print:max-w-none print:w-full">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink mb-4">
              <div>
                <h3 id="worksheet-title" className="font-typewriter text-lg font-bold text-red-950 uppercase">
                  CASE ARCHIVE 2026 // GARAGE CONTROLLER HARDWARE WORKSHEET
                </h3>
                <span className="text-xs font-mono text-zinc-600">METROPOLITAN CRIME SQUAD FORENSIC ENGINEERING UNIT</span>
              </div>
              <div className="border-2 border-ink px-3 py-1 font-typewriter font-bold text-sm bg-manila">
                KIT #{kitNo}
              </div>
            </div>

            <div className="space-y-4 font-serif text-xs leading-relaxed">
              <p>
                <strong>Squad Name:</strong> {team?.name || '__________________________'} &nbsp;&nbsp;&nbsp;&nbsp;
                <strong>Date:</strong> 23 October 2026
              </p>
              <div className="border-2 border-dashed border-ink/40 p-12 text-center text-zinc-600 italic bg-[#fffdfa] rounded">
                [ PHYSICAL CIRCUIT WIRING SCHEMATIC // ORGANIZER EXPERIMENTAL BENCH ]
                <br />
                <span className="text-[11px] text-zinc-500">The organizer supplies physical breadboard hardware with integrated logic gates corresponding to Kit #{kitNo}.</span>
              </div>
              <div className="pt-6 border-t border-ink/20 flex justify-between text-xs font-mono">
                <div>OFFICER SIGNATURE: __________________</div>
                <div>REGISTER VALUE: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded border border-ink/40 font-serif text-xs hover:bg-manila/50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-signal text-ink font-serif font-bold text-xs rounded flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
