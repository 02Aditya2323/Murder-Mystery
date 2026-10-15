import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useGameStore } from '../store/gameStore.js';
import { Fingerprint, KeyRound, Shield, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Sign-in, back on the investigation board.
 *
 * The board scene (pinned papers, exhibit photographs, red thread, the desk
 * lamp wash) was always in tokens.css; the redesign replaced the page that
 * used it with a bare centred card and left ~400 lines of stylesheet dead.
 * This puts the scene back in front of the form.
 *
 * The field ids stay `squadcode` and `squadpass` because verify-layout and the
 * UI drive-through drive this form by those ids.
 */
export const EnterPage: React.FC = () => {
  const navigate = useNavigate();
  const { init } = useGameStore();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!code.trim() || !password.trim()) {
      setError('Both the squad code and the passphrase are needed.');
      return;
    }

    setBusy(true);
    try {
      await api.login(code.trim(), password);
      await init();
      navigate('/case');
    } catch (err: any) {
      setError(err?.message || 'Those credentials were not accepted.');
      setBusy(false);
    }
  };

  return (
    <main className="case-login">
      {/* Decorative only: the room behind the form. */}
      <div className="investigation-scene" aria-hidden="true">
        <div className="scene-light scene-light--left" />
        <div className="scene-light scene-light--right" />

        <div className="investigation-board">
          <div className="board-paper board-paper--one">
            <span className="paper-heading">INCIDENT REPORT</span>
            <span className="paper-lines" />
            <span className="paper-lines paper-lines--short" />
            <span className="paper-lines" />
            <span className="paper-lines paper-lines--medium" />
          </div>

          <div className="board-paper board-paper--two">
            <span className="paper-heading">WITNESS STATEMENT</span>
            <span className="paper-lines" />
            <span className="paper-lines paper-lines--medium" />
            <span className="paper-lines" />
            <span className="paper-lines paper-lines--short" />
          </div>

          <div className="board-paper board-paper--three">
            <span className="paper-heading">ARCHIVE / 07</span>
            <span className="paper-lines" />
            <span className="paper-lines paper-lines--short" />
            <span className="paper-lines paper-lines--medium" />
          </div>

          <div className="board-photo board-photo--one">
            <div className="photo-silhouette" />
            <span>EXHIBIT A</span>
          </div>

          <div className="board-photo board-photo--two">
            <div className="photo-building" />
            <span>LOCATION RECORD</span>
          </div>

          <div className="board-note board-note--one">
            <span>CHECK THE TIMELINE</span>
          </div>

          <div className="board-note board-note--two">
            <span>RESTRICTED</span>
          </div>

          <span className="evidence-thread thread--one" />
          <span className="evidence-thread thread--two" />
          <span className="evidence-thread thread--three" />
          <span className="evidence-thread thread--four" />

          <span className="evidence-pin pin--one" />
          <span className="evidence-pin pin--two" />
          <span className="evidence-pin pin--three" />
          <span className="evidence-pin pin--four" />

          <div className="board-vignette" />
        </div>

        <div className="scene-desk" />
      </div>

      <section className="case-login-content">
        <div className="case-access-card">
          <span className="case-card-clip" aria-hidden="true" />
          <span className="case-card-pin" aria-hidden="true" />

          <header className="case-card-header">
            <div className="case-brand">
              <div className="case-brand-mark">
                <Fingerprint size={27} strokeWidth={1.5} />
              </div>
              <div>
                <p className="case-brand-overline">CONFIDENTIAL ARCHIVE</p>
                <h1 className="case-brand-title">
                  MURDER
                  <br />
                  MYSTERY
                </h1>
              </div>
            </div>
            <span className="case-confidential-stamp">CONFIDENTIAL</span>
          </header>

          <div className="case-meta">
            <span>CASE FILE: MUM/HOM/2026/2310</span>
            <span className="case-status">
              <span className="status-dot" />
              SEALED
            </span>
          </div>

          <div className="case-card-intro">
            <p className="case-eyebrow">23 OCTOBER 2026 &bull; RIDGE ROAD, MALABAR HILL</p>
            <h2>Case File Access</h2>
            <p>
              Dr Elias Vane is dead and the file is still open. Sign in with your
              squad credentials to take over the investigation.
            </p>
          </div>

          <div className="case-divider">
            <span />
            <Shield size={15} />
            <span />
          </div>

          <form className="case-login-form" onSubmit={onSubmit}>
            <div className="case-field">
              <label htmlFor="squadcode">INVESTIGATOR / SQUAD ID</label>
              <div className="case-input-wrap">
                <Fingerprint size={17} aria-hidden="true" />
                <input
                  id="squadcode"
                  name="code"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter assigned identifier"
                  disabled={busy}
                />
              </div>
            </div>

            <div className="case-field">
              <label htmlFor="squadpass">CONFIDENTIAL PASSCODE</label>
              <div className="case-input-wrap">
                <KeyRound size={17} aria-hidden="true" />
                <input
                  id="squadpass"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your passcode"
                  disabled={busy}
                />
              </div>
            </div>

            {error && (
              <div className="case-login-error" role="alert">
                <AlertCircle size={17} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="case-open-button"
              disabled={busy || !code.trim() || !password.trim()}
            >
              <span>{busy ? 'VERIFYING CLEARANCE…' : 'OPEN CASE FILE'}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <p className="case-security-note">
              <Shield size={12} aria-hidden="true" />
              YOUR CLOCK STARTS WHEN THIS FILE OPENS, NOT WHEN THE ROOM DID
            </p>
          </form>

          <footer className="case-card-footer">
            <span>MUMBAI POLICE &bull; CRIME BRANCH ARCHIVE</span>
            <span className="case-footer-seal">MM / 26</span>
          </footer>
        </div>

        <div className="case-scene-caption">
          <span className="caption-indicator" />
          <span>INVESTIGATION ROOM</span>
          <span className="caption-divider">/</span>
          <span>CASE STATUS: ACTIVE</span>
        </div>

        <Link to="/hq" className="case-admin-link">
          Event organiser access
        </Link>
      </section>
    </main>
  );
};

export default EnterPage;
