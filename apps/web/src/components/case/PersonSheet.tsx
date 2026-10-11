import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Field { k: string; v: string; at: number }
export interface Person {
  id: string;
  name: string;
  age: number;
  role: string;
  portraitKey: string;
  summary: string;
  standing: string;
  standingLabel: string;
  standingTone: string;
  standingWhy: string;
  fields: Field[];
}

export const PersonSheet: React.FC<{ person: Person; onClose: () => void }> = ({ person, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ovl" onClick={onClose} role="presentation">
      <div
        className="ovl-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier: ${person.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ovl-head">
          <h2>{person.name}</h2>
          <button className="xbtn" type="button" onClick={onClose} aria-label="Close dossier">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ovl-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span className="dface" style={{ width: 62, height: 76, fontSize: 18 }} aria-hidden="true">
              {person.portraitKey}
            </span>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span className={`badge tone-${person.standingTone}`} style={{
                alignSelf: 'flex-start',
                fontFamily: "'Special Elite', monospace",
                fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
                padding: '4px 9px', borderRadius: 2, border: '1px solid currentColor'
              }}>
                {person.standingLabel}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--dim)' }}>
                {person.age} · {person.role}
              </span>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#CDC8BC', maxWidth: '62ch' }}>
                {person.summary}
              </p>
            </div>
          </div>

          {person.standingWhy && (
            <div className="beliefbox">
              <span className="bl">Why they stand here</span>
              <p>{person.standingWhy}</p>
            </div>
          )}

          {person.fields.length > 0 ? (
            <div className="sheet">
              <div className="stamphead">
                <span>Investigator file</span>
                <span>{person.fields.length} entries</span>
              </div>
              <dl style={{
                margin: 0, display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '11px 16px'
              }}>
                {person.fields.map((f, i) => (
                  <React.Fragment key={i}>
                    <dt style={{
                      fontFamily: "'Special Elite', monospace", fontSize: 10,
                      letterSpacing: '.13em', textTransform: 'uppercase',
                      color: 'var(--paper-ink-soft)', paddingTop: 3, whiteSpace: 'nowrap'
                    }}>
                      {f.k}
                    </dt>
                    <dd style={{ margin: 0, fontSize: '.98rem', lineHeight: 1.6, minWidth: 0 }}>
                      {f.v}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--dim)', fontSize: '.95rem' }}>
              Nothing on file yet. This person has been named but the investigation has
              not turned up anything about them.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
