import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { ArrowUp, ArrowDown, BookOpen, AlertCircle, Sparkles, Volume2, Key, CheckCircle2, ArrowRight } from 'lucide-react';

interface DiaryPage {
  id: string;
  label: string;
  text: string;
}

export const DiaryTable: React.FC = () => {
  const { levelDetail, submitAnswer, selectLevel } = useGameStore();

  const initialPages: DiaryPage[] = levelDetail?.diaryPages || [];
  const [pages, setPages] = useState<DiaryPage[]>(initialPages);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Music Box state
  const [musicBoxOpen, setMusicBoxOpen] = useState(false);

  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  useEffect(() => {
    if (initialPages.length > 0 && pages.length === 0) {
      setPages(initialPages);
    }
  }, [initialPages]);

  useEffect(() => {
    // If solved, sort pages in canonical chronological order P1..P6
    if (isSolved && pages.length > 0) {
      const sorted = [...pages].sort((a, b) => a.id.localeCompare(b.id));
      setPages(sorted);
    }
  }, [isSolved]);

  const moveUp = (index: number) => {
    if (index === 0 || isSolved) return;
    const newPages = [...pages];
    const temp = newPages[index - 1];
    newPages[index - 1] = newPages[index];
    newPages[index] = temp;
    setPages(newPages);
    setErrorMessage(null);
  };

  const moveDown = (index: number) => {
    if (index === pages.length - 1 || isSolved) return;
    const newPages = [...pages];
    const temp = newPages[index + 1];
    newPages[index + 1] = newPages[index];
    newPages[index] = temp;
    setPages(newPages);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (isSolved) return;
    setSubmitting(true);
    setErrorMessage(null);

    const orderStr = pages.map((p) => p.id).join(',');
    const res = await submitAnswer(orderStr);

    if (!res.correct) {
      setErrorMessage(
        res.nudge ||
          'The chronological sequence does not align. Cross-reference Julian’s death, his funeral, Dr. Vane’s home visits, and Mira’s decision to hide the music box before falling silent.'
      );
    }
    setSubmitting(false);
  };

  // Subtle organic rotation angles for stacked paper effect
  const rotations = ['rotate-[-0.3deg]', 'rotate-[0.4deg]', 'rotate-[-0.2deg]', 'rotate-[0.3deg]', 'rotate-[-0.4deg]', 'rotate-[0.2deg]'];

  return (
    <div className="space-y-5">
      {/* Overview Dossier Banner */}
      <div className="paper-sheet p-4 rounded-lg border-2 border-amber-900/40 shadow-sm text-xs text-ink font-serif flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl leading-relaxed">
          Mira's handwritten therapy notes were recovered unbound and disordered from her bedside bureau. Examine cross-references to Julian's funeral, Dr. Vane's private sessions, and the growing silence to reconstruct the authentic chronological sequence of events.
        </p>
        <span className={`stamp text-[10px] ${isSolved ? 'stamp-closed text-emerald-800 border-emerald-800' : 'stamp-open'}`}>
          {isSolved ? 'AUTHENTIC TIMELINE RESTORED' : 'EVIDENCE EXHIBIT 13'}
        </span>
      </div>

      {/* Disordered Diary Pages List */}
      <div className="space-y-4">
        {pages.map((p, idx) => (
          <div
            key={p.id}
            className={`paper-sheet p-5 sm:p-6 rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.35)] border-2 border-[#bfa888] text-ink flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all relative transform ${
              rotations[idx % rotations.length]
            } hover:rotate-0 hover:border-amber-700 bg-[#fbf7ee]`}
          >
            {/* Lined paper left margin styling */}
            <div className="absolute top-0 bottom-0 left-6 sm:left-8 w-0.5 bg-red-400/30 hidden sm:block pointer-events-none" />

            <div className="flex-1 space-y-3 sm:pl-6">
              {/* Header with Timeline Position */}
              <div className="flex items-center gap-2.5">
                <span className="font-typewriter font-bold text-xs uppercase tracking-wider text-red-950 px-2 py-0.5 rounded bg-amber-900/10 border border-amber-900/20">
                  TIMELINE POSITION #{idx + 1}
                </span>
                <span className="text-[11px] font-mono text-zinc-600 font-semibold">
                  {idx === 0
                    ? '1st (Earliest Event)'
                    : idx === pages.length - 1
                    ? `${pages.length}th (Latest Event)`
                    : `Step ${idx + 1} of ${pages.length}`}
                </span>
              </div>

              {/* Authentic & Highly Legible Handwriting */}
              <p className="font-handwriting text-2xl sm:text-[1.65rem] text-[#1a120c] leading-relaxed font-semibold tracking-wide select-text">
                {p.text}
              </p>
            </div>

            {/* Reorder Buttons */}
            <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center z-10 bg-amber-950/10 p-1.5 rounded-lg border border-amber-900/20">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0 || isSolved}
                aria-label={`Move sheet position ${idx + 1} earlier`}
                className="p-2 rounded bg-amber-100 hover:bg-amber-200 text-zinc-900 border border-amber-300 disabled:opacity-30 disabled:hover:bg-amber-100 transition-all shadow-sm active:translate-y-0.5 flex items-center gap-1 text-xs font-mono font-bold"
                title="Move earlier in timeline"
              >
                <ArrowUp className="w-4 h-4 text-zinc-900" />
                <span className="sm:hidden">Earlier</span>
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === pages.length - 1 || isSolved}
                aria-label={`Move sheet position ${idx + 1} later`}
                className="p-2 rounded bg-amber-100 hover:bg-amber-200 text-zinc-900 border border-amber-300 disabled:opacity-30 disabled:hover:bg-amber-100 transition-all shadow-sm active:translate-y-0.5 flex items-center gap-1 text-xs font-mono font-bold"
                title="Move later in timeline"
              >
                <ArrowDown className="w-4 h-4 text-zinc-900" />
                <span className="sm:hidden">Later</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action / Verification Box */}
      {!isSolved ? (
        <div className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-typewriter text-xs text-label font-bold block tracking-wider uppercase">
              CHRONOLOGY VERIFICATION
            </span>
            <span className="text-[11px] font-mono text-dim">
              Use the arrow controls to sort the therapy diary entries from earliest to latest date.
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow-md disabled:opacity-50"
          >
            {submitting ? 'Verifying Chronology...' : 'Verify Chronological Order'}
          </button>
        </div>
      ) : (
        <div className="p-5 bg-gradient-to-r from-[#172314] via-[#1f301b] to-[#172314] rounded-lg border-2 border-emerald-600/70 shadow-desk flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-typewriter text-sm text-emerald-200 font-bold block uppercase tracking-wider">
                CHRONOLOGY RESTORED // CASE #06 SOLVED
              </span>
              <span className="text-xs font-serif text-emerald-100/80">
                Mira's therapy pages have been sequenced accurately, exposing the deliberate gaslighting timeline.
              </span>
            </div>
          </div>

          <button
            onClick={() => selectLevel(7)}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg active:translate-y-0.5 flex items-center gap-2"
          >
            <span>Proceed to Case #07</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Persistent Inline Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-950/90 rounded-lg border-2 border-red-700 text-xs font-serif text-red-200 flex items-start gap-3 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-typewriter font-bold text-red-300 uppercase tracking-wide">
              CHRONOLOGICAL MISALIGNMENT DETECTED
            </div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* SOLVED ARTIFACTS: Mira's Confirmed Statement & Antique Music Box */}
      {isSolved && (
        <div className="space-y-5 pt-4 border-t-2 border-[#5c4631]">
          {/* Mira's First Spoken Statement Card */}
          <div className="paper-sheet p-5 rounded-lg border-l-4 border-ok text-ink shadow-[0_6px_20px_rgba(0,0,0,0.3)] space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-ink/20">
              <span className="font-typewriter font-bold text-xs flex items-center gap-2 text-zinc-950">
                <BookOpen className="w-4 h-4 text-ok" />
                MIRA VALE: VERIFIED WITNESS STATEMENT
              </span>
              <span className="stamp stamp-closed text-[9px]">CONFIRMED</span>
            </div>
            <blockquote className="font-serif italic text-xs leading-relaxed text-zinc-900 bg-manila/50 p-3 rounded border border-ink/10">
              "You read it in the order I wrote it. Elias always told me I had it jumbled. He came the day before he died. He brought my music box back and said he'd had it repaired. It doesn't play. I haven't touched it."
            </blockquote>
          </div>

          {/* Ornate Antique Music Box Showcase */}
          <div className="relative bg-gradient-to-b from-[#2e1d14] via-[#22150e] to-[#160c07] p-6 rounded-xl border-4 border-[#5c3a21] shadow-[0_15px_35px_rgba(0,0,0,0.7)] space-y-5 text-center">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#5c3a21] text-xs gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="font-typewriter font-bold text-[#e6d8c3] tracking-wider text-xs sm:text-sm">
                  EXHIBIT 14: THE INLAID MAHOGANY MUSIC BOX
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-black/60 text-[#c9a777] font-mono text-[11px] border border-[#5c3a21]">
                SWISS CYLINDER MOVEMENT
              </span>
            </div>

            {/* Embedded SVG Illustration in ornate velvet-lined frame */}
            <div className="flex justify-center p-4 bg-[#100804] rounded-lg border-2 border-[#452a17] shadow-inner">
              <img
                src="/api/levels/6/assets/musicbox.svg"
                alt="Antique Music Box with concealed false base"
                className="max-h-64 object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
              />
            </div>

            {!musicBoxOpen ? (
              <button
                type="button"
                onClick={() => setMusicBoxOpen(true)}
                className="px-7 py-3 bg-gradient-to-b from-[#b8860b] to-[#926808] hover:from-[#d4af37] hover:to-[#b8860b] text-zinc-950 font-serif font-bold text-sm rounded-lg transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-2.5 mx-auto active:translate-y-0.5 border border-yellow-300/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Examine Mechanism & Open Concealed False Base</span>
              </button>
            ) : (
              <div className="paper-sheet p-5 rounded-lg text-left border-l-4 border-alarm space-y-3 shadow-xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-1.5 border-b border-ink/20">
                  <span className="font-typewriter font-bold text-xs text-alarm flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-alarm" />
                    CONCEALED MICRO-CASSETTE: DR. VANE'S FINAL CONFESSION RECORDING
                  </span>
                  <span className="stamp stamp-skipped text-[9px]">RESTRICTED TESTIMONY</span>
                </div>
                <div className="font-serif text-xs leading-relaxed text-zinc-950 italic bg-manila/60 p-4 rounded border border-ink/15">
                  <strong>DR. ELIAS VANE:</strong> "If you're hearing this, something has gone wrong. Three days ago I realised who my assistant really is. He used his father's name. I should have known Helen's son by his eyes the day he walked in."
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
