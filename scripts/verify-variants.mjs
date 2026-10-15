/**
 * Per-kit variant check for beats 1, 4, 8 and 9.
 *
 * Eight squads sit in one room. For each kit this signs up a squad, plays to
 * each seeded beat, and asserts two things: the kit's own answer is accepted,
 * and another kit's answer for the same beat is refused. If the second half
 * ever passes, the seeding is decorative and neighbours can call answers out.
 *
 *     npm start              # in another terminal
 *     npm run verify-variants
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'answers.key.json'), 'utf8')).variants;
const KITS = Object.keys(V).map(Number).sort((a, b) => a - b);

const KIT8 = { 1: '001', 2: '110', 3: '101', 4: '100', 5: '011', 6: '010', 7: '110', 8: '101' };

let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

// Submissions are refused while the event is NOT_STARTED, which looks exactly
// like every answer being wrong. Start it first.
{
  const r = await fetch(BASE + '/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: process.env.ADMIN_PW || 'malabarhill2026' })
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  await fetch(BASE + '/api/admin/event/action', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ action: 'start' })
  });
}

function squad(kitNo) {
  let cookie = '';
  return async (p, body) => {
    const r = await fetch(BASE + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body)
    });
    const sc = r.headers.getSetCookie?.() || [];
    if (sc.length) cookie = sc.map((c) => c.split(';')[0]).join('; ');
    return r.json();
  };
}

// a value belonging to some other kit, for the same beat
const otherAnswer = (kit, field) => {
  const mine = field === 'beat8' ? KIT8[kit] : V[kit][field].answer;
  for (const k of KITS) {
    const v = field === 'beat8' ? KIT8[k] : V[k][field].answer;
    if (v !== mine) return v;
  }
  return null;
};

for (const kit of KITS) {
  console.log(`\n== KIT ${kit} ==`);
  const call = squad(kit);
  await call('/api/auth/register', {
    teamName: `Variant${kit}-${Math.random().toString(36).slice(2, 7)}`, kitNo: kit
  });

  const beats = [
    [1, 'beat1', V[kit].beat1.answer],
    [4, 'beat4', V[kit].beat4.answer],
    [8, 'beat8', KIT8[kit]],
    [9, 'beat9', V[kit].beat9.answer]
  ];

  // walk the case, stopping at each seeded beat to test it
  const path0 = [
    [1, 0, V[kit].beat1.answer],
    [2, 0, 'NOT ME JULIAN'],
    [3, 0, '1938MANNINGHAM'], [3, 1, '32-4417'],
    [4, 0, V[kit].beat4.answer],
    [5, 0, '3527'],
    [6, 0, 'MV-73,MV-18,MV-41,MV-66,MV-05,MV-29'],
    [7, 0, 'Diu'],
    [8, 0, KIT8[kit]],
    [9, 0, V[kit].beat9.answer]
  ];

  for (const [beat, field, mine] of beats) {
    // reach the beat
    for (const [l, st, a] of path0) {
      if (l > beat) break;
      if (l === beat && st === 0) break;
      await call(`/api/levels/${l}/submit`, { stage: st, answer: a });
    }
    const other = otherAnswer(kit, field);
    const bad = await call(`/api/levels/${beat}/submit`, { stage: 0, answer: other });
    const good = await call(`/api/levels/${beat}/submit`, { stage: 0, answer: mine });
    ok(good.correct === true, `beat ${beat}: own answer ${mine} accepted`);
    ok(bad.correct === false, `beat ${beat}: kit-other answer ${other} refused`);
  }
}

console.log('');
console.log(fails === 0
  ? 'VARIANTS: ALL CHECKS PASSED (beats 1, 4, 8, 9 are genuinely per kit)'
  : `VARIANTS: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
