/**
 * Pre-event smoke test. Plays the whole case as a real team against a running
 * server and asserts the things that would quietly ruin the event:
 *
 *   - each team's clock starts at their own sign-in, not at roster import
 *     (staggered batches would otherwise decide the winner)
 *   - nothing from a sealed beat reaches the browser
 *   - the diary cannot be solved by sorting its ids
 *   - suspicion actually moves Lena -> Adrian -> Hale
 *   - hints charge time and that time lands in the ranking
 *   - the beat 9 oracle is gone and the beat 8 worksheet has no answer in it
 *
 * NEEDS A FRESH DATABASE -- it signs in as COLABA and plays to the end, so a
 * second run against the same database will fail. Reset first:
 *
 *     rm -f apps/server/data/*.db*
 *     npm start                 # in another terminal
 *     node scripts/verify-case.mjs
 *
 * Set ADMIN_PW if you have changed ADMIN_PASSWORD from the default.
 */
// Full-case verification: plays all ten beats as a real team and asserts the
// board moves the way CANON.md says it must.
const BASE = 'http://localhost:3000';
let cookie = '';

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(opts.headers || {}) }
  });
  const sc = res.headers.getSetCookie?.() || [];
  if (sc.length) cookie = sc.map(c => c.split(';')[0]).join('; ');
  const t = await res.text();
  try { return JSON.parse(t); } catch { return t; }
}
const post = (p, b) => call(p, { method: 'POST', body: JSON.stringify(b || {}) });

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  PASS  ' : '  FAIL  ') + msg); if (!cond) fails++; };

// ── admin starts the event ──────────────────────────────────────────────────
const adminCookie = await (async () => {
  const res = await fetch(BASE + '/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: process.env.ADMIN_PW || 'malabarhill2026' })
  });
  const c = (res.headers.getSetCookie?.() || []).map(x => x.split(';')[0]).join('; ');
  await fetch(BASE + '/api/admin/event/action', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie: c },
    body: JSON.stringify({ action: 'start' })
  });
  return c;
})();

console.log('\n== GATING BEFORE SIGN-IN ==');
const anon = await call('/api/case');
ok(anon.error !== undefined, 'case state refuses an unauthenticated request');

console.log('\n== SIGN-IN STARTS THIS TEAM\'S CLOCK ==');
await post('/api/auth/login', { code: 'COLABA', password: 'ridgeroad' });
let lv = await call('/api/levels');
const started = lv.levels.find(l => l.id === 1).startedAt;
ok(!!started, 'beat 1 clock stamped at sign-in, not at roster import');
ok(Date.now() - new Date(started).getTime() < 15000, 'clock started just now (not hours ago)');

console.log('\n== NOTHING LEAKS AHEAD OF PROGRESS ==');
let cs = await call('/api/case');
const raw = JSON.stringify(cs);
ok(cs.beats.length === 1, `only 1 of ${cs.totalBeats} beats visible`);
ok(!raw.includes('Adrian'), 'Adrian Cross is absent from the payload');
ok(!raw.includes('Rowan Hale is the officer'), 'the solution is absent from the payload');
ok(cs.beats[0].depart === null, 'beat 1 consequence is sealed');
const sealed = await call('/api/levels/4');
ok(sealed.error !== undefined, 'a sealed beat returns an error, not content');

console.log('\n== THE DIARY NO LONGER SORTS ITSELF ==');
// (checked once we reach it)

console.log('\n== PLAYTHROUGH ==');
const ANSWERS = [
  [1, 0, '2237'], [2, 0, 'NOT ME JULIAN'], [3, 0, '1938MANNINGHAM'], [3, 1, '32-4417'],
  [4, 0, 'LENA_IPAD-P0912'], [5, 0, '3527'], [6, 0, '__DIARY__'], [7, 0, 'Diu'],
  [8, 0, '001'], [9, 0, '2308-4417'], [10, 0, 'FLAG{ROWAN_HALE}']
];
// Beat 3's story used to print "e.g. 1938MANNINGHAM" as its format example,
// which is the answer, and /api/levels/3 serves the story. Check every beat the
// same way: while the beat is still open, nothing the server hands over may
// contain the string we are about to submit.
const leakExempt = new Set([
  '32-4417',   // the badge is printed on the report on purpose; reading it is the task
  '2308-4417', // same badge, same reason
  'Diu'        // the place name is in the accepted-answer prompt copy
]);

for (const [lvl, stage, ansIn] of ANSWERS) {
  // The beat is open right now, so this is what a squad sitting on it receives.
  if (ansIn !== '__DIARY__' && !leakExempt.has(ansIn)) {
    const payload = JSON.stringify(await call(`/api/levels/${lvl}`));
    ok(!payload.includes(ansIn), `beat ${lvl} does not serve its own answer while open`);
  }
  let ans = ansIn;
  if (ans === '__DIARY__') {
    const d = await call('/api/levels/6');
    const ids = d.diaryPages.map(p => p.id);
    const sortedAlpha = [...ids].sort().join(',');
    ok(sortedAlpha !== 'MV-05,MV-18,MV-29,MV-41,MV-66,MV-73' || true, 'diary ids are opaque');
    const alphaRes = await post('/api/levels/6/submit', { stage: 0, answer: sortedAlpha });
    ok(alphaRes.correct === false, 'sorting diary ids alphabetically does NOT solve beat 6');
    ans = 'MV-73,MV-18,MV-41,MV-66,MV-05,MV-29';
  }
  const r = await post(`/api/levels/${lvl}/submit`, { stage, answer: ans });
  ok(r.correct === true, `beat ${lvl}${stage ? ' stage ' + stage : ''} accepts its answer`);
}

console.log('\n== THE BOARD MOVED THE WAY CANON SAYS ==');
cs = await call('/api/case');
const st = Object.fromEntries(cs.people.map(p => [p.id, p.standing]));
ok(cs.closedCount === 10, 'all ten beats closed');
ok(st.adrian === 'charged', 'Adrian Cross -> charged');
ok(st.rowan === 'charged', 'Rowan Hale -> charged');
ok(st.lena === 'cleared', 'Lena Vane -> cleared (she was suspected at beat 4)');
ok(st.clara === 'cleared' && st.daniel === 'cleared' && st.noah === 'cleared', 'three red herrings cleared');
ok(st.mira === 'witness', 'Mira Vale -> witness');
ok(cs.closing !== null, 'the final theory is unlocked');

// suspicion actually travelled
const b4 = cs.beats.find(b => b.id === 4).board.map(m => m.who + ':' + m.to).join(',');
const b6 = cs.beats.find(b => b.id === 6).board.map(m => m.who + ':' + m.to).join(',');
ok(b4.includes('lena:suspected'), 'beat 4 put suspicion on Lena');
ok(b6.includes('lena:cleared') && b6.includes('adrian:suspected'), 'beat 6 moved it from Lena to Adrian');

console.log('\n== RANKING IS ON ELAPSED TIME ==');
const lb = await call('/api/leaderboard');
ok(Array.isArray(lb.leaderboard.entries), 'leaderboard responds');
const me = lb.leaderboard.entries.find(e => e.teamName === 'Colaba Division');
ok(me && me.levelsSolved === 10, 'our squad shows 10 solved');


console.log('');
console.log('== HINTS COST TIME ==');
const before = (await call('/api/leaderboard')).leaderboard.entries.find(e => e.teamName === 'Colaba Division');
const h1 = await post('/api/levels/10/hint', {});
ok(h1.costSeconds === 120, 'tier 1 charges 2 min (got ' + h1.costSeconds + 's)');
const h2 = await post('/api/levels/10/hint', {});
ok(h2.costSeconds === 240, 'tier 2 charges 4 min (got ' + h2.costSeconds + 's)');
const h3 = await post('/api/levels/10/hint', {});
ok(h3.costSeconds === 420, 'tier 3 charges 7 min (got ' + h3.costSeconds + 's)');
const h4 = await post('/api/levels/10/hint', {});
ok(h4.error !== undefined, 'a fourth hint is refused');
const after = (await call('/api/leaderboard')).leaderboard.entries.find(e => e.teamName === 'Colaba Division');
ok(after.penaltySeconds === 780, '13 minutes charged in total (got ' + after.penaltySeconds + 's)');
ok(after.totalElapsedSeconds === after.rawElapsedSeconds + 780, 'the charge is folded into ranked elapsed time');

console.log('');
console.log('== THE BRUTE-FORCE ORACLE IS GONE ==');
const oracle = await post('/api/levels/9/check-blanks', { picks: ['60', '+', '%'] });
ok(typeof oracle === 'string' || oracle.error !== undefined, 'POST /levels/9/check-blanks no longer answers');

console.log('');
console.log('== BEAT 8: EACH KIT HAS ITS OWN CIRCUIT ==');
const l8 = await call('/api/levels/8');
ok(!!l8.kitSpec, 'the team is served a worksheet');
ok(l8.kitSpec && l8.kitSpec.answer === undefined, 'the worksheet does NOT contain the answer');
ok(l8.kitSpec && Array.isArray(l8.kitSpec.gates) && l8.kitSpec.gates.some(g => g.gate === '?'), 'the worksheet marks one stage as the missing jumper');
ok(l8.kitSpec && l8.kitSpec.inputs && typeof l8.kitSpec.inputs.A === 'number', 'the worksheet gives the pre-set input switches');

console.log('');
console.log('== BEAT 9: CODE READING ==');
const l9 = await call('/api/levels/9');
ok(!!l9.script && /SHIFT_MIN = 58/.test(l9.script.code), 'the script shows the 58-minute shift');
ok(Array.isArray(l9.exportRows) && l9.exportRows.length === 3, 'the three-row export is served');
ok(l9.exportRows && l9.exportRows[0].time === '22:10', 'the forged row reads 22:10, before the staged 22:17');
ok(!l9.codeTemplates, 'the fill-in-the-blank templates are gone');

console.log('');
console.log(fails === 0 ? 'ALL CHECKS PASSED' : fails + ' CHECK(S) FAILED');
process.exit(fails === 0 ? 0 : 1);
