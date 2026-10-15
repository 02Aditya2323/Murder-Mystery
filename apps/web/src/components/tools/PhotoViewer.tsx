import React, { useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { ZoomIn, ZoomOut, RotateCcw, Image, AlertCircle, FileText, Crosshair, MapPin, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

export const PhotoViewer: React.FC = () => {
  const { levelDetail, submitAnswer } = useGameStore();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const photoUrl = levelDetail?.photoUrl || '/api/levels/7/assets/images/l7_geo_photo.jpg';
  const attribution = levelDetail?.attribution || 'Evidence Exhibit';

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.8));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || isSolved) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await submitAnswer(answerInput.trim());
    if (!res.correct) {
      setErrorMessage(
        res.nudge ||
          'Location could not be reconciled. Examine distinctive coastal cliffs, monuments, or enter coordinates.'
      );
    } else {
      setAnswerInput('');
    }
    setSubmitting(false);
  };

  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  return (
    <div className="space-y-5 select-none">
      {/* Archival Photo Mounting Board */}
      <div className="relative bg-gradient-to-b from-[#211c18] via-[#1a1613] to-[#120f0d] p-5 sm:p-6 rounded-lg border-2 border-[#5c4631] shadow-[0_12px_30px_rgba(0,0,0,0.6)] space-y-4">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#5c4631]/60 text-xs gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="font-typewriter font-bold text-[#e6d8c3] tracking-wider text-xs sm:text-sm">
              ADRIAN CROSS // ALIBI IMAGE, RECONSTRUCTED
            </span>
          </div>

          {/* Zoom and Navigation Controls */}
          <div className="flex items-center gap-1.5 bg-[#0f0d0b] p-1 rounded-md border border-[#5c4631]">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded bg-[#241e18] hover:bg-[#382e25] text-amber-400 border border-[#5c4631]/50 transition-colors"
              title="Zoom in (examine landmarks)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded bg-[#241e18] hover:bg-[#382e25] text-amber-400 border border-[#5c4631]/50 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded bg-[#241e18] hover:bg-[#382e25] text-amber-400 border border-[#5c4631]/50 transition-colors"
              title="Reset optical framing"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Darkroom Photo Viewing Frame with Corner Mounts */}
        <div className="relative bg-[#0d0b09] p-2.5 sm:p-4 rounded-md border-2 border-[#3d2e20] shadow-inner overflow-hidden">
          {/* Triangular Corner Mounts */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-600/60 z-20 pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-600/60 z-20 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-600/60 z-20 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-600/60 z-20 pointer-events-none" />

          {/* Interactive Viewport */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            className="relative bg-black rounded h-72 sm:h-[420px] overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center border border-zinc-800"
          >
            {/* Crosshair Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#d4af37_1px,transparent_1px),linear-gradient(to_bottom,#d4af37_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Target Reticle in Center */}
            <div className="absolute pointer-events-none opacity-30 text-amber-500 flex items-center justify-center">
              <Crosshair className="w-16 h-16 stroke-[1]" />
            </div>

            <img
              src={photoUrl}
              alt="Forensic reconstruction of the alibi image: angled fort bastions on the shore, a square fort alone in the water, a church bell tower on the rise, and a seafront promenade"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/l7_geo_photo.jpg';
              }}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-h-full max-w-full object-contain pointer-events-none select-none filter contrast-105"
            />

            {/* Magnification readout */}
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-[#120f0d]/90 text-[10px] font-mono text-amber-400 border border-[#5c4631] pointer-events-none shadow">
              OPTICAL MAGNIFICATION: {Math.round(scale * 100)}% • CLICK & DRAG TO PAN
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#c9a777]/80 font-mono italic pt-1">
          <span>FORENSIC EXHIBIT 07 // POSTED 22:21 IST // NO EMBEDDED METADATA</span>
          <span>{attribution}</span>
        </div>
      </div>

      {/* Unlocked Memorial Registry (Shown on solve) */}
      {isSolved && (
        <div className="paper-sheet p-6 rounded-lg border-l-4 border-ok text-ink shadow-[0_6px_20px_rgba(0,0,0,0.3)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ink/20">
            <span className="font-typewriter font-bold text-xs flex items-center gap-2 text-zinc-950">
              <FileText className="w-4 h-4 text-ok" />
              MUNICIPAL REGISTER: JULIAN MARSH MEMORIAL BENCH
            </span>
            <span className="stamp stamp-closed text-[9px]">CROSS-REFERENCED</span>
          </div>
          <div className="font-serif text-xs leading-relaxed text-zinc-950 p-4 bg-manila/60 rounded border border-ink/20 space-y-2">
            <p className="font-typewriter font-bold text-base text-center text-red-950">
              IN LOVING MEMORY OF JULIAN MARSH (1996 - 2023)
            </p>
            <p className="text-center italic text-zinc-700">
              "Seeking the truth that was taken from him."
            </p>
            <p className="text-center font-bold text-sm text-zinc-900 border-t border-b border-ink/15 py-1.5 my-2">
              Dedicated by his mother, Helen Marsh, and his brother, Adrian Cross (Marsh).
            </p>
            <p className="text-[11px] text-center font-mono text-zinc-600">
              Location confirmed against the municipal memorial registry. See the exhibit record below.
            </p>
          </div>
        </div>
      )}

      {/* Geolocation Answer Form or Solved Banner */}
      {!isSolved ? (
        <form onSubmit={handleSubmit} className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-3">
          <label className="block text-xs font-serif text-label font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-signal" />
            <span>Where was this drawn from? Enter the town or the landmark, or coordinates as lat,lng.</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Town, landmark, or lat,lng"
              className="flex-1 bg-ink text-label font-mono text-xs sm:text-sm px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none uppercase shadow-inner"
            />
            <button
              type="submit"
              disabled={submitting || !answerInput.trim()}
              className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
            >
              {submitting ? 'Verifying Geo...' : 'Verify Location'}
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-1 p-2 bg-red-950/60 rounded border border-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      ) : (
        <div className="p-5 bg-gradient-to-r from-[#172314] via-[#1f301b] to-[#172314] rounded-lg border-2 border-emerald-600/70 shadow-desk flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-typewriter text-sm text-emerald-200 font-bold block uppercase tracking-wider">
                LOCATION VERIFIED // CASE #07 SOLVED
              </span>
              <span className="text-xs font-serif text-emerald-100/80">
                The alibi image traced to its real coastline. The memorial registry does the rest.
              </span>
            </div>
          </div>

          {/* advancement is owned by the case room */}
        </div>
      )}
    </div>
  );
};
