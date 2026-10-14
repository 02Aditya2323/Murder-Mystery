import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Laptop, Table2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

interface ExportRow { time: string; event: string; source: string }

/**
 * Beat 9: The Locked Room.
 *
 * Code reading, not debugging. The team is handed the script that cleaned the
 * lock export and the export it produced, and has to reason backwards. There
 * is nothing to compile and nothing to guess: no dropdowns, no per-blank
 * checker endpoint to brute-force.
 */
export const CodeFill: React.FC = () => {
  const { levelDetail, submitAnswer } = useGameStore();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const script = (levelDetail as any)?.script;
  const rows: ExportRow[] = (levelDetail as any)?.exportRows ?? [];
  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  const onSubmit = async () => {
    if (!answer.trim() || busy || isSolved) return;
    setBusy(true);
    setError(null);
    const res = await submitAnswer(answer.trim());
    if (!res.correct) {
      setError(
        res.nudge ||
          'That is not what the script produces. Work out which single row it rewrote, then reverse the two things it did to that row.'
      );
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {/* ── the script ─────────────────────────────────────────────── */}
      {script && (
        <section className="rounded border border-[#2C323C] bg-[#0A0C0F] overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#12151A] border-b border-[#2C323C]">
            <span className="flex items-center gap-2 font-typewriter text-xs tracking-wider text-[#ECE6DA]">
              <Laptop className="w-4 h-4 text-signal" aria-hidden="true" />
              {script.filename}
            </span>
            <span className="font-mono text-[10px] text-dim">{script.found}</span>
          </header>
          <pre className="m-0 p-4 overflow-x-auto font-mono text-[13px] leading-[1.75] text-[#CFE3B8] whitespace-pre">
            <code>{script.code}</code>
          </pre>
        </section>
      )}

      {/* ── the export it produced ─────────────────────────────────── */}
      {rows.length > 0 && (
        <section className="rounded border border-[#2C323C] bg-[#12151A] overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[#2C323C]">
            <span className="flex items-center gap-2 font-typewriter text-xs tracking-wider text-[#ECE6DA]">
              <Table2 className="w-4 h-4 text-signal" aria-hidden="true" />
              SMART LOCK EXPORT: AS FILED
            </span>
            <span className="font-mono text-[10px] text-dim">3 rows</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-[13px]">
              <thead>
                <tr>
                  {['Time (IST)', 'Event', 'Source'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-typewriter text-[10px] tracking-widest uppercase font-normal text-dim px-4 py-2 border-b border-[#2C323C]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const forged = r.source === 'INTERIOR_PANEL';
                  return (
                    <tr key={i} className={forged ? 'bg-[rgba(217,154,60,.07)]' : ''}>
                      <td className="px-4 py-2.5 border-b border-[#1F242C] tabular-nums text-[#ECE6DA]">
                        {r.time}
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#1F242C] text-[#ECE6DA]">{r.event}</td>
                      <td className="px-4 py-2.5 border-b border-[#1F242C] text-dim">{r.source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 text-[12.5px] text-dim border-t border-[#2C323C]">
            This is the export the investigation was given. It is not the raw log.
          </p>
        </section>
      )}

      {/* ── answer ─────────────────────────────────────────────────── */}
      {!isSolved ? (
        <section className="rounded border border-[#2C323C] bg-[#1A1E25] p-4 space-y-3">
          <div>
            <p className="m-0 text-[15px] text-[#ECE6DA]">
              When was the study really locked, and which source did the script erase?
            </p>
            <p className="m-0 mt-1 font-mono text-[12px] text-dim">
              HHMM-XXXX: the true time in 24-hour IST, a hyphen, then the last four
              characters of the erased account.
            </p>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <input
              id="beat9-answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') void onSubmit(); }}
              placeholder="HHMM-XXXX"
              aria-label="Restored lock time and erased account"
              spellCheck={false}
              autoComplete="off"
              className="flex-1 min-w-[180px] bg-[#0A0C0F] border border-[#2C323C] rounded px-3.5 py-3 font-mono text-[20px] tracking-[.14em] text-[#F0C878] focus:outline-none focus:border-signal"
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={busy}
              className="px-6 py-3 rounded bg-signal hover:bg-[#E8AB4D] text-[#16110A] font-typewriter text-[13px] tracking-wider disabled:opacity-50"
            >
              {busy ? 'Checking…' : 'Submit'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded border border-[rgba(209,72,58,.45)] bg-[rgba(209,72,58,.1)] px-3.5 py-3 text-[14px] text-[#EBA79E]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded border border-[rgba(127,160,90,.35)] bg-[rgba(127,160,90,.08)] p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-ok shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="m-0 font-typewriter text-[11px] tracking-widest uppercase text-ok">
              Export de-obfuscated
            </p>
            <p className="m-0 text-[14.5px] text-[#D8D3C6] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Locked remotely at 23:08 from the victim&rsquo;s own tablet. It was never a locked room.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};
