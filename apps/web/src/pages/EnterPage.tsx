import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useGameStore } from '../store/gameStore.js';
import { Fingerprint, KeyRound, Shield, AlertCircle, ArrowRight, Cpu, Check } from 'lucide-react';

/**
 * Sign-in, on the investigation board.
 *
 * Three states, in the order the room actually uses them:
 *
 *  SETUP    the machine has no kit bound yet. The organiser sets it once per
 *           batch, either here or by opening /enter?kit=3. It is remembered in
 *           this browser, so the next squad on this PC skips straight past.
 *  NAME     a squad walks up, types the name they want, and starts. No codes
 *           handed out in advance, no password to remember.
 *  CODE     their recovery code, shown once, so closing the tab does not cost
 *           them their run.
 *
 * A squad that already has a code can come back through RETURN at any point.
 */

const KIT_KEY = 'mm_machine_kit';
const MAX_KIT = 8;

type Mode = 'setup' | 'name' | 'return' | 'code';

export const EnterPage: React.FC = () => {
  const navigate = useNavigate();
  const { init } = useGameStore();
  const [params, setParams] = useSearchParams();

  const [kit, setKit] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('setup');
  const [kitInput, setKitInput] = useState('');
  const [teamName, setTeamName] = useState('');
  const [returnCode, setReturnCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ?kit=3 binds this machine and then cleans itself out of the URL, so the
  // squad never sees it and cannot change it by editing the address bar.
  useEffect(() => {
    const fromUrl = params.get('kit');
    if (fromUrl) {
      const n = parseInt(fromUrl, 10);
      if (Number.isInteger(n) && n >= 1 && n <= MAX_KIT) {
        localStorage.setItem(KIT_KEY, String(n));
      }
      params.delete('kit');
      setParams(params, { replace: true });
      return;
    }
    const stored = parseInt(localStorage.getItem(KIT_KEY) || '', 10);
    if (Number.isInteger(stored) && stored >= 1 && stored <= MAX_KIT) {
      setKit(stored);
      setMode('name');
    } else {
      setMode('setup');
    }
  }, [params, setParams]);

  const bindKit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(kitInput, 10);
    if (!Number.isInteger(n) || n < 1 || n > MAX_KIT) {
      setError(`Kit number must be between 1 and ${MAX_KIT}.`);
      return;
    }
    localStorage.setItem(KIT_KEY, String(n));
    setKit(n);
    setError(null);
    setMode('name');
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || kit === null) return;
    setError(null);
    if (!teamName.trim()) {
      setError('Your squad needs a name.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.register(teamName.trim(), kit);
      setRecovery(res.recoveryCode);
      setMode('code');
    } catch (err: any) {
      setError(err?.message || 'That did not go through. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const resume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await api.login(returnCode.trim().toUpperCase(), returnCode.trim().toUpperCase());
      await init();
      navigate('/case');
    } catch {
      setError('That recovery code was not recognised.');
      setBusy(false);
    }
  };

  const enterCase = async () => {
    setBusy(true);
    await init();
    navigate('/case');
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

          <div className="board-note board-note--one"><span>CHECK THE TIMELINE</span></div>
          <div className="board-note board-note--two"><span>RESTRICTED</span></div>

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
                <h1 className="case-brand-title">MURDER<br />MYSTERY</h1>
              </div>
            </div>
            <span className="case-confidential-stamp">CONFIDENTIAL</span>
          </header>

          <div className="case-meta">
            <span>CASE FILE: MUM/HOM/2026/2310</span>
            {kit !== null ? (
              <span className="case-status"><span className="status-dot" />KIT #{kit}</span>
            ) : (
              <span className="case-status"><span className="status-dot" />SEALED</span>
            )}
          </div>

          {/* ── the organiser sets this machine up, once per batch ──────── */}
          {mode === 'setup' && (
            <>
              <div className="case-card-intro">
                <p className="case-eyebrow">ORGANISER SETUP</p>
                <h2>Which kit is on this table?</h2>
                <p>
                  This machine has not been assigned yet. Enter the number printed
                  on the kit in front of this seat. It is remembered on this PC, so
                  you only do it once per batch.
                </p>
              </div>

              <div className="case-divider"><span /><Shield size={15} /><span /></div>

              <form className="case-login-form" onSubmit={bindKit}>
                <div className="case-field">
                  <label htmlFor="kitno">KIT NUMBER (1 TO {MAX_KIT})</label>
                  <div className="case-input-wrap">
                    <Cpu size={17} aria-hidden="true" />
                    <input
                      id="kitno"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={kitInput}
                      onChange={(e) => setKitInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="1"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="case-login-error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="case-open-button" disabled={!kitInput}>
                  <span>ASSIGN THIS MACHINE</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </form>
            </>
          )}

          {/* ── a squad arrives and names itself ────────────────────────── */}
          {mode === 'name' && (
            <>
              <div className="case-card-intro">
                <p className="case-eyebrow">23 OCTOBER 2026 &bull; RIDGE ROAD, MALABAR HILL</p>
                <h2>Name your squad</h2>
                <p>
                  Dr Elias Vane is dead and the file is still open. Pick a name,
                  and the case is yours.
                </p>
              </div>

              <div className="case-divider"><span /><Shield size={15} /><span /></div>

              <form className="case-login-form" onSubmit={register}>
                <div className="case-field">
                  <label htmlFor="squadcode">SQUAD NAME</label>
                  <div className="case-input-wrap">
                    <Fingerprint size={17} aria-hidden="true" />
                    <input
                      id="squadcode"
                      name="teamName"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={40}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Whatever you want to be called"
                      disabled={busy}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="case-login-error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="case-open-button" disabled={busy || !teamName.trim()}>
                  <span>{busy ? 'OPENING THE FILE…' : 'OPEN CASE FILE'}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>

                <p className="case-security-note">
                  <Shield size={12} aria-hidden="true" />
                  YOUR CLOCK STARTS WHEN THIS FILE OPENS, NOT WHEN THE ROOM DID
                </p>

                <button
                  type="button"
                  className="case-text-link"
                  onClick={() => { setError(null); setMode('return'); }}
                >
                  We already started and got logged out
                </button>
              </form>
            </>
          )}

          {/* ── back in after a crash, using the recovery code ──────────── */}
          {mode === 'return' && (
            <>
              <div className="case-card-intro">
                <p className="case-eyebrow">RESUME AN OPEN FILE</p>
                <h2>Welcome back</h2>
                <p>Enter the four-character recovery code you were given when you started.</p>
              </div>

              <div className="case-divider"><span /><Shield size={15} /><span /></div>

              <form className="case-login-form" onSubmit={resume}>
                <div className="case-field">
                  <label htmlFor="squadpass">RECOVERY CODE</label>
                  <div className="case-input-wrap">
                    <KeyRound size={17} aria-hidden="true" />
                    <input
                      id="squadpass"
                      name="code"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={4}
                      value={returnCode}
                      onChange={(e) => setReturnCode(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      disabled={busy}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="case-login-error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="case-open-button" disabled={busy || returnCode.length < 4}>
                  <span>{busy ? 'CHECKING…' : 'REOPEN OUR FILE'}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="case-text-link"
                  onClick={() => { setError(null); setMode('name'); }}
                >
                  Actually, we are new here
                </button>
              </form>
            </>
          )}

          {/* ── the code, shown once ────────────────────────────────────── */}
          {mode === 'code' && (
            <>
              <div className="case-card-intro">
                <p className="case-eyebrow">YOUR CLOCK IS RUNNING</p>
                <h2>Write this down</h2>
                <p>
                  If this tab closes or the browser crashes, this code gets you
                  back into <strong>your</strong> investigation with your time
                  intact. You will not be shown it again.
                </p>
              </div>

              <div className="recovery-code" aria-label="Recovery code">{recovery}</div>

              <div className="case-divider"><span /><Shield size={15} /><span /></div>

              <button type="button" className="case-open-button" onClick={enterCase} disabled={busy}>
                <span>{busy ? 'OPENING…' : 'GOT IT, OPEN THE CASE'}</span>
                <Check size={18} aria-hidden="true" />
              </button>
            </>
          )}

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

        <Link to="/hq" className="case-admin-link">Event organiser access</Link>
      </section>
    </main>
  );
};

export default EnterPage;
