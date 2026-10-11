import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { api } from '../../api/client.js';
import { CheckCircle, XCircle, AlertCircle, Terminal, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * One editable blank in the code listing.
 * Defined at module level so it is not re-created on every render
 * (otherwise the input would lose focus after each keystroke).
 */
const BlankInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  kind: 'value' | 'operator';
  disabled?: boolean;
}> = ({ value, onChange, label, kind, disabled }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    placeholder={kind === 'value' ? 'Enter value' : 'Enter operator'}
    autoComplete="off"
    autoCapitalize="off"
    autoCorrect="off"
    spellCheck={false}
    maxLength={8}
    disabled={disabled}
    className={`${
      kind === 'value' ? 'w-32' : 'w-36'
    } bg-[#fff9ea] text-zinc-950 px-2.5 py-0.5 rounded border-2 border-red-800 font-mono font-bold text-xs shadow-sm placeholder:text-zinc-500 placeholder:font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:opacity-70`}
  />
);

export const CodeFill: React.FC = () => {
  const { levelDetail, submitAnswer, selectLevel } = useGameStore();
  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  const [activeLang, setActiveLang] = useState<'python' | 'java' | 'cpp'>('python');

  // All three blanks start empty: nothing is pre-filled.
  const [blank1, setBlank1] = useState('');
  const [blank2, setBlank2] = useState('');
  const [blank3, setBlank3] = useState('');

  const [checkingBlanks, setCheckingBlanks] = useState(false);
  const [blankResults, setBlankResults] = useState<[boolean, boolean, boolean] | null>(null);

  const [outputInput, setOutputInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allBlanksFilled =
    blank1.trim() !== '' && blank2.trim() !== '' && blank3.trim() !== '';

  // Editing a blank clears the old tick/cross so a stale result is never shown
  // next to a new value.
  const updateBlank = (index: 0 | 1 | 2, value: string) => {
    if (index === 0) setBlank1(value);
    if (index === 1) setBlank2(value);
    if (index === 2) setBlank3(value);
    setBlankResults(null);
  };

  const renderResult = (index: 0 | 1 | 2) =>
    blankResults &&
    (blankResults[index] ? (
      <CheckCircle className="w-4 h-4 text-emerald-700" role="img" aria-label="Accepted" />
    ) : (
      <XCircle className="w-4 h-4 text-red-700" role="img" aria-label="Not accepted" />
    ));

  const handleCheckBlanks = async () => {
    if (!allBlanksFilled) return;
    setCheckingBlanks(true);
    setErrorMessage(null);
    try {
      const res = await api.checkBlanks([blank1.trim(), blank2.trim(), blank3.trim()]);
      if (res.results) {
        setBlankResults(res.results as [boolean, boolean, boolean]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to check blanks.');
    } finally {
      setCheckingBlanks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outputInput.trim() || isSolved) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await submitAnswer(outputInput.trim());
    if (!res.correct) {
      setErrorMessage(res.nudge || 'Calculated program output does not match. Double-check your minute math.');
    } else {
      setOutputInput('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Overview Dossier Banner */}
      <div className="paper-sheet p-4 rounded-lg border-2 border-amber-900/40 shadow-sm text-xs text-ink font-serif flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl leading-relaxed">
          A technician began building an inverse restoration script to decode the smart lock's forged timestamp and discover the erased liaison source. Fill in the three blanks in the continuous teletype printout below, verify your entries, and enter the expected console output.
        </p>
        <span className="stamp stamp-open text-[10px]">CONTINUOUS TELETYPE FEED</span>
      </div>

      {/* Dot-Matrix Continuous Feed Tractor Paper Container */}
      <div className="relative bg-[#fcf9f2] rounded-lg border-2 border-[#bfa888] shadow-[0_10px_25px_rgba(0,0,0,0.4)] overflow-hidden text-zinc-950">
        {/* Top Control Bar with Language Selection */}
        <div className="bg-[#241e19] px-4 py-2.5 border-b-2 border-[#5c4631] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <FileCode className="w-4 h-4 text-amber-500 mr-1" aria-hidden="true" />
            {(['python', 'java', 'cpp'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                aria-pressed={activeLang === lang}
                className={`px-3 py-1 rounded text-xs font-mono transition-all motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  activeLang === lang
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-[#c9a777] hover:text-[#e6d8c3] bg-[#14110f] border border-[#5c4631]/50'
                }`}
              >
                {lang === 'python' ? 'Python 3' : lang === 'java' ? 'Java 17' : 'C++ 20'}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-[#c9a777]/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none" />
            <span>DOT-MATRIX LISTING // TRACTOR MARGIN</span>
          </div>
        </div>

        {/* Paper with Tractor-Feed Margins */}
        <div className="relative p-4 sm:p-6 font-mono text-xs sm:text-sm bg-[linear-gradient(to_bottom,#fcf9f2_0px,#fcf9f2_28px,#f4f0e4_28px,#f4f0e4_56px)] bg-[size:100%_56px]">
          {/* Left Tractor Holes */}
          <div className="absolute left-1.5 top-0 bottom-0 flex flex-col justify-around text-zinc-400 text-[10px] pointer-events-none select-none" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i}>○</span>
            ))}
          </div>

          {/* Right Tractor Holes */}
          <div className="absolute right-1.5 top-0 bottom-0 flex flex-col justify-around text-zinc-400 text-[10px] pointer-events-none select-none" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i}>○</span>
            ))}
          </div>

          {/* Code Listing Content */}
          <div className="pl-4 pr-4 space-y-1.5 overflow-x-auto text-zinc-900 leading-relaxed font-bold">
            {activeLang === 'python' && (
              <>
                <div><span className="text-zinc-500 font-normal">01:</span> <span className="text-amber-800">SHIFT_MIN</span> = 42</div>
                <div><span className="text-zinc-500 font-normal">02:</span> <span className="text-amber-800">DROPPED_SOURCE</span> = <span className="text-emerald-800">"LIAISON_4417"</span></div>
                <div><span className="text-zinc-500 font-normal">03:</span> <span className="text-amber-800">forged</span> = <span className="text-emerald-800">"22:26"</span> <span className="text-zinc-500 font-normal italic"># only forged row in export</span></div>
                <div><span className="text-zinc-500 font-normal">04:</span> </div>
                <div><span className="text-zinc-500 font-normal">05:</span> hour, minute = forged.split(<span className="text-emerald-800">":"</span>)</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">06:</span> total = int(hour) ×{' '}
                  <BlankInput
                    value={blank1}
                    onChange={(v) => updateBlank(0, v)}
                    label="Blank 1: value"
                    kind="value"
                  />
                  {' '}+ int(minute) <span className="text-zinc-600 font-normal italic text-xs"># [Blank 1: hours to minutes]</span>
                  {renderResult(0)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">07:</span> total = total{' '}
                  <BlankInput
                    value={blank2}
                    onChange={(v) => updateBlank(1, v)}
                    label="Blank 2: operator"
                    kind="operator"
                  />
                  {' '}SHIFT_MIN <span className="text-zinc-600 font-normal italic text-xs"># [Blank 2: undo backwards shift]</span>
                  {renderResult(1)}
                </div>
                <div><span className="text-zinc-500 font-normal">08:</span> real_hour = total // 60</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">09:</span> real_minute = total{' '}
                  <BlankInput
                    value={blank3}
                    onChange={(v) => updateBlank(2, v)}
                    label="Blank 3: operator"
                    kind="operator"
                  />
                  {' '}60 <span className="text-zinc-600 font-normal italic text-xs"># [Blank 3: remaining minutes]</span>
                  {renderResult(2)}
                </div>
                <div><span className="text-zinc-500 font-normal">10:</span> print(f<span className="text-emerald-800">"&#123;real_hour:02d&#125;&#123;real_minute:02d&#125;-&#123;DROPPED_SOURCE[-4:]&#125;"</span>)</div>
              </>
            )}

            {activeLang === 'java' && (
              <>
                <div><span className="text-zinc-500 font-normal">01:</span> <span className="text-blue-800">int</span> shiftMin = 42;</div>
                <div><span className="text-zinc-500 font-normal">02:</span> String droppedSource = <span className="text-emerald-800">"LIAISON_4417"</span>;</div>
                <div><span className="text-zinc-500 font-normal">03:</span> String forged = <span className="text-emerald-800">"22:26"</span>;</div>
                <div><span className="text-zinc-500 font-normal">04:</span> String[] parts = forged.split(<span className="text-emerald-800">":"</span>);</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">05:</span> <span className="text-blue-800">int</span> total = Integer.parseInt(parts[0]) *{' '}
                  <BlankInput
                    value={blank1}
                    onChange={(v) => updateBlank(0, v)}
                    label="Blank 1: value"
                    kind="value"
                  />
                  {' '}+ Integer.parseInt(parts[1]);
                  {renderResult(0)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">06:</span> total = total{' '}
                  <BlankInput
                    value={blank2}
                    onChange={(v) => updateBlank(1, v)}
                    label="Blank 2: operator"
                    kind="operator"
                  />
                  {' '}shiftMin;
                  {renderResult(1)}
                </div>
                <div><span className="text-zinc-500 font-normal">07:</span> <span className="text-blue-800">int</span> realHour = total / 60;</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">08:</span> <span className="text-blue-800">int</span> realMinute = total{' '}
                  <BlankInput
                    value={blank3}
                    onChange={(v) => updateBlank(2, v)}
                    label="Blank 3: operator"
                    kind="operator"
                  />
                  {' '}60;
                  {renderResult(2)}
                </div>
                <div><span className="text-zinc-500 font-normal">09:</span> System.out.printf(<span className="text-emerald-800">"%02d%02d-%s\n"</span>, realHour, realMinute, droppedSource.substring(droppedSource.length() - 4));</div>
              </>
            )}

            {activeLang === 'cpp' && (
              <>
                <div><span className="text-zinc-500 font-normal">01:</span> <span className="text-blue-800">const int</span> SHIFT_MIN = 42;</div>
                <div><span className="text-zinc-500 font-normal">02:</span> std::string dropped_source = <span className="text-emerald-800">"LIAISON_4417"</span>;</div>
                <div><span className="text-zinc-500 font-normal">03:</span> std::string forged = <span className="text-emerald-800">"22:26"</span>;</div>
                <div><span className="text-zinc-500 font-normal">04:</span> <span className="text-blue-800">int</span> hour = std::stoi(forged.substr(0, 2));</div>
                <div><span className="text-zinc-500 font-normal">05:</span> <span className="text-blue-800">int</span> minute = std::stoi(forged.substr(3, 2));</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">06:</span> <span className="text-blue-800">int</span> total = hour *{' '}
                  <BlankInput
                    value={blank1}
                    onChange={(v) => updateBlank(0, v)}
                    label="Blank 1: value"
                    kind="value"
                  />
                  {' '}+ minute;
                  {renderResult(0)}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">07:</span> total = total{' '}
                  <BlankInput
                    value={blank2}
                    onChange={(v) => updateBlank(1, v)}
                    label="Blank 2: operator"
                    kind="operator"
                  />
                  {' '}SHIFT_MIN;
                  {renderResult(1)}
                </div>
                <div><span className="text-zinc-500 font-normal">08:</span> <span className="text-blue-800">int</span> real_hour = total / 60;</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500 font-normal">09:</span> <span className="text-blue-800">int</span> real_minute = total{' '}
                  <BlankInput
                    value={blank3}
                    onChange={(v) => updateBlank(2, v)}
                    label="Blank 3: operator"
                    kind="operator"
                  />
                  {' '}60;
                  {renderResult(2)}
                </div>
                <div><span className="text-zinc-500 font-normal">10:</span> std::cout &lt;&lt; (real_hour &lt; 10 ? <span className="text-emerald-800">"0"</span> : <span className="text-emerald-800">""</span>) &lt;&lt; real_hour &lt;&lt; (real_minute &lt; 10 ? <span className="text-emerald-800">"0"</span> : <span className="text-emerald-800">""</span>) &lt;&lt; real_minute &lt;&lt; <span className="text-emerald-800">"-"</span> &lt;&lt; dropped_source.substr(dropped_source.length() - 4) &lt;&lt; std::endl;</div>
              </>
            )}
          </div>
        </div>

        {/* Validate Blanks Server Bar */}
        <div className="bg-[#241e19] px-4 py-3 border-t-2 border-[#5c4631] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#c9a777] font-mono text-xs">
            Verify your three entries against the syntax interpreter:
          </span>
          <button
            type="button"
            onClick={handleCheckBlanks}
            disabled={checkingBlanks || !allBlanksFilled}
            className="px-5 py-2 bg-[#171412] hover:bg-[#2b251f] text-amber-400 border border-amber-600/60 font-serif font-bold text-xs rounded transition-all motion-reduce:transition-none shadow active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {checkingBlanks ? 'Interpreting Syntax...' : 'Verify Code Blanks'}
          </button>
        </div>
      </div>

      {/* Program Output Verification Form or Solved Banner */}
      {!isSolved ? (
        <form onSubmit={handleSubmit} className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-3">
          <label htmlFor="level9-output" className="block text-xs font-serif text-label font-medium flex items-center gap-2">
            <Terminal className="w-4 h-4 text-signal" aria-hidden="true" />
            <span>Enter the exact console output produced by the repaired script (format: HHMM-XXXX):</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="level9-output"
              type="text"
              value={outputInput}
              onChange={(e) => setOutputInput(e.target.value)}
              placeholder="2308-4417"
              className="flex-1 bg-ink text-label font-mono text-sm px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none uppercase shadow-inner tracking-wider"
            />
            <button
              type="submit"
              disabled={submitting || !outputInput.trim()}
              className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors motion-reduce:transition-none shadow disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-label"
            >
              {submitting ? 'Verifying Output...' : 'Submit Output String'}
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-1 p-2 bg-red-950/60 rounded border border-red-800" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
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
                LOCK TIME RECONCILED // CASE #09 SOLVED
              </span>
              <span className="text-xs font-serif text-emerald-100/80">
                Calculated genuine lock opening at 23:08 by liaison source 4417. Digital tampering proven.
              </span>
            </div>
          </div>

          <button
            onClick={() => selectLevel(10)}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-serif font-bold text-xs uppercase tracking-wider rounded transition-colors shadow-lg active:translate-y-0.5 flex items-center gap-2"
          >
            <span>Proceed to Case #10</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};