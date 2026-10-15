/**
 * Per-kit variants for beats 1, 4 and 9.
 *
 * Eight teams sit in one room. Beat 8 has always been per kit, but beats 1, 4
 * and 9 shipped one shared answer, so neighbours could simply call them out.
 * This builds eight of each:
 *
 *   beat 1  content/assets-private/level1_logs.k<N>.json   different panel
 *           skew and a different last human moment, so a different window
 *   beat 4  content/assets-private/level4.k<N>.sqlite      a different device
 *           ran the delete and a different patient file was scrubbed
 *   beat 9  parameters in content/variants.json            a different shift
 *           and a different forged lock time
 *
 * It also writes the per-kit answer hashes into the hashed answer file, so the
 * plaintext never reaches the server at runtime.
 *
 *     npm run gen-variants
 */
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRIV = path.join(ROOT, 'content', 'assets-private');
const SECRET = process.env.ANSWER_SECRET || 'MURDER_MYSTERY_1986_SECRET_KEY';

const norm = (s) =>
  String(s).trim().toUpperCase().replace(/[^A-Z0-9\s\-_{}]/g, '').replace(/\s+/g, ' ');
const hash = (value, salt) =>
  crypto.createHmac('sha256', SECRET).update(`${salt}:${norm(value)}`).digest('hex');

const pad = (n) => String(n).padStart(2, '0');
const hhmm = (mins) => `${pad(Math.floor(mins / 60) % 24)}${pad(mins % 60)}`;
const clock = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

// ── per-kit knobs ──────────────────────────────────────────────────────────
// Kit 1 keeps the original numbers so the existing smoke tests still read.
const KITS = [
  { kit: 1, skew: 6,  human: 21 * 60 + 52, device: 'LENA_IPAD',        patient: 'P-0912', shift: 58, forged: 22 * 60 + 10 },
  { kit: 2, skew: 4,  human: 21 * 60 + 44, device: 'CLINIC_TABLET_2',  patient: 'P-0471', shift: 46, forged: 22 * 60 + 25 },
  { kit: 3, skew: 7,  human: 22 * 60 + 3,  device: 'FRONT_DESK_PC',    patient: 'P-0338', shift: 63, forged: 21 * 60 + 58 },
  { kit: 4, skew: 5,  human: 21 * 60 + 38, device: 'VANE_LAPTOP',      patient: 'P-0725', shift: 39, forged: 22 * 60 + 41 },
  { kit: 5, skew: 9,  human: 22 * 60 + 11, device: 'ARCHIVE_TERMINAL', patient: 'P-0194', shift: 71, forged: 21 * 60 + 47 },
  { kit: 6, skew: 3,  human: 21 * 60 + 57, device: 'LENA_IPAD',        patient: 'P-0586', shift: 54, forged: 22 * 60 + 19 },
  { kit: 7, skew: 8,  human: 21 * 60 + 49, device: 'STUDY_LAPTOP',     patient: 'P-0263', shift: 44, forged: 22 * 60 + 33 },
  { kit: 8, skew: 11, human: 22 * 60 + 6,  device: 'RECEPTION_IPAD',   patient: 'P-0817', shift: 67, forged: 21 * 60 + 52 }
];

// ── beat 1: rebuild the log bundle around this kit's skew and human moment ──
const BASE_LOGS = JSON.parse(fs.readFileSync(path.join(PRIV, 'level1_logs.json'), 'utf8'));

function buildLogs({ skew, human }) {
  // The courier is the event two systems both see; it anchors the skew.
  const courier = human - 71;          // keeps the original spacing
  const rows = BASE_LOGS.map((r) => ({ ...r }));

  const setSec = (id, mins) => {
    const row = rows.find((r) => r.id === id);
    if (row) row.timestamp = `23-10 ${clock(mins + skew)}:${pad(id % 60)}`;
  };
  const setPlain = (id, mins) => {
    const row = rows.find((r) => r.id === id);
    if (row) row.timestamp = `2026-10-23 ${clock(mins)}:${pad(id % 60)}`;
  };

  // the two sightings of the same courier handoff
  setPlain(7, courier);
  setSec(8, courier);
  setSec(9, courier + 1);

  // the last human moment, seen by the panel and by the desktop three seconds apart
  setSec(16, human);
  const pc = rows.find((r) => r.id === 15);
  if (pc) {
    const utc = human - 330;           // IST is UTC+5:30
    pc.timestamp = `2026-10-23T${clock(utc)}:07Z`;
  }

  // every other panel row carries the same skew
  for (const r of rows) {
    if (r.source !== 'SEC' || [8, 9, 16].includes(r.id)) continue;
    const m = r.timestamp.match(/^23-10 (\d\d):(\d\d):(\d\d)$/);
    if (!m) continue;
    const base = Number(m[1]) * 60 + Number(m[2]);
    r.timestamp = `23-10 ${clock(base + skew - 6)}:${m[3]}`;   // base file is +6
  }
  return rows;
}

// ── beat 4: one database per kit ───────────────────────────────────────────
function buildSql({ kit, device, patient }) {
  const out = path.join(PRIV, `level4.k${kit}.sqlite`);
  for (const ext of ['', '-wal', '-shm']) if (fs.existsSync(out + ext)) fs.unlinkSync(out + ext);
  const db = new Database(out);
  db.exec(`
    CREATE TABLE patients (patient_code TEXT PRIMARY KEY, display_name TEXT, status TEXT);
    CREATE TABLE records (record_id TEXT PRIMARY KEY, patient_code TEXT, session_date TEXT,
                          recording_ref TEXT, notes TEXT, last_modified TEXT, modified_by TEXT);
    CREATE TABLE access_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, device TEXT,
                             action TEXT, target_record TEXT, ts TEXT);
  `);

  const P = db.prepare('INSERT INTO patients VALUES (?,?,?)');
  const decoys = ['P-0101', 'P-0229', 'P-0344', 'P-0498', 'P-0612', 'P-0773', 'P-0905'];
  P.run(patient, 'REDACTED', 'CONFIDENTIAL');
  decoys.filter((c) => c !== patient).forEach((c, i) =>
    P.run(c, ['M. Vale', 'D. Reed', 'C. Vane', 'N. Mercer', 'S. Kulkarni', 'T. Rao', 'A. Pillai'][i] || 'Patient', 'ACTIVE'));

  const R = db.prepare('INSERT INTO records VALUES (?,?,?,?,?,?,?)');
  R.run('R-0003', 'P-0101', '2026-10-02', 'REC-3', 'Session three', '2026-10-02 19:00:00', 'elias');
  // the scrubbed file: edited in the week after Julian died
  R.run('R-0009', patient, '2023-12-01', 'REC-9', 'Post-incident consultation; assessment altered',
        '2023-12-05 14:22:18', 'elias');
  // near misses: same month, wrong week
  R.run('R-0011', decoys[1], '2023-11-20', 'REC-11', 'Routine', '2023-11-28 10:05:00', 'elias');
  R.run('R-0012', decoys[2], '2023-12-18', 'REC-12', 'Routine', '2023-12-19 16:40:00', 'elias');

  const L = db.prepare('INSERT INTO access_log (user_id, device, action, target_record, ts) VALUES (?,?,?,?,?)');
  const noise = [
    ['elias', 'WORKSTATION_MAIN', 'VIEW',   'R-0003', '2026-10-23 19:12:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT',   'R-0011', '2026-10-23 20:41:00'],
    ['elias', 'STUDY_LAPTOP',     'DELETE', 'R-0099', '2024-03-10 18:04:00'],
    ['elias', 'WORKSTATION_MAIN', 'DELETE', 'R-0088', '2025-11-04 09:12:00'],
    ['elias', 'WORKSTATION_MAIN', 'EDIT',    'R-0009', '2023-12-05 14:22:18'],
    ['lena.v', device,            'VIEW',   'R-0003', '2026-10-23 23:51:40']
  ];
  noise.forEach((r) => L.run(...r));
  // the one delete on the night of the murder
  L.run('lena.v', device, 'DELETE', 'R-0003', '2026-10-23 23:52:11');
  db.close();
  return out;
}

// ── run ────────────────────────────────────────────────────────────────────
const variants = {};
const serving = {};
for (const k of KITS) {
  fs.writeFileSync(path.join(PRIV, `level1_logs.k${k.kit}.json`),
                   JSON.stringify(buildLogs(k), null, 2) + '\n');
  buildSql(k);

  // Split deliberately. serving[] is committed and holds only what the server
  // needs to RENDER the beat. answers[] is written to the git-ignored key file.
  // Putting the answers in a committed file would publish beats 1, 4 and 9 on
  // a public repository.
  serving[k.kit] = { beat9: { shift: k.shift, forgedTime: clock(k.forged) } };
  variants[k.kit] = {
    beat1: { answer: hhmm(k.human + 45), skew: k.skew, lastHuman: clock(k.human) },
    beat4: { answer: `${k.device}-${k.patient}`, device: k.device, patient: k.patient },
    beat9: {
      answer: `${hhmm(k.forged + k.shift)}-4417`,
      shift: k.shift,
      forgedTime: clock(k.forged),
      trueTime: clock(k.forged + k.shift)
    }
  };
}
// Only the serving data is committed. variants.json goes to a public repo, so
// it must carry what the server needs to RENDER beat 9 and nothing that says
// what any answer is.
fs.writeFileSync(path.join(ROOT, 'content', 'variants.json'),
                 JSON.stringify(serving, null, 2) + '\n');

// The answers go in the git-ignored key file, beside the rest of the key.
const keyPath = path.join(ROOT, 'content', 'answers.key.json');
const keyFile = fs.existsSync(keyPath)
  ? JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  : { beats: [], kits: [] };
keyFile.variants = variants;
fs.writeFileSync(keyPath, JSON.stringify(keyFile, null, 2) + '\n');

// ── fold the per-kit hashes into the hashed answer file ────────────────────
const hp = path.join(ROOT, 'apps', 'server', 'data', 'answers.hashed.json');
const hashed = JSON.parse(fs.readFileSync(hp, 'utf8'));
for (const [beat, field] of [[1, 'beat1'], [4, 'beat4'], [9, 'beat9']]) {
  const stage = hashed[beat]?.stages?.find((s) => s.stage === 0);
  if (!stage) { console.warn(`beat ${beat} stage 0 missing from the hash file`); continue; }
  stage.kitHashes = {};
  for (const k of KITS) {
    const a = variants[k.kit][field].answer;
    // The brief asks for "the patient code", and squads write it either as the
    // database spells it (P-0912) or run together (P0912). Accept both, which
    // also keeps kit 1 reading exactly as it did before there were variants.
    const forms = new Set([a, a.replace(/-P-(\d)/, '-P$1')]);
    stage.kitHashes[k.kit] = [...forms].map((f) => hash(f, `LEVEL_${beat}_SALT_1986`));
  }
}
fs.writeFileSync(hp, JSON.stringify(hashed, null, 2) + '\n');

console.log('kit  beat1   beat4                        beat9');
for (const k of KITS) {
  const v = variants[k.kit];
  console.log(`${String(k.kit).padEnd(4)} ${v.beat1.answer.padEnd(7)} ${v.beat4.answer.padEnd(28)} ${v.beat9.answer}`);
}
console.log('\nwrote 8 log bundles, 8 sqlite databases, content/variants.json and the per-kit hashes');
