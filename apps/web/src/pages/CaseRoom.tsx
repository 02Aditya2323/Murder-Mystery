import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';
import { MarkdownText } from '../components/LevelWorkspace.js';
import { PersonSheet } from '../components/case/PersonSheet.js';
import { CaseRail } from '../components/case/CaseRail.js';
import { EvidenceUnlocked } from '../components/case/EvidenceUnlocked.js';
import { FinalTheoryModal } from '../components/FinalTheoryModal.js';
import { ToastContainer } from '../components/ToastContainer.js';

import { LogViewer } from '../components/tools/LogViewer.js';
import { MorsePlayer } from '../components/tools/MorsePlayer.js';
import { DocViewer } from '../components/tools/DocViewer.js';
import { SqlConsole } from '../components/tools/SqlConsole.js';
import { MatchBoard } from '../components/tools/MatchBoard.js';
import { DiaryTable } from '../components/tools/DiaryTable.js';
import { PhotoViewer } from '../components/tools/PhotoViewer.js';
import { KitStation } from '../components/tools/KitStation.js';
import { CodeFill } from '../components/tools/CodeFill.js';
import { FlagForm } from '../components/tools/FlagForm.js';

import { FolderOpen, Gavel, LogOut, ArrowRight } from 'lucide-react';

const THREE_HOURS = 3 * 60 * 60;

const TOOLS: Record<number, React.FC> = {
  1: LogViewer, 2: MorsePlayer, 3: DocViewer, 4: SqlConsole, 5: MatchBoard,
  6: DiaryTable, 7: PhotoViewer, 8: KitStation, 9: CodeFill, 10: FlagForm
};

function hhmmss(total: number) {
  const s = Math.max(0, total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

export const CaseRoom: React.FC = () => {
  const navigate = useNavigate();
  const {
    team, init, levels, levelDetail, loadingLevel, selectLevel,
    caseData, setTheoryModalOpen, theoryUnlocked, logout
  } = useGameStore();

  const [openPerson, setOpenPerson] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const t = setTimeout(() => {
      const s = useGameStore.getState();
      if (!s.team && !s.isAdmin) navigate('/enter');
    }, 600);
    return () => clearTimeout(t);
  }, [navigate]);

  // Per-team clock. Counts UP from zero at this squad's own sign-in, because
  // elapsed time is what the squads are actually ranked on. Three hours is the
  // target, not a cutoff: batches overlap and teams are allowed to overrun, so
  // the clock keeps running and only changes colour once it passes the target.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = useMemo(() => {
    const first = levels.find((l) => l.id === 1);
    if (!first?.startedAt) return 0;
    return Math.floor((Date.now() - new Date(first.startedAt).getTime()) / 1000);
  }, [levels, tick]);

  const overTarget = elapsed > THREE_HOURS;

  const beats = caseData?.beats ?? [];
  const current = beats.find((b: any) => b.current) ?? null;
  const justClosed = beats.filter((b: any) => b.closed).slice(-1)[0] ?? null;
  const people = caseData?.people ?? [];

  // Which beat's consequence are we showing? The one the team just finished.
  const showing = levelDetail && levelDetail.status === 'SOLVED'
    ? beats.find((b: any) => b.id === levelDetail.id)
    : null;

  const activeBeat = current ?? justClosed;
  const Tool = levelDetail ? TOOLS[levelDetail.id] : null;
  const nextBeatId = levelDetail && levelDetail.id < 10 ? levelDetail.id + 1 : null;
  const person = people.find((p: any) => p.id === openPerson) ?? null;

  if (!caseData || !levelDetail) {
    return (
      <div className="room night" style={{ display: 'grid', placeItems: 'center' }}>
        <p className="eyebrow">Unsealing the case file…</p>
      </div>
    );
  }

  return (
    <div className="room night">
      {/* ── command bar ─────────────────────────────────────────────── */}
      <header className="room-bar">
        <span className="rb-brand">THE LAST RECORDING</span>
        <span className="rb-case">{caseData.setting?.caseRef ?? 'MUM/HOM/2026/2310'}</span>

        <div className="rb-clock">
          <div>
            <span className="lbl">{overTarget ? 'ELAPSED / PAST THREE HOURS' : 'TIME ELAPSED'}</span>
            <span className={`t${overTarget ? ' over' : ''}`}>{hhmmss(elapsed)}</span>
          </div>
        </div>

        {team && (
          <div className="rb-team">
            <b>{team.name}</b>
            Kit #{team.kitNo} · {caseData.closedCount} of {caseData.totalBeats} closed
          </div>
        )}

        <button className="iconbtn" type="button" onClick={() => setOpenPerson(people[0]?.id ?? null)}>
          <FolderOpen size={14} aria-hidden="true" /> Dossiers
        </button>

        <button
          className={`iconbtn${theoryUnlocked ? ' hot' : ''}`}
          type="button"
          onClick={() => setTheoryModalOpen(true)}
        >
          <Gavel size={14} aria-hidden="true" /> Theory
        </button>

        <button className="iconbtn" type="button" onClick={logout} aria-label="Sign out">
          <LogOut size={14} aria-hidden="true" />
        </button>
      </header>

      {/* ── the board: who these people are and where they stand ────── */}
      <div className="boardstrip" aria-label="Persons in the case">
        {people.map((p: any) => (
          <button
            key={p.id}
            type="button"
            className={`person tone-${p.standingTone}`}
            onClick={() => setOpenPerson(p.id)}
            title={p.standingWhy || p.summary}
          >
            <span className="face" aria-hidden="true">{p.portraitKey}</span>
            <span style={{ minWidth: 0, textAlign: 'left' }}>
              <span className="pn">{p.name}</span>
              <span className="ps">{p.standingLabel}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── the work ─────────────────────────────────────────────────── */}
      <div className="room-main">
        <section className="room-col room-work">
          <div className="work-inner">
            {activeBeat && (
              <div className="scene-head">
                <span className="where">{activeBeat.place} · {activeBeat.time}</span>
                <h1>{activeBeat.title}</h1>
              </div>
            )}

            {activeBeat?.arrive && <div className="narr">{activeBeat.arrive}</div>}

            {loadingLevel ? (
              <p className="eyebrow">Loading evidence…</p>
            ) : (
              Tool && <section aria-label="Evidence workspace"><Tool /></section>
            )}

            {/* consequence of what they just proved */}
            {showing?.closed && (
              <>
                <div className="consequence">
                  <span className="ctitle">What this establishes</span>
                  <div className="ctext">{showing.depart}</div>
                </div>

                {showing.board?.length > 0 && (
                  <div className="movelist">
                    <p className="railhead">The board moves</p>
                    {showing.board.map((m: any) => (
                      <div className="move" key={m.who}>
                        <span className={`badge tone-${m.tone}`} style={{ color: 'currentColor' }}>
                          {m.name} → {m.toLabel}
                        </span>
                        <span className="mv">{m.why}</span>
                      </div>
                    ))}
                  </div>
                )}

                {showing.belief && (
                  <div className="beliefbox">
                    <span className="bl">Where the case stands</span>
                    <p>{showing.belief}</p>
                  </div>
                )}

                {nextBeatId ? (
                  <button className="nextbtn" type="button" onClick={() => selectLevel(nextBeatId)}>
                    {showing.openQuestion || 'Keep going'} <ArrowRight size={15} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
                  </button>
                ) : (
                  <button className="nextbtn" type="button" onClick={() => setTheoryModalOpen(true)}>
                    Write the theory of the case <ArrowRight size={15} style={{ verticalAlign: '-2px' }} aria-hidden="true" />
                  </button>
                )}
              </>
            )}

            {/* reveal text from the content files, kept as the formal exhibit */}
            {levelDetail.status === 'SOLVED' && levelDetail.reveal && (
              <details className="dossier">
                <summary>
                  <span style={{ minWidth: 0 }}>
                    <span className="dn">Exhibit record</span>
                    <span className="dr">The formal evidence note filed for this finding</span>
                  </span>
                </summary>
                <div className="sheet" style={{ margin: 13, borderRadius: 2 }}>
                  <MarkdownText text={levelDetail.reveal} />
                </div>
              </details>
            )}
          </div>
        </section>

        <CaseRail beats={beats} elapsed={elapsed} />
      </div>

      {person && <PersonSheet person={person} onClose={() => setOpenPerson(null)} />}
      <EvidenceUnlocked />
      <FinalTheoryModal />
      <ToastContainer />
    </div>
  );
};

export default CaseRoom;
