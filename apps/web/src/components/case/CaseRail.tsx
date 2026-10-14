import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { Check, Save } from 'lucide-react';

type Tab = 'log' | 'hints' | 'notes' | 'standings';

/** Fallback only: the server is authoritative and sends hintCostsSeconds. */
const FALLBACK_COSTS = [120, 240, 420];

export const CaseRail: React.FC<{ beats: any[]; remaining: number }> = ({ beats }) => {
  const {
    levelDetail, requestHint, notebookText, notebookSaved,
    setNotebookText, saveNotebook, leaderboard, leaderboardHidden, team
  } = useGameStore();

  const [tab, setTab] = useState<Tab>('log');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

  const onNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotebookText(e.target.value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { void saveNotebook(); }, 900);
  };

  const closed = beats.filter((b) => b.closed);
  const hintsUsed = levelDetail?.hintsUsed ?? 0;
  const totalHints = levelDetail?.totalHints ?? 3;
  const costs: number[] = (levelDetail as any)?.hintCostsSeconds ?? FALLBACK_COSTS;
  const charged: number = (levelDetail as any)?.penaltySeconds ?? 0;
  const mins = (sec: number) => `${Math.round(sec / 60)} min`;

  const fmt = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;

  const tabBtn = (id: Tab, label: string, note?: string) => (
    <button
      className="rail-tab"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      type="button"
    >
      {label}{note && <em>{note}</em>}
    </button>
  );

  return (
    <aside className="room-col rail" aria-label="Case rail">
      <div className="rail-tabs" role="tablist">
        {tabBtn('log', 'CASE LOG', String(closed.length))}
        {tabBtn('hints', 'HINTS', `${hintsUsed}/${totalHints}`)}
        {tabBtn('notes', 'NOTES')}
        {tabBtn('standings', 'STANDINGS')}
      </div>

      <div className="rail-body">
        {tab === 'log' && (
          <>
            <p className="railhead">What you have established</p>
            {closed.length === 0 && (
              <p style={{ margin: 0, color: 'var(--dim)', fontSize: '.95rem' }}>
                Nothing yet. Everything you prove is recorded here, in order, so you can
                reconstruct the chain when you write the theory.
              </p>
            )}
            {closed.map((b) => (
              <div className="logitem" key={b.id}>
                <h5>{b.title}</h5>
                <p>{b.belief}</p>
              </div>
            ))}
          </>
        )}

        {tab === 'hints' && (
          <>
            <p className="railhead">
              Three tiers. Each one adds time to your investigation, and time is how this is won.
            </p>
            {charged > 0 && (
              <div className="beliefbox" style={{ borderLeftColor: 'var(--alarm)' }}>
                <span className="bl" style={{ color: 'var(--alarm)' }}>Charged on this case file</span>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.05rem' }}>
                  +{mins(charged)}
                </p>
              </div>
            )}
            {[1, 2, 3].map((tier) => {
              const open = tier <= hintsUsed;
              const text = levelDetail?.hintsRevealed?.[tier - 1];
              return (
                <div className={`hintcard${open ? ' open' : ''}`} key={tier}>
                  <button
                    type="button"
                    onClick={() => { if (!open && tier === hintsUsed + 1) void requestHint(); }}
                    disabled={open || tier !== hintsUsed + 1}
                  >
                    <span className="ht">TIER {tier} · {open ? 'OPENED' : 'SEALED'}</span>
                    <span className="hc">+{mins(costs[tier - 1] ?? 0)}</span>
                  </button>
                  {open && text && <div className="hb">{text}</div>}
                </div>
              );
            })}
          </>
        )}

        {tab === 'notes' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <p className="railhead">Squad logbook</p>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                color: notebookSaved ? 'var(--good)' : 'var(--dim)',
                display: 'inline-flex', alignItems: 'center', gap: 5
              }}>
                {notebookSaved ? <><Check size={11} aria-hidden="true" /> Saved</> : <><Save size={11} aria-hidden="true" /> Saving…</>}
              </span>
            </div>
            <textarea
              id="squad-notes"
              className="notes"
              value={notebookText}
              onChange={onNotes}
              aria-label="Squad logbook"
              placeholder="Times, names, contradictions, anything that does not fit…"
            />
          </>
        )}

        {tab === 'standings' && (
          <>
            <p className="railhead">Ranked on elapsed time</p>
            {leaderboardHidden ? (
              <p style={{ margin: 0, color: 'var(--dim)', fontSize: '.95rem' }}>
                Standings have been sealed by HQ for the closing stretch.
              </p>
            ) : leaderboard.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--dim)', fontSize: '.95rem' }}>
                No squads have reported in yet.
              </p>
            ) : (
              leaderboard.map((e, i) => (
                <div
                  className={`srow${i === 0 ? ' first' : ''}${e.teamId === team?.id ? ' me' : ''}`}
                  key={e.teamId}
                >
                  <span className="sn">{i + 1}</span>
                  <span className="snm">
                    {e.teamName}{e.teamId === team?.id ? ' · you' : ''}
                    {!!(e as any).penaltySeconds && (
                      <span style={{ display: 'block', fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10, color: 'var(--alarm)' }}>
                        incl. +{Math.round((e as any).penaltySeconds / 60)}m hints
                      </span>
                    )}
                  </span>
                  <span className="stm">{fmt(e.totalElapsedSeconds)}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};
