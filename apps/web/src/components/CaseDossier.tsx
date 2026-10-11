import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  FolderClosed,
  LockKeyhole,
  NotebookPen,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore.js';
import { MarkdownText } from './LevelWorkspace.js';

type DossierPage =
  | 'overview'
  | 'characters'
  | 'terms'
  | 'timeline'
  | 'documents'
  | 'evidence'
  | 'notes';

const pages: { id: DossierPage; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'characters', label: 'Characters So Far in Story', icon: Users },
  { id: 'terms', label: 'Terms', icon: Tags },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'evidence', label: 'Evidence', icon: FolderClosed },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
];

interface CaseDossierProps {
  onClose: () => void;
}

export const CaseDossier: React.FC<CaseDossierProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePage, setActivePage] = useState<DossierPage>('overview');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const {
    team,
    levelDetail,
    levels,
    evidenceBoard,
    characters,
    terms,
    timeline,
    notebookText,
    setNotebookText,
    saveNotebook,
  } = useGameStore();

  // Escape: close the evidence detail first, then the dossier itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedLevel !== null) {
        setSelectedLevel(null);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedLevel, onClose]);

  const discoveredLevels = levels.filter(
    (level) => level.status === 'SOLVED' || level.status === 'SKIPPED'
  );

  // Only show characters that are not redacted, so undiscovered
  // characters are never listed (not even by name).
  const visibleCharacters = characters.filter((c) => !c.redacted);

  const openEvidence = (level: number) => {
    setActivePage('evidence');
    setSelectedLevel(level);
  };

  const changePage = (page: DossierPage) => {
    setSelectedLevel(null);
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return (
          <>
            <p className="dossier-kicker">METROPOLITAN SPECIAL INVESTIGATIONS</p>
            <h2 className="dossier-page-title">Case Overview</h2>
            <div className="dossier-rule" />
            <p className="dossier-body">
              This file contains the information collected during your
              investigation. Review verified discoveries and your own notes as
              the case develops.
            </p>
            <div className="dossier-facts">
              <div>
                <span>INVESTIGATING UNIT</span>
                <strong>{team?.name || 'Assigned investigation team'}</strong>
              </div>
              <div>
                <span>CURRENT INCIDENT</span>
                <strong>23 October 2026</strong>
              </div>
              <div>
                <span>ACTIVE FILE</span>
                <strong>{levelDetail?.title || 'Investigation pending'}</strong>
              </div>
              <div>
                <span>VERIFIED DISCOVERIES</span>
                <strong>{evidenceBoard.length} evidence file(s)</strong>
              </div>
            </div>
            <p className="dossier-handwritten">
              Keep your observations separate from verified evidence.
            </p>
          </>
        );

      case 'characters':
        return (
          <>
            <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
              <div>
                <p className="dossier-kicker">LEVEL-BY-LEVEL UNLOCKED PROFILES</p>
                <h2 className="dossier-page-title">Characters So Far in Story</h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-ok/15 text-ok border border-ok/30 font-bold">
                {visibleCharacters.length} PROFILES UNLOCKED
              </span>
            </div>
            <div className="dossier-rule" />

            <p className="dossier-body">
              Persons of interest, suspects, and witnesses discovered through your squad's progress. As each case file is solved, new character profiles and verified facts are unlocked into this archive.
            </p>

            {visibleCharacters.length === 0 ? (
              <div className="dossier-empty">
                <LockKeyhole size={20} />
                <p>
                  No character files have been opened yet. They appear here as
                  the investigation progresses.
                </p>
              </div>
            ) : (
              <div className="dossier-character-list">
                {visibleCharacters.map((character) => (
                  <article className="dossier-document" key={character.id}>
                    <Users size={21} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3>{character.name}</h3>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-ok/15 text-ok border border-ok/30 font-bold uppercase">
                          UNLOCKED
                        </span>
                      </div>
                      <p>{character.role}</p>

                      <p>
                        <strong>Status:</strong> {character.status}
                      </p>
                      <p>
                        <strong>Classification:</strong>{' '}
                        {character.classification}
                      </p>

                      {character.knownFacts?.length > 0 && (
                        <div className="mt-2">
                          <strong>Known facts</strong>
                          <ul className="list-disc pl-5">
                            {character.knownFacts.map((fact, index) => (
                              <li key={index}>{fact}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {character.timeline?.length > 0 && (
                        <div className="mt-2">
                          <strong>Timeline</strong>
                          <ul className="list-disc pl-5">
                            {character.timeline.map((event, index) => (
                              <li key={index}>{event}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {character.linkedEvidence?.length > 0 && (
                        <div className="mt-2">
                          <strong>Linked evidence</strong>
                          <ul className="list-disc pl-5">
                            {character.linkedEvidence.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        );

      case 'terms': {
        const levelTitle = (id: number) =>
          levels.find((l) => l.id === id)?.title ?? `Case ${id}`;
        return (
          <>
            <p className="dossier-kicker">CASE VOCABULARY</p>
            <h2 className="dossier-page-title">Important Terms</h2>
            <div className="dossier-rule" />
            <p className="dossier-body">
              Codes, devices, accounts and places you have uncovered so far.
            </p>
            {terms.length === 0 ? (
              <div className="dossier-empty">
                <LockKeyhole size={20} />
                <p>
                  No terms recorded yet. They are added as you complete
                  investigations.
                </p>
              </div>
            ) : (
              <dl className="dossier-character-list">
                {terms.map((t) => (
                  <article className="dossier-document" key={t.id}>
                    <Tags size={21} />
                    <div>
                      <dt>
                        <strong className="font-mono">{t.term}</strong>{' '}
                        <span className="dossier-muted">({t.category})</span>
                      </dt>
                      <dd>
                        <p>{t.description}</p>
                        <button
                          type="button"
                          className="dossier-muted underline"
                          onClick={() => openEvidence(t.level)}
                        >
                          Found in: {levelTitle(t.level)}
                        </button>
                      </dd>
                    </div>
                  </article>
                ))}
              </dl>
            )}
          </>
        );
      }

      case 'timeline':
        return (
          <>
            <p className="dossier-kicker">CHRONOLOGICAL RECORD</p>
            <h2 className="dossier-page-title">Timeline</h2>
            <div className="dossier-rule" />
            <p className="dossier-body">
              Events established by the evidence you have unlocked, in time order.
            </p>
            <div className="dossier-timeline">
              {timeline.length === 0 ? (
                <p className="dossier-muted">No discoveries recorded yet.</p>
              ) : (
                timeline.map((event) => (
                  <article className="dossier-timeline-entry" key={event.id}>
                    <span className="dossier-timeline-dot" />
                    <div>
                      <span className="dossier-timeline-date">{event.when}</span>
                      <p>{event.text}</p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        );

      case 'documents':
        return (
          <>
            <p className="dossier-kicker">ARCHIVE INDEX</p>
            <h2 className="dossier-page-title">Documents</h2>
            <div className="dossier-rule" />
            {discoveredLevels.length === 0 ? (
              <p className="dossier-muted">
                Documents will be indexed as investigations are completed.
              </p>
            ) : (
              <div className="dossier-document-list">
                {discoveredLevels.map((level) => {
                  const hasEvidence = evidenceBoard.some(
                    (c) => c.level === level.id
                  );
                  return (
                    <button
                      type="button"
                      className="dossier-document w-full text-left cursor-pointer disabled:cursor-default"
                      key={level.id}
                      disabled={!hasEvidence}
                      onClick={() => openEvidence(level.id)}
                      aria-label={`Open file for ${level.title}`}
                    >
                      <FileText size={21} />
                      <div>
                        <h3>{level.title}</h3>
                        <p>
                          Investigation file · Case{' '}
                          {String(level.id).padStart(2, '0')}
                        </p>
                      </div>
                      <span>FILED</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        );

      case 'evidence': {
        const selected =
          selectedLevel !== null
            ? evidenceBoard.find((c) => c.level === selectedLevel)
            : undefined;

        if (selected) {
          const num = String(selected.level).padStart(2, '0');
          return (
            <>
              <p className="dossier-kicker">EXHIBIT {num}</p>
              <h2 className="dossier-page-title">{selected.title}</h2>
              <div className="dossier-rule" />
              <div className="dossier-facts">
                <div>
                  <span>EVIDENCE TYPE</span>
                  <strong>Forensic discovery</strong>
                </div>
                <div>
                  <span>EVIDENCE ID</span>
                  <strong>CR-2026-{num}</strong>
                </div>
                <div>
                  <span>DISCOVERED IN</span>
                  <strong>Case file #{num}</strong>
                </div>
              </div>
              <div className="dossier-body max-w-none mt-3">
                <MarkdownText text={selected.text} />
              </div>
              <button
                type="button"
                className="dossier-save-button"
                onClick={() => setSelectedLevel(null)}
              >
                <ArrowLeft size={16} />
                Back to evidence index
              </button>
            </>
          );
        }

        return (
          <>
            <p className="dossier-kicker">VERIFIED MATERIAL</p>
            <h2 className="dossier-page-title">Evidence Index</h2>
            <div className="dossier-rule" />
            {evidenceBoard.length === 0 ? (
              <p className="dossier-muted">
                No evidence has been unlocked yet. Complete an investigation to
                add its revealed clue here.
              </p>
            ) : (
              <div className="dossier-evidence-list">
                {evidenceBoard.map((card) => (
                  <button
                    type="button"
                    className="dossier-evidence-item w-full text-left cursor-pointer"
                    key={card.level}
                    onClick={() => setSelectedLevel(card.level)}
                    aria-label={`Open exhibit ${card.level}: ${card.title}`}
                  >
                    <span className="dossier-exhibit">
                      EXHIBIT {String(card.level).padStart(2, '0')}
                    </span>
                    <h3>{card.title}</h3>
                    <p>Click to read this exhibit.</p>
                  </button>
                ))}
              </div>
            )}
          </>
        );
      }

      case 'notes':
        return (
          <>
            <p className="dossier-kicker">PRIVATE INVESTIGATOR NOTES</p>
            <h2 className="dossier-page-title">Working Notes</h2>
            <div className="dossier-rule" />
            <p className="dossier-body">
              Record your own observations and theories. Notes are not treated
              as verified evidence.
            </p>
            <textarea
              className="dossier-notes-input"
              value={notebookText}
              onChange={(event) => setNotebookText(event.target.value)}
              placeholder="Record your observations..."
              aria-label="Investigation notes"
            />
            <button
              type="button"
              className="dossier-save-button"
              onClick={() => void saveNotebook()}
            >
              <NotebookPen size={16} />
              Save notes
            </button>
          </>
        );
    }
  };

  if (!isOpen) {
    return (
      <div
        className="dossier-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Case dossier"
      >
        <button
          type="button"
          className="dossier-close"
          onClick={onClose}
          aria-label="Close dossier"
        >
          <X size={21} />
        </button>

        <button
          type="button"
          className="dossier-cover"
          onClick={() => setIsOpen(true)}
          aria-label="Open the case dossier"
          autoFocus
        >
          <span className="dossier-cover-clip" />
          <span className="dossier-cover-top">METROPOLITAN POLICE SERVICE</span>
          <span className="dossier-cover-title">
            CASE
            <br />
            DOSSIER
          </span>
          <span className="dossier-cover-rule" />
          <span className="dossier-cover-field">
            INCIDENT DATE: 23 OCTOBER 2026
          </span>
          <span className="dossier-cover-field">
            INVESTIGATOR: {team?.name || 'AUTHORIZED PERSONNEL'}
          </span>
          <span className="dossier-cover-stamp">CONFIDENTIAL</span>
          <span className="dossier-cover-bottom">CLICK TO OPEN FILE</span>
        </button>

        <p className="dossier-scene-caption">
          EVIDENCE ARCHIVE · RESTRICTED ACCESS
        </p>
      </div>
    );
  }

  const currentIndex = pages.findIndex((page) => page.id === activePage);

  return (
    <div
      className="dossier-overlay dossier-overlay-open"
      role="dialog"
      aria-modal="true"
      aria-label="Open case dossier"
    >
      <div className="dossier-open-shell">
        <header className="dossier-open-header">
          <div>
            <span className="dossier-kicker">CONFIDENTIAL CASE FILE</span>
            <h2>Investigation Dossier</h2>
          </div>
          <button
            type="button"
            className="dossier-close-inline"
            onClick={onClose}
            aria-label="Close dossier"
          >
            <X size={21} />
          </button>
        </header>

        <div className="dossier-book">
          <nav className="dossier-tabs" aria-label="Dossier sections">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <button
                  type="button"
                  key={page.id}
                  className={`dossier-tab ${
                    activePage === page.id ? 'active' : ''
                  }`}
                  onClick={() => changePage(page.id)}
                  aria-current={activePage === page.id ? 'page' : undefined}
                >
                  <Icon size={16} />
                  <span>{page.label}</span>
                </button>
              );
            })}
          </nav>

          <article className="dossier-paper" key={`${activePage}-${selectedLevel}`}>
            <span className="dossier-paper-clip" />
            {renderPage()}
            <footer className="dossier-page-footer">
              <span>METROPOLITAN SPECIAL INVESTIGATIONS</span>
              <span>
                PAGE {currentIndex + 1} / {pages.length}
              </span>
            </footer>
          </article>
        </div>

        <footer className="dossier-book-controls">
          <button
            type="button"
            onClick={() =>
              changePage(pages[Math.max(0, currentIndex - 1)].id)
            }
            disabled={currentIndex === 0}
          >
            <ArrowLeft size={16} /> Previous page
          </button>
          <span>HANDLE WITH CARE · OFFICIAL RECORD</span>
          <button
            type="button"
            onClick={() =>
              changePage(pages[Math.min(pages.length - 1, currentIndex + 1)].id)
            }
            disabled={currentIndex === pages.length - 1}
          >
            Next page <ArrowRight size={16} />
          </button>
        </footer>
      </div>
    </div>
  );
};