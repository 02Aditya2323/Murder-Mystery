import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useGameStore } from '../store/gameStore.js';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

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
    <div className="gate night grain">
      <div className="gate-card">
        <header>
          <span className="eyebrow">Mumbai Police · Crime Branch</span>
          <h1>Investigator sign-in</h1>
          <p>Case MUM/HOM/2026/2310 (Vane, E.)</p>
        </header>

        <form className="gate-body" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="squadcode">Squad code</label>
            <input
              id="squadcode"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BAKER"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label htmlFor="squadpass">Passphrase</label>
            <input
              id="squadpass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="off"
            />
          </div>

          {error && <div className="gate-err">{error}</div>}

          <button className="btn btn-lg" type="submit" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? 'Opening the file…' : <>Begin the investigation <ArrowRight size={16} aria-hidden="true" /></>}
          </button>

          <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--dim)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <ShieldCheck size={15} style={{ flex: '0 0 auto', marginTop: 2 }} aria-hidden="true" />
            <span>Your three hours begin the moment this form is accepted, not when the room started.</span>
          </p>

          <Link
            to="/"
            style={{ color: 'var(--dim)', fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </Link>
        </form>
      </div>
    </div>
  );
};

export default EnterPage;
