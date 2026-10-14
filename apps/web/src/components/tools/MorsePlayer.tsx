import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { api } from '../../api/client.js';
import { Play, RotateCcw, Volume2, AlertCircle, FileText, Disc, Radio, Sliders, Download, CheckCircle2, ArrowRight } from 'lucide-react';

export const MorsePlayer: React.FC = () => {
  const { levelDetail, submitAnswer } = useGameStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [pulseData, setPulseData] = useState<any>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioSourceType, setAudioSourceType] = useState<'recording' | 'synthesized'>('synthesized');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const timeoutIdsRef = useRef<any[]>([]);

  useEffect(() => {
    // Fetch pulse timing data
    api.getMorseData().then((data) => {
      setPulseData(data);
    }).catch((err) => {
      console.warn('Could not fetch morse pulses:', err);
    });

    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    if (audioElemRef.current) {
      try {
        audioElemRef.current.pause();
        audioElemRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      audioElemRef.current = null;
    }
    timeoutIdsRef.current.forEach((t) => clearTimeout(t));
    timeoutIdsRef.current = [];
    setIsPlaying(false);
    setPulseActive(false);
  };

  const startVisualPulseTimeline = () => {
    if (!pulseData || !pulseData.pulses) return;
    let currentTimeMs = 0;

    pulseData.pulses.forEach((p: { on: boolean; duration: number }) => {
      const duration = p.duration / speed;
      const startTime = currentTimeMs;

      const tVisual = setTimeout(() => {
        setPulseActive(p.on);
      }, startTime);
      timeoutIdsRef.current.push(tVisual);

      currentTimeMs += duration;
    });

    const tReset = setTimeout(() => {
      setPulseActive(false);
    }, currentTimeMs + 100);
    timeoutIdsRef.current.push(tReset);
  };

  const playSynthesizedMorse = () => {
    setAudioSourceType('synthesized');
    if (!pulseData || !pulseData.pulses) return;

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    let currentTimeMs = 0;

    pulseData.pulses.forEach((p: { on: boolean; duration: number }) => {
      const duration = p.duration / speed;
      const startTime = currentTimeMs;

      // Visual pulse
      const tVisual = setTimeout(() => {
        setPulseActive(p.on);
      }, startTime);
      timeoutIdsRef.current.push(tVisual);

      // Audio tone via Web Audio oscillator
      if (p.on) {
        const tAudio = setTimeout(() => {
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(680, ctx.currentTime);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration / 1000);
          } catch (e) {
            // Audio policy fallback
          }
        }, startTime);
        timeoutIdsRef.current.push(tAudio);
      }

      currentTimeMs += duration;
    });

    const tEnd = setTimeout(() => {
      stopPlayback();
    }, currentTimeMs + 300);
    timeoutIdsRef.current.push(tEnd);
  };

  const playMorseSound = () => {
    stopPlayback();
    setIsPlaying(true);

    // Attempt owner-provided recording first if available at apps/web/public/assets/audio/recording-seven.mp3
    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      playSynthesizedMorse();
    };

    try {
      const audio = new Audio('/assets/audio/recording-seven.mp3');
      audio.playbackRate = speed;
      audioElemRef.current = audio;

      audio.onplay = () => {
        setAudioSourceType('recording');
        startVisualPulseTimeline();
      };

      audio.onended = () => {
        stopPlayback();
      };

      audio.onerror = () => {
        triggerFallback();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          triggerFallback();
        });
      }
    } catch (e) {
      triggerFallback();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);

    const res = await submitAnswer(answerInput.trim());
    if (!res.correct) {
      setErrorMessage(res.nudge || 'Decoding does not match. Check cadence of short and long taps.');
    } else {
      setAnswerInput('');
    }
    setSubmitting(false);
  };

  // Complete Morse reference chart appears after Hint 3 is revealed
  const isHint3Revealed = (levelDetail?.hintsUsed || 0) >= 3;
  const isSolved = levelDetail?.status === 'SOLVED';

  return (
    <div className="space-y-5">
      {/* 1980s Reel-to-Reel Tape Deck Chassis */}
      <div className="relative bg-gradient-to-b from-[#24201c] via-[#1a1714] to-[#12100e] p-5 rounded-lg border-2 border-[#5c4631] shadow-[0_12px_30px_rgba(0,0,0,0.6)] space-y-4">
        {/* Top Machine Faceplate Bar */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#5c4631]/60 text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
            <span className="font-typewriter font-bold text-[#e6d8c3] tracking-wider text-xs sm:text-sm">
              NAGRA-IV / ARCHIVAL MAGNETIC RECORDER
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#3b2d1f] text-[#c9a777] text-[10px] font-mono border border-[#5c4631]">
              POLICE EXHIBIT 07
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#c9a777]/80">
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8c7457]">COUNTER:</span>
              <span className="px-2 py-0.5 bg-black rounded border border-[#5c4631] text-amber-500 font-bold tracking-widest text-xs">
                {isPlaying ? '02:14' : '00:00'}
              </span>
            </span>
            <span className="hidden sm:inline text-[#8c7457]">| 7.5 IPS • 1/4" TAPE</span>
          </div>
        </div>

        {/* Vintage Physical Cassette Tape Body & Dual Spools */}
        <div className="relative bg-[#171412] p-5 rounded-md border border-[#3d2e20] shadow-inner overflow-hidden">
          {/* Subtle brushed metal background lines */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Tape Label Sticker */}
          <div className="relative mx-auto max-w-md bg-[#eee5d3] p-3 rounded shadow-md border border-[#a89574] mb-5 transform -rotate-[0.5deg]">
            <div className="flex items-center justify-between border-b border-[#a89574]/60 pb-1 mb-1.5 text-[10px] font-typewriter">
              <span className="font-bold text-red-800 tracking-wider">MUMBAI POLICE EVIDENCE TAPE</span>
              <span className="font-mono text-zinc-700">SIDE A • MONO</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-zinc-900">
              <span className="font-bold">ITEM: VANE-CONFIDENTIAL-07</span>
              <span className="text-[10px] text-zinc-600">DATE: 23 OCT 2026</span>
            </div>
            <div className="mt-1 text-[11px] font-serif text-zinc-700 italic border-t border-dashed border-[#a89574]/40 pt-1">
              "Restricted audio recovery: Mira Vane acoustic session / tapping interval."
            </div>
          </div>

          {/* Dual Spools and Tape Transport */}
          <div className="relative flex items-center justify-around py-3">
            {/* Magnetic Tape Ribbon connecting reels */}
            <div className="absolute top-[52px] left-[22%] right-[22%] h-1 bg-[#261e16] border-t border-b border-[#3d2c1e] shadow-sm z-0" />

            {/* Left Feed Reel */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#3d2e20] bg-gradient-to-tr from-[#2b251f] via-[#1c1815] to-[#3a3128] shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center relative transition-transform ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: speed === 0.5 ? '8s' : speed === 0.75 ? '5.5s' : '4s' }}
              >
                {/* 3 spoke cutouts */}
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#5c4631]/40" />
                <div className="w-10 h-10 rounded-full border-2 border-[#8c7457] bg-[#120f0d] flex items-center justify-center shadow-inner">
                  <div className="w-4 h-4 rounded-full bg-[#8c7457] border border-[#2b251f]" />
                </div>
                {/* Visual spoke bars */}
                <div className="absolute w-full h-0.5 bg-[#5c4631]/60" />
                <div className="absolute h-full w-0.5 bg-[#5c4631]/60" />
              </div>
              <span className="text-[10px] font-mono text-[#8c7457] tracking-wider uppercase">SUPPLY SPOOL</span>
            </div>

            {/* Center Tape Head & VU Meters */}
            <div className="relative z-10 flex flex-col items-center gap-2 px-2">
              {/* Dual Analog VU Meters */}
              <div className="flex items-center gap-2 bg-[#0e0c0b] p-2 rounded border border-[#3d2e20] shadow-inner">
                {/* Left VU Meter */}
                <div className="w-16 h-12 bg-amber-950/30 rounded border border-amber-900/40 p-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="text-[8px] font-mono text-amber-500/70 tracking-tighter flex justify-between">
                    <span>-20</span>
                    <span>0</span>
                    <span className="text-red-500">+3</span>
                  </div>
                  {/* Needle */}
                  <div
                    className={`w-0.5 h-7 bg-amber-400 origin-bottom mx-auto transition-transform duration-75 ${
                      pulseActive ? 'rotate-[25deg] shadow-[0_0_6px_rgba(251,191,36,0.9)]' : isPlaying ? 'rotate-[-10deg]' : '-rotate-[30deg]'
                    }`}
                  />
                  <div className="text-[7px] font-mono text-center text-amber-600">VU CH-1</div>
                </div>

                {/* Right VU Meter */}
                <div className="w-16 h-12 bg-amber-950/30 rounded border border-amber-900/40 p-1 flex flex-col justify-between relative overflow-hidden">
                  <div className="text-[8px] font-mono text-amber-500/70 tracking-tighter flex justify-between">
                    <span>-20</span>
                    <span>0</span>
                    <span className="text-red-500">+3</span>
                  </div>
                  {/* Needle */}
                  <div
                    className={`w-0.5 h-7 bg-amber-400 origin-bottom mx-auto transition-transform duration-75 ${
                      pulseActive ? 'rotate-[20deg] shadow-[0_0_6px_rgba(251,191,36,0.9)]' : isPlaying ? 'rotate-[-12deg]' : '-rotate-[30deg]'
                    }`}
                  />
                  <div className="text-[7px] font-mono text-center text-amber-600">VU CH-2</div>
                </div>
              </div>

              {/* Central Signal Pulse Indicator Lamp */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-full transition-all duration-75 border-2 flex items-center justify-center ${
                    pulseActive
                      ? 'bg-amber-400 border-yellow-200 scale-110 shadow-[0_0_30px_rgba(251,191,36,1)]'
                      : 'bg-[#241c14] border-[#5c4631]/60 scale-95 shadow-inner'
                  }`}
                >
                  <Radio className={`w-5 h-5 ${pulseActive ? 'text-zinc-950' : 'text-[#8c7457]/50'}`} />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-[#c9a777]">
                  {pulseActive ? 'PULSE PEAK [ON]' : isPlaying ? 'TRACK SCANNING' : 'DECK IDLE'}
                </span>
              </div>
            </div>

            {/* Right Take-Up Reel */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#3d2e20] bg-gradient-to-tr from-[#2b251f] via-[#1c1815] to-[#3a3128] shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center relative transition-transform ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: speed === 0.5 ? '8s' : speed === 0.75 ? '5.5s' : '4s' }}
              >
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#5c4631]/40" />
                <div className="w-10 h-10 rounded-full border-2 border-[#8c7457] bg-[#120f0d] flex items-center justify-center shadow-inner">
                  <div className="w-4 h-4 rounded-full bg-[#8c7457] border border-[#2b251f]" />
                </div>
                <div className="absolute w-full h-0.5 bg-[#5c4631]/60" />
                <div className="absolute h-full w-0.5 bg-[#5c4631]/60" />
              </div>
              <span className="text-[10px] font-mono text-[#8c7457] tracking-wider uppercase">TAKE-UP SPOOL</span>
            </div>
          </div>
        </div>

        {/* Tactile Deck Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-[#171412] p-3 rounded border border-[#3d2e20]">
          {/* Main Transport Buttons */}
          {/* Main Transport Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={playMorseSound}
              disabled={isPlaying}
              className="px-4 py-2 bg-gradient-to-b from-[#b8860b] to-[#926808] hover:from-[#d4af37] hover:to-[#b8860b] text-zinc-950 font-serif font-bold text-xs rounded border border-[#ffd700]/40 transition-all flex items-center gap-1.5 shadow-[0_2px_5px_rgba(0,0,0,0.5)] active:translate-y-0.5 disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPlaying ? 'Tape Rolling...' : 'Play Audio Reel'}</span>
            </button>

            <button
              onClick={stopPlayback}
              disabled={!isPlaying}
              className="px-3.5 py-2 bg-gradient-to-b from-[#2d251e] to-[#1c1713] hover:from-[#3d3128] hover:to-[#241e18] text-[#e6d8c3] font-serif text-xs rounded border border-[#5c4631] transition-all flex items-center gap-1.5 shadow active:translate-y-0.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Stop / Rewind</span>
            </button>

            {/* Direct MP3 File Export */}
            <a
              href="/assets/audio/recording-seven.mp3"
              download="Recording_Seven_Tape07.mp3"
              className="px-3.5 py-2 bg-gradient-to-b from-[#2a3826] to-[#182416] hover:from-[#384d32] hover:to-[#22331f] text-[#c8e6c9] font-serif text-xs rounded border border-[#3b5e34] transition-all flex items-center gap-1.5 shadow active:translate-y-0.5"
              title="Export and download master audio file as MP3"
            >
              <Download className="w-3.5 h-3.5 text-ok" />
              <span>Export MP3 File</span>
            </a>
          </div>

          {/* Speed Controls (0.5x, 0.75x, 1.0x) */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#8c7457] text-[11px] flex items-center gap-1">
              <Sliders className="w-3 h-3 text-[#c9a777]" />
              SPEED:
            </span>
            {[0.5, 0.75, 1.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  speed === s
                    ? 'bg-[#c9a777] text-zinc-950 font-bold shadow'
                    : 'bg-[#241c14] text-[#8c7457] hover:text-[#e6d8c3] border border-[#5c4631]/50'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Morse Reference Chart (Unlocked only after Hint 3) */}
      {isHint3Revealed && (
        <div className="paper-sheet p-5 rounded text-xs text-ink font-mono border-2 border-signal/50 shadow-paper space-y-3">
          <div className="font-typewriter font-bold text-ink pb-2 border-b border-ink/20 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-signal" />
              CRIME BRANCH // TELEGRAPHIC SIGNAL CODE REFERENCE
            </span>
            <span className="stamp stamp-open text-[9px]">HINT 3 ATTACHMENT</span>
          </div>

          {/* Complete Alphabet (A-Z) */}
          <div>
            <span className="text-[10px] font-mono font-bold text-ink/70 uppercase tracking-wider block mb-1.5">
              ALPHABETIC CODES (A to Z):
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-1.5 text-center text-xs font-bold text-ink/90">
              <div className="p-1 bg-manila/60 rounded border border-ink/15">A: · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">B: - · · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">C: - · - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">D: - · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">E: ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">F: · · - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">G: - - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">H: · · · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">I: · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">J: · - - -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">K: - · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">L: · - · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">M: - -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">N: - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">O: - - -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">P: · - - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">Q: - - · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">R: · - ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">S: · · ·</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">T: -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">U: · · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">V: · · · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">W: · - -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">X: - · · -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">Y: - · - -</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">Z: - - · ·</div>
            </div>
          </div>

          {/* Numeric Digits (0-9) */}
          <div className="pt-1 border-t border-ink/15">
            <span className="text-[10px] font-mono font-bold text-ink/70 uppercase tracking-wider block mb-1.5">
              NUMERICAL CODES (0 to 9):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5 text-center text-xs font-bold text-ink/90">
              <div className="p-1 bg-manila/60 rounded border border-ink/15">0: -----</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">1: ·----</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">2: ··---</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">3: ···--</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">4: ····-</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">5: ·····</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">6: -····</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">7: --···</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">8: ---··</div>
              <div className="p-1 bg-manila/60 rounded border border-ink/15">9: ----·</div>
            </div>
          </div>
        </div>
      )}

      {/* Recovered Transcript Card (Shown on solve) */}
      {isSolved && (
        <div className="paper-sheet p-5 rounded border-l-4 border-ok text-ink shadow-paper space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-ink/20">
            <span className="font-typewriter font-bold text-xs flex items-center gap-2 text-ok">
              <FileText className="w-4 h-4 text-ok" />
              RECOVERED SESSION TRANSCRIPT: TAPE 07
            </span>
            <span className="stamp stamp-closed text-[9px]">RESTORED EVIDENCE</span>
          </div>
          <div className="font-serif text-xs leading-relaxed text-ink/90 italic bg-manila/50 p-3 rounded border border-ink/10">
            <strong>DR. ELIAS VANE:</strong> "You weren't the one who killed him, Mira. We both know that. But who do you think the police will believe when the report carries an official seal?"
          </div>
        </div>
      )}

      {/* Answer Form or Solved / Locked State */}
      {isSolved ? (
        <div className="p-5 bg-gradient-to-r from-[#172b1c] to-[#122015] rounded border-2 border-ok/80 shadow-desk space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-ok/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-ok" />
              <span className="font-typewriter font-bold text-xs uppercase tracking-wider text-ok">
                TAPS DECODED: SEE THE EXHIBIT RECORD BELOW
              </span>
            </div>
            <span className="stamp stamp-closed text-[10px]">CASE SOLVED &bull; INPUT LOCKED</span>
          </div>

          <p className="font-serif text-xs text-dim leading-relaxed">
            Acoustic tapping decoded: Mira Vane communicated that she was innocent and pointed to Julian Marsh. The transcript is permanently logged. Submission field is locked.
          </p>

          {/* advancement is owned by the case room */}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 bg-tape/90 rounded border border-signal/40 shadow-desk space-y-3">
          <label className="block text-xs font-serif text-label font-medium">
            Enter the message Mira tapped out:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Decoded message"
              className="flex-1 bg-ink text-label font-mono text-sm px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none tracking-widest uppercase shadow-inner"
            />
            <button
              type="submit"
              disabled={submitting || !answerInput.trim()}
              className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Submit Message'}
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
