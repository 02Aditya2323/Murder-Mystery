import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGameStore } from '../store/gameStore.js';
import { Clock, Award, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

import { LogViewer } from './tools/LogViewer.js';
import { MorsePlayer } from './tools/MorsePlayer.js';
import { DocViewer } from './tools/DocViewer.js';
import { SqlConsole } from './tools/SqlConsole.js';
import { MatchBoard } from './tools/MatchBoard.js';
import { DiaryTable } from './tools/DiaryTable.js';
import { PhotoViewer } from './tools/PhotoViewer.js';
import { KitStation } from './tools/KitStation.js';
import { CodeFill } from './tools/CodeFill.js';
import { FlagForm } from './tools/FlagForm.js';

/**
 * Safe Markdown renderer for story / clue text.
 * react-markdown does NOT render raw HTML by default, so scripts or
 * arbitrary HTML inside story content cannot execute.
 * Page title is already an h2, so Markdown headings start at h3.
 * Soft line breaks are kept (whitespace-pre-line on p / li) so transcripts
 * keep one line per speaker turn.
 */
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="font-typewriter text-base md:text-lg font-bold text-ink mt-1 mb-3 pb-1 border-b border-ink/20">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h4 className="font-typewriter text-sm md:text-base font-bold text-ink mt-4 mb-2">
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h4 className="font-typewriter text-sm font-bold text-ink/90 mt-3 mb-1.5">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="font-typewriter text-xs md:text-sm font-bold text-ink/90 mt-3 mb-1">
      {children}
    </h5>
  ),
  p: ({ children }) => (
    <p className="whitespace-pre-line mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-ink">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3 border-l-4 border-signal/70 bg-ink/5 py-1.5 pr-2 italic text-ink/90">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="whitespace-pre-line pl-0.5">{children}</li>
  ),
  hr: () => <hr className="my-4 border-ink/20" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-signal hover:text-ink"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="font-mono text-[0.85em] bg-ink/10 px-1 py-0.5 rounded">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="font-mono text-xs bg-ink/10 border border-ink/15 rounded p-3 my-3 overflow-x-auto whitespace-pre [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs md:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-ink/10">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-ink/25 px-2 py-1 text-left font-typewriter font-bold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-ink/20 px-2 py-1 align-top">{children}</td>
  ),
};

export const MarkdownText: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
    {text}
  </ReactMarkdown>
);

export const LevelWorkspace: React.FC = () => {
  const { levelDetail, loadingLevel, selectLevel, setTheoryModalOpen } = useGameStore();

  if (loadingLevel || !levelDetail) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-dim font-serif italic desk-surface">
        <div className="bg-ink/80 p-6 rounded border border-signal/40 shadow-desk text-center space-y-2">
          <Shield
            className="w-6 h-6 text-signal mx-auto animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <p className="font-typewriter text-xs text-label">
            UNSEALING DOSSIER ARCHIVE...
          </p>
        </div>
      </div>
    );
  }

  const {
    id,
    title,
    status,
    estimatedMinutes,
    story,
    stages,
    currentStageIndex,
    reveal,
  } = levelDetail;

  const currentStage = stages?.[currentStageIndex] || stages?.[0];

  const renderTool = () => {
    switch (id) {
      case 1:
        return <LogViewer />;
      case 2:
        return <MorsePlayer />;
      case 3:
        return <DocViewer />;
      case 4:
        return <SqlConsole />;
      case 5:
        return <MatchBoard />;
      case 6:
        return <DiaryTable />;
      case 7:
        return <PhotoViewer />;
      case 8:
        return <KitStation />;
      case 9:
        return <CodeFill />;
      case 10:
        return <FlagForm />;
      default:
        return <div>Tool not found for Level {id}</div>;
    }
  };

  const isSolved = status === 'SOLVED';
  const nextLevel = id < 10 ? id + 1 : null;

  return (
    <main className="flex-1 p-3 md:p-6 overflow-y-auto space-y-6 desk-surface">
      {/* 0. PROMINENT LEVEL RESOLUTION & ADVANCEMENT BANNER (IF SOLVED) */}
      {isSolved && (
        <div className="bg-gradient-to-r from-[#172b1c] via-[#213f28] to-[#172b1c] p-4 sm:p-5 rounded border-2 border-ok shadow-desk flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-label animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ok/20 border-2 border-ok flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-ok" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-typewriter font-bold text-xs uppercase tracking-widest text-ok">
                  CASE FILE #{String(id).padStart(2, '0')} RESOLVED & VERIFIED
                </span>
                <span className="stamp stamp-closed text-[10px]">SOLVED</span>
              </div>
              <p className="font-serif text-xs text-dim mt-0.5">
                {nextLevel
                  ? `Case file solved! Case #${String(nextLevel).padStart(2, '0')} is ready for your team.`
                  : 'All 10 investigations completed! Formulate and submit your Final Investigation Theory.'}
              </p>
            </div>
          </div>

          {nextLevel ? (
            <button
              type="button"
              onClick={() => selectLevel(nextLevel)}
              className="px-6 py-2.5 bg-signal hover:bg-signal/90 text-ink font-typewriter font-bold text-xs sm:text-sm rounded shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:translate-y-0.5"
            >
              <span>PROCEED TO CASE #{String(nextLevel).padStart(2, '0')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTheoryModalOpen(true)}
              className="px-6 py-2.5 bg-alarm hover:bg-alarm/90 text-label font-typewriter font-bold text-xs sm:text-sm rounded shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 active:translate-y-0.5"
            >
              <Award className="w-4 h-4" />
              <span>SUBMIT FINAL THEORY</span>
            </button>
          )}
        </div>
      )}

      {/* 1. PHYSICAL MANILA DOSSIER JACKET */}
      <div className="manila-folder p-4 md:p-6 rounded-sm text-ink shadow-desk border-2 border-[#8E6C38] relative space-y-4">
        {/* Brass paperclip graphic on top-right */}
        <div className="paperclip" />

        {/* Dossier Header & Classification */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-ink/25">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-typewriter text-xs tracking-widest font-bold uppercase text-ink/75">
                MUMBAI POLICE SERVICE &bull; CASE FILE #
                {String(id).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-mono bg-ink/15 text-ink px-1.5 py-0.5 rounded">
                INCIDENT DATE: 23-OCT-2026
              </span>
            </div>
            <h2 className="font-typewriter text-xl md:text-2xl font-bold tracking-wide uppercase text-ink mt-0.5">
              {title}
            </h2>
          </div>

          {/* Rubber Status Stamps & Quick Advance */}
          <div className="flex items-center gap-2 flex-wrap">
            {isSolved && (
              <span className="stamp stamp-closed text-xs">SOLVED</span>
            )}
            {status === 'OPEN' && (
              <span className="stamp stamp-open text-xs">IN PROGRESS</span>
            )}

            <span className="text-[11px] font-mono text-ink/80 bg-ink/10 px-2.5 py-1 rounded border border-ink/20 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-signal" aria-hidden="true" />
              <span>Est: {estimatedMinutes} min</span>
            </span>

            {isSolved && nextLevel && (
              <button
                type="button"
                onClick={() => selectLevel(nextLevel)}
                className="px-3 py-1 bg-signal hover:bg-signal/90 text-ink font-typewriter font-bold text-[11px] rounded transition-all flex items-center gap-1 shadow"
              >
                <span>Next Case #{String(nextLevel).padStart(2, '0')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. CONFIDENTIAL CASE BRIEFING MEMO */}
        <div className="bg-[#EFE5CD] p-4 sm:p-5 rounded-sm border border-ink/20 shadow-sm relative space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-ink/15 text-[10px] font-mono text-ink/65 uppercase">
            <span>OFFICIAL BRIEFING &bull; DISPATCH MALABAR HILL</span>
            <span className="font-typewriter font-bold tracking-widest text-alarm">
              RESTRICTED INVESTIGATOR EYES ONLY
            </span>
          </div>

          <div className="font-serif text-xs md:text-sm text-ink leading-relaxed pt-1 max-w-4xl">
            <MarkdownText text={story} />
          </div>
        </div>

        {/* 3. MULTI-STAGE PROGRESS TRACKER (IF MULTI-STAGE) */}
        {stages && stages.length > 1 && (
          <div className="pt-2 flex items-center gap-2 text-xs font-typewriter flex-wrap">
            <span className="text-ink font-bold text-[11px]">
              DOSSIER PHASES:
            </span>
            {stages.map((st, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all motion-reduce:transition-none ${
                  i === currentStageIndex
                    ? 'bg-signal text-ink font-bold border border-ink shadow-sm'
                    : i < currentStageIndex
                    ? 'bg-ok/25 text-ok border border-ok/40 font-bold'
                    : 'bg-ink/10 text-ink/40'
                }`}
              >
                Phase {i + 1}: {st.name}
              </span>
            ))}
          </div>
        )}

        {/* 4. INVESTIGATOR DIRECTIVE & HANDWRITTEN POST-IT NOTE */}
        {currentStage && (
          <div className="bg-[#FAF2DA] p-3 rounded border-l-4 border-signal shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="font-typewriter text-[11px] font-bold text-signal uppercase tracking-wider block">
                PRIMARY INVESTIGATION DIRECTIVE:
              </span>
              <p className="font-serif text-xs text-ink/90 leading-relaxed italic">
                {currentStage.instruction}
              </p>
            </div>

            {/* Handwritten marginal note */}
            <div className="shrink-0 font-handwriting text-base text-alarm -rotate-1 self-end sm:self-center pr-1 select-none">
              Check all angles!
            </div>
          </div>
        )}
      </div>

      {/* 5. PRIMARY INVESTIGATION TOOL WORKSPACE */}
      <section aria-label="Investigation Workspace" className="relative">
        {renderTool()}
      </section>

      {/* 6. UNLOCKED EVIDENCE CLUE CARD (IF SOLVED) */}
      {isSolved && reveal && (
        <div className="polaroid-frame text-ink shadow-desk border-2 border-signal relative space-y-4 p-5 sm:p-6">
          <div className="thumbtack" />

          <div className="flex items-center justify-between pb-2 border-b-2 border-ink/20">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-signal" aria-hidden="true" />
              <span className="font-typewriter font-bold text-xs sm:text-sm tracking-wider uppercase text-ink">
                VERIFIED FORENSIC DISCOVERY // CASE #{String(id).padStart(2, '0')}
              </span>
            </div>
            <span className="stamp stamp-closed text-[10px]">
              ADDED TO DOSSIER
            </span>
          </div>

          <div className="font-serif text-xs sm:text-sm leading-relaxed text-ink/95 bg-[#f5ecdc] p-4 rounded border border-ink/15 max-w-4xl">
            <MarkdownText text={reveal} />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-ink/20">
            <div className="text-[10px] font-mono text-ink/60">
              EXHIBIT RECORD ID: CR-2026-{String(id).padStart(2, '0')} &bull; PERMANENT POLICE ARCHIVE
            </div>

            {nextLevel ? (
              <button
                type="button"
                onClick={() => selectLevel(nextLevel)}
                className="w-full sm:w-auto px-5 py-2 bg-signal hover:bg-signal/90 text-ink font-typewriter font-bold text-xs rounded shadow flex items-center justify-center gap-2 transition-all active:translate-y-0.5"
              >
                <span>Proceed to Case #{String(nextLevel).padStart(2, '0')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTheoryModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2 bg-alarm hover:bg-alarm/90 text-label font-typewriter font-bold text-xs rounded shadow flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Formulate Final Theory</span>
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};