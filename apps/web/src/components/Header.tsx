import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { Clock, ShieldAlert, FileText, LogOut, FolderOpen } from 'lucide-react';

interface HeaderProps {
  onOpenDossier: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDossier }) => {
  const { team, eventClock, setTheoryModalOpen, logout, theoryUnlocked } =
    useGameStore();

  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!eventClock) return;
    setRemainingSeconds(eventClock.remainingSeconds);

    if (eventClock.state !== 'RUNNING') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [eventClock]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };


  return (
    <header className="bg-tape/95 border-b-2 border-signal/40 px-4 py-2.5 text-label flex flex-wrap items-center justify-between gap-3 shadow-desk z-30 select-none relative">
      {/* Decorative Brass Screws in corners */}
      <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-signal/50 border border-ink shadow-inner pointer-events-none" />
      <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-signal/50 border border-ink shadow-inner pointer-events-none" />

      {/* Left: Vintage Plaque Branding & Case ID */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-ink border-2 border-signal/60 flex items-center justify-center font-typewriter text-signal font-bold text-sm shadow-inner relative group">
          <span className="text-signal tracking-tighter">26</span>
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-alarm/80 border border-ink" />
        </div>
        <div>
          <div className="font-typewriter text-base md:text-lg tracking-wider font-bold text-label flex items-center gap-2">
            MURDER MYSTERY
            <span className="text-[11px] px-2 py-0.5 rounded bg-ink/90 border border-signal/40 text-signal font-mono tracking-widest uppercase">
              CASE-2026-2310
            </span>
          </div>
          <div className="text-[11px] text-dim font-serif tracking-wide hidden sm:flex items-center gap-1.5">
            <span>Metropolitan Special Investigations Archive</span>
            <span>&bull;</span>
            <span className="text-signal/90">23 October 2026 Incident File</span>
          </div>
        </div>
      </div>

      {/* Center: Vintage Amber Digital Event Chronometer */}
      <div className="flex items-center gap-2.5 bg-ink/95 px-3.5 py-1.5 rounded border-2 border-signal/40 shadow-inner">
        <Clock
          className="w-4 h-4 text-signal animate-pulse motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tracking-widest font-bold text-[#E5B362] drop-shadow-[0_0_8px_rgba(229,179,98,0.35)]">
              {formatTime(remainingSeconds)}
            </span>
            <span
              className={`text-[9px] uppercase font-typewriter px-1.5 py-0.5 rounded font-bold ${
                eventClock?.state === 'RUNNING'
                  ? 'bg-ok/20 text-[#8BC34A] border border-ok/50'
                  : eventClock?.state === 'PAUSED'
                  ? 'bg-signal/20 text-signal border border-signal/50'
                  : 'bg-alarm/20 text-alarm border border-alarm/50'
              }`}
            >
              {eventClock?.state || 'CLOCK READY'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Team Info & Fast Desk Navigation */}
      <div className="flex items-center gap-2 sm:gap-3">
        {team && (
          <div className="text-right hidden md:block pl-2 border-l border-signal/20">
            <div className="text-xs font-typewriter text-label font-bold tracking-wide">
              {team.name}
            </div>
            <div className="text-[10px] text-signal font-mono flex items-center justify-end gap-1.5">
              <span>
                Code: <strong>{team.code}</strong>
              </span>
              <span>&bull;</span>
              <span className="px-1 rounded bg-signal/15 border border-signal/30 text-[9px]">
                Kit #{team.kitNo}
              </span>
            </div>
          </div>
        )}

        {/* Case Dossier Button (evidence is inside the Dossier) */}
        <button
          type="button"
          onClick={onOpenDossier}
          className="px-2.5 py-1.5 text-xs font-serif bg-manila/15 hover:bg-manila/25 text-label rounded border border-signal/40 flex items-center gap-1.5 transition-all motion-reduce:transition-none shadow-sm hover:border-signal focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          title="Open Case Dossier"
          aria-label="Open Case Dossier"
        >
          <FolderOpen className="w-3.5 h-3.5 text-signal" aria-hidden="true" />
          <span className="hidden sm:inline font-typewriter tracking-wide text-[11px]">
            Case Dossier
          </span>
        </button>

        {/* Case Theory Form Button */}
        <button
          type="button"
          onClick={() => setTheoryModalOpen(true)}
          className={`px-2.5 py-1.5 text-xs font-serif rounded border flex items-center gap-1.5 transition-all motion-reduce:transition-none shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-signal ${
            theoryUnlocked
              ? 'bg-signal text-ink font-bold border-signal animate-bounce motion-reduce:animate-none shadow-[0_0_15px_rgba(166,115,50,0.6)]'
              : 'bg-ink/80 hover:bg-tape text-label border-signal/40 hover:border-signal'
          }`}
          title="Open Final Case Theory Dossier"
          aria-label="Open Prosecution Theory"
        >
          <FileText className="w-3.5 h-3.5 text-signal" aria-hidden="true" />
          <span className="hidden sm:inline font-typewriter tracking-wide text-[11px]">
            Prosecution Theory
          </span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="p-1.5 rounded hover:bg-alarm/20 text-dim hover:text-alarm transition-colors motion-reduce:transition-none ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
          title="Close Investigation Session"
          aria-label="Log out and close investigation session"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Organizer Broadcast Banner */}
      {eventClock?.banner && (
        <div className="w-full bg-alarm/25 border-t border-b border-alarm/50 py-1 px-3 text-xs text-label font-typewriter flex items-center gap-2 animate-in fade-in">
          <ShieldAlert
            className="w-4 h-4 text-alarm flex-shrink-0 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="font-bold tracking-wide">
            [OFFICIAL POLICE DESPATCH]: {eventClock.banner}
          </span>
        </div>
      )}
    </header>
  );
};