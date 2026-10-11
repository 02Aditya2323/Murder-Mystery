import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await api.adminLogin(password.trim());
      navigate('/hq/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrator credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4 selection:bg-signal selection:text-ink">
      <div className="paper-sheet max-w-sm w-full p-6 sm:p-8 rounded shadow-desk border-2 border-alarm relative space-y-6 text-ink">
        <div className="flex items-center justify-between pb-3 border-b-2 border-alarm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-alarm" />
            <span className="font-typewriter text-xs font-bold tracking-widest text-alarm uppercase">
              RESTRICTED SECTOR // HQ
            </span>
          </div>
          <span className="stamp stamp-skipped text-xs">CLASSIFIED</span>
        </div>

        <div>
          <h1 className="font-typewriter text-xl font-bold uppercase text-ink">
            Emergency login
          </h1>
          <p className="font-serif text-xs text-ink/75 mt-1 leading-relaxed">
            Incident Headquarters Control Terminal. Authorized event organizers only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-typewriter font-bold text-ink mb-1">
              COMMAND AUTHORIZATION CODE:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-label/90 text-ink font-mono text-sm px-3.5 py-2 rounded border border-ink/40 focus:border-alarm focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-alarm/20 rounded border border-alarm/40 text-xs font-serif text-alarm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full py-2.5 bg-alarm hover:bg-alarm/90 text-label font-serif font-bold text-sm rounded shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>{submitting ? 'Verifying...' : 'Access Headquarters'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-ink/20">
          <span className="text-[11px] font-mono text-ink/60">
            Set ADMIN_PASSWORD before the event. Organisers only.
          </span>
        </div>
      </div>
    </div>
  );
};
