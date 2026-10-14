import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import initSqlJs, { Database } from 'sql.js';
import { Play, Database as DbIcon, History, AlertCircle, Table, Terminal, Monitor, HardDrive, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const SqlConsole: React.FC = () => {
  const { levelDetail, submitAnswer } = useGameStore();
  const isSolved = levelDetail?.status === 'SOLVED' || levelDetail?.status === 'SKIPPED';

  const [db, setDb] = useState<Database | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState<string>('SELECT * FROM access_log ORDER BY ts DESC LIMIT 20;');
  const [results, setResults] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  // Answer form
  const [deviceInput, setDeviceInput] = useState<string>('');
  const [patientInput, setPatientInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDatabase() {
      try {
        setLoadingDb(true);
        // Load WASM from local /vendor/sqljs/
        const SQL = await initSqlJs({
          locateFile: (file) => `/vendor/sqljs/${file}`
        });

        // Fetch level4.sqlite as ArrayBuffer
        const res = await fetch('/api/levels/4/assets/level4.sqlite', {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error(`Failed to load patient database: status ${res.status}`);
        }
        const buf = await res.arrayBuffer();

        if (mounted) {
          const sqliteDb = new SQL.Database(new Uint8Array(buf));
          setDb(sqliteDb);
          setLoadingDb(false);

          // Run initial sample query
          const initial = sqliteDb.exec('SELECT * FROM access_log ORDER BY ts DESC LIMIT 10;');
          if (initial.length > 0) {
            setResults(initial[0]);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setLoadError(err.message || 'Error initializing SQL engine');
          setLoadingDb(false);
        }
      }
    }

    loadDatabase();

    return () => {
      mounted = false;
      if (db) {
        try {
          db.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const runQuery = (sqlToRun?: string) => {
    const q = (sqlToRun !== undefined ? sqlToRun : query).trim();
    if (!db || !q) return;

    setQueryError(null);

    // Read-only check: permit SELECT / WITH queries while preventing data alteration statements
    const trimmedUpper = q.trim().toUpperCase();
    if (!trimmedUpper.startsWith('SELECT') && !trimmedUpper.startsWith('WITH') && !trimmedUpper.startsWith('EXPLAIN')) {
      setQueryError('SECURITY VIOLATION: Read-only investigation terminal. Only SELECT queries are permitted.');
      return;
    }

    if (/^\s*(DROP|ALTER|UPDATE|INSERT|DELETE|ATTACH|PRAGMA)\b/i.test(q)) {
      setQueryError('SECURITY VIOLATION: Read-only investigation terminal. Data alteration commands are prohibited.');
      return;
    }

    try {
      const res = db.exec(q);
      if (res.length > 0) {
        // Cap at 200 rows
        const cols = res[0].columns;
        const vals = res[0].values.slice(0, 200);
        setResults({ columns: cols, values: vals });
      } else {
        setResults({ columns: [], values: [] });
      }

      setHistory((prev) => [q, ...prev.filter((item) => item !== q)].slice(0, 8));
    } catch (err: any) {
      setQueryError(err.message || 'SQL execution error');
      setResults(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceInput.trim() || !patientInput.trim() || isSolved) return;

    setSubmitting(true);
    setSubmitError(null);

    const combined = `${deviceInput.trim()}-${patientInput.trim()}`;
    const res = await submitAnswer(combined);
    if (!res.correct) {
      setSubmitError(res.nudge || 'Values do not reconcile with the audit logs.');
    } else {
      setDeviceInput('');
      setPatientInput('');
    }
    setSubmitting(false);
  };

  if (loadingDb) {
    return (
      <div className="bg-[#171412] p-8 rounded-lg border-2 border-[#5c4631] text-center font-mono text-xs text-[#c9a777] space-y-3">
        <HardDrive className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
        <p className="tracking-widest uppercase">MOUNTING FORENSIC SQL DISK ARCHIVE...</p>
        <p className="text-[10px] text-zinc-500">Decoupling local SQLite WASM container // St. Jude's Clinical System</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-950/70 p-5 rounded-lg border-2 border-red-800 text-xs font-serif text-[#f4ece0] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-typewriter uppercase tracking-wider block text-red-400 mb-1">
            Database Archive Extraction Error
          </strong>
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Patient Database Jacket Header */}
      <div className="paper-sheet p-4 rounded-lg border-2 border-amber-900/40 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-typewriter font-bold text-xs sm:text-sm uppercase tracking-wider text-zinc-950">
              ST. JUDE'S PSYCHIATRIC CONSULTANCY // DR. ELIAS VANE PATIENT DATABASE
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-700">
            CONFIDENTIAL MEDICAL RECORDS ARCHIVE • SERVER BACKUP RECOVERED 2026-10-23
          </span>
        </div>
        <span className="stamp stamp-open text-[10px]">SUBPOENAED EVIDENCE</span>
      </div>

      {/* Schema Browser Cards styled as Archival Index Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
        <div
          onClick={() => {
            setQuery('SELECT * FROM patients LIMIT 20;');
            runQuery('SELECT * FROM patients LIMIT 20;');
          }}
          className="p-3 rounded-lg bg-[#241e19] hover:bg-[#2e2620] border border-[#5c4631] cursor-pointer transition-all shadow hover:border-amber-500/60 group"
        >
          <div className="font-typewriter font-bold text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-amber-500" />
              patients
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-amber-300">TABLE 01</span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate mt-1">patient_code, display_name, status</div>
        </div>

        <div
          onClick={() => {
            setQuery('SELECT * FROM records ORDER BY session_date DESC LIMIT 20;');
            runQuery('SELECT * FROM records ORDER BY session_date DESC LIMIT 20;');
          }}
          className="p-3 rounded-lg bg-[#241e19] hover:bg-[#2e2620] border border-[#5c4631] cursor-pointer transition-all shadow hover:border-amber-500/60 group"
        >
          <div className="font-typewriter font-bold text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-amber-500" />
              records
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-amber-300">TABLE 02</span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate mt-1">record_id, patient_code, notes_summary...</div>
        </div>

        <div
          onClick={() => {
            setQuery("SELECT * FROM access_log WHERE action = 'DELETE';");
            runQuery("SELECT * FROM access_log WHERE action = 'DELETE';");
          }}
          className="p-3 rounded-lg bg-[#241e19] hover:bg-[#2e2620] border border-[#5c4631] cursor-pointer transition-all shadow hover:border-amber-500/60 group"
        >
          <div className="font-typewriter font-bold text-amber-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-amber-500" />
              access_log
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-amber-300">TABLE 03</span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate mt-1">log_id, user_id, device, action, ts</div>
        </div>
      </div>

      {/* 1980s Terminal CRT Console Frame */}
      <div className="crt-terminal rounded-lg border-4 border-[#3a3024] shadow-[0_12px_35px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Terminal Header */}
        <div className="bg-[#12100d] px-4 py-2 border-b border-[#3a3024] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              VT-100 FORENSIC TERMINAL // SQL CONSOLE
            </span>
          </div>
          <span className="text-[11px] text-emerald-500/70 hidden sm:inline">Ctrl+Enter to Execute Query</span>
        </div>

        {/* Query Input Area */}
        <div className="relative p-3 bg-[#0a0f0a]">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none resize-y leading-relaxed tracking-wide placeholder-emerald-900"
            placeholder="SELECT * FROM access_log WHERE ..."
          />

          {/* Action Bar */}
          <div className="pt-2 border-t border-emerald-950/80 flex flex-wrap items-center justify-between gap-2">
            {/* History pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[65%]">
              <span className="text-[10px] font-mono text-emerald-700 uppercase">HISTORY:</span>
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(h);
                    runQuery(h);
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-950/60 text-[10px] font-mono text-emerald-400 hover:text-emerald-200 border border-emerald-800/40 whitespace-nowrap truncate max-w-[130px]"
                  title={h}
                >
                  {h}
                </button>
              ))}
            </div>

            <button
              onClick={() => runQuery()}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-black font-mono font-bold text-xs rounded transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.5)] active:translate-y-0.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>RUN QUERY</span>
            </button>
          </div>
        </div>

        {queryError && (
          <div className="p-3 bg-red-950/80 border-t border-red-800 text-xs text-red-300 font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{queryError}</span>
          </div>
        )}

        {/* Results Screen */}
        {results && (
          <div className="border-t-2 border-[#3a3024] bg-[#060a06] max-h-[440px] overflow-auto">
            {results.columns.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-600/80 font-mono">
                Command executed successfully. 0 rows returned in result set.
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-[#0f170f] text-emerald-400 sticky top-0 border-b border-emerald-900/60 z-10 shadow-sm">
                  <tr>
                    {results.columns.map((c, i) => (
                      <th key={i} className="py-2 px-3 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60 text-emerald-300/90">
                  {results.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-emerald-950/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-[11px]">
                          {cell === null ? (
                            <span className="text-zinc-600 italic">NULL</span>
                          ) : String(cell) === 'REDACTED' ? (
                            <span className="bg-red-950 text-red-400 border border-red-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              [REDACTED]
                            </span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Investigator Audit Reconciliation Form or Solved Banner */}
      {!isSolved ? (
        <form onSubmit={handleSubmit} className="p-4 bg-tape/90 rounded-lg border-2 border-signal/40 shadow-desk space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-signal/30 text-xs font-typewriter font-bold text-label">
            <ShieldAlert className="w-4 h-4 text-signal" />
            <span>INVESTIGATOR'S AUDIT RECONCILIATION DOSSIER</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-serif text-label font-medium mb-1">
                Q1: Device used to DELETE a record on the murder night (2026-10-23):
              </label>
              <input
                type="text"
                value={deviceInput}
                onChange={(e) => setDeviceInput(e.target.value)}
                placeholder="Device identifier"
                className="w-full bg-ink text-label font-mono px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none uppercase shadow-inner"
              />
            </div>

            <div>
              <label className="block font-serif text-label font-medium mb-1">
                Q2: REDACTED patient code edited by Elias in the week after Julian's death:
              </label>
              <input
                type="text"
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                placeholder="Patient code"
                className="w-full bg-ink text-label font-mono px-3.5 py-2 rounded border border-signal/40 focus:border-signal focus:outline-none uppercase shadow-inner"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] font-mono text-dim">
              COMBINED FORMAT: [DEVICE]-[PATIENT_CODE]: as the audit log spells them, joined by a hyphen
            </span>
            <button
              type="submit"
              disabled={submitting || !deviceInput.trim() || !patientInput.trim()}
              className="px-6 py-2 bg-signal hover:bg-signal/90 text-ink font-serif font-bold text-xs rounded transition-colors shadow disabled:opacity-50"
            >
              {submitting ? 'Auditing Database...' : 'Submit Audit Answer'}
            </button>
          </div>

          {submitError && (
            <div className="flex items-center gap-1.5 text-xs text-alarm font-serif mt-2 p-2 bg-red-950/60 rounded border border-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
        </form>
      ) : (
        <div className="p-5 bg-gradient-to-r from-[#172314] via-[#1f301b] to-[#172314] rounded-lg border-2 border-emerald-600/70 shadow-desk flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-typewriter text-sm text-emerald-200 font-bold block uppercase tracking-wider">
                SQL AUDIT RECONCILED // CASE #04 SOLVED
              </span>
              <span className="text-xs font-serif text-emerald-100/80">
                Audit trail reconciled. The deleting device and the redacted patient file are both now on record.
              </span>
            </div>
          </div>

          {/* advancement is owned by the case room */}
        </div>
      )}
    </div>
  );
};
