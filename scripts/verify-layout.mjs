/**
 * Layout regression check.
 *
 * Catches the class of bug that produces "double scrollbars" and an
 * "infinite footer": an element that becomes its own scroll container when it
 * was never meant to be one. The usual cause is `overflow-x: hidden` on a tall
 * wrapper -- per spec, if one axis is not `visible` the other computes to
 * `auto`, so the wrapper silently starts scrolling vertically behind the page.
 *
 * Needs a running server and a headless Chrome (playwright-core + system
 * Chrome or Edge). Skips with a clear message if the driver is absent.
 *
 *     npm start                 # in another terminal
 *     npm run verify-layout
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  console.log('playwright-core is not installed; skipping the layout check.');
  console.log('  npm i -D playwright-core     (uses your system Chrome or Edge)');
  process.exit(0);
}

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Panels that are meant to scroll vertically: the pinned rail and the dossier
// overlay. Nothing else on the page may become a vertical scroll container.
const SCROLLS_DOWN = [/\brail-body\b/, /\bovl\b/, /\bovl-body\b/];

// Strips that are meant to scroll sideways only: the people board, a code block
// that must not wrap, the console output. These are NOT exempt from the
// vertical check -- a one-row strip that starts scrolling down is being
// squeezed by its parent and is clipping its own contents.
const SCROLLS_SIDEWAYS = [/\bboardstrip\b/, /^pre\b/, /\bcrt-terminal\b/];

let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

let browser;
for (const channel of ['chrome', 'msedge']) {
  try { browser = await chromium.launch({ channel, headless: true }); break; } catch { /* next */ }
}
if (!browser) {
  console.log('No system Chrome or Edge found; skipping the layout check.');
  process.exit(0);
}

const probe = (page) => page.evaluate(() => {
  const de = document.documentElement;
  const scrollers = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const v = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight - el.clientHeight > 4;
    const h = (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth - el.clientWidth > 4;
    if (!v && !h) return;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    scrollers.push({
      sel: el.tagName.toLowerCase() + (cls ? '.' + cls : ''),
      vertical: v ? el.scrollHeight - el.clientHeight : 0,
      horizontal: h ? el.scrollWidth - el.clientWidth : 0
    });
  });
  // Ragged right edge: blocks stacked in the same column that are much
  // narrower than their widest sibling leave a dead strip beside them. This is
  // how the brief shipped at 660px next to a 1080px tool, with 420px of void
  // between it and the rail, and the scroll checks said everything was fine.
  const ragged = [];
  const col = document.querySelector('.work-inner');
  if (col) {
    const kids = [...col.children].filter((el) => el.getBoundingClientRect().height > 30);
    const widest = Math.max(0, ...kids.map((el) => el.getBoundingClientRect().width));
    kids.forEach((el) => {
      const w = el.getBoundingClientRect().width;
      // .narr is an unboxed pull-quote and is meant to sit at a short measure.
      if (el.classList.contains('narr')) return;
      if (widest - w > widest * 0.15) {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
        ragged.push({ sel: el.tagName.toLowerCase() + (cls ? '.' + cls : ''), w: Math.round(w), widest: Math.round(widest) });
      }
    });
  }

  // A column that stops well short of the viewport shows bare page behind it.
  const rail = document.querySelector('.rail');
  const railShort = rail && window.innerWidth > 1100
    ? Math.round(Math.min(window.innerHeight - 64, document.body.scrollHeight) - rail.getBoundingClientRect().height)
    : 0;

  return { hOverflow: de.scrollWidth - de.clientWidth, scrollers, ragged, railShort };
});

async function check(label, viewport, navigate) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await navigate(page);
  await page.waitForTimeout(1400);
  const r = await probe(page);

  console.log(`\n${label}  (${viewport.width}x${viewport.height})`);
  ok(r.hOverflow <= 2, `no horizontal page scroll (${r.hOverflow}px)`);

  const rogue = r.scrollers.filter(
    (s) => s.vertical > 0 && !SCROLLS_DOWN.some((re) => re.test(s.sel))
  );
  ok(rogue.length === 0, `no unexpected vertical scroll container${rogue.length ? ':' : ''}`);
  rogue.forEach((s) => console.log(`          ${s.sel}  scrolls ${s.vertical}px vertically`));

  // A sideways strip that is also clipping vertically is being squeezed.
  const squeezed = r.scrollers.filter(
    (s) => s.vertical > 0 && SCROLLS_SIDEWAYS.some((re) => re.test(s.sel))
  );
  ok(squeezed.length === 0, `no sideways strip squeezed below its content${squeezed.length ? ':' : ''}`);
  squeezed.forEach((s) => console.log(`          ${s.sel}  clipped by ${s.vertical}px`));

  ok(r.ragged.length === 0, `no dead strip beside a short block${r.ragged.length ? ':' : ''}`);
  r.ragged.forEach((s) =>
    console.log(`          ${s.sel}  is ${s.w}px beside a ${s.widest}px sibling`));

  ok(r.railShort <= 40, `the rail fills its column (${r.railShort}px short)`);

  await ctx.close();
}

// Registration, the way the room does it: the organiser binds a kit to the
// machine with ?kit=N, then the squad names itself. Each run uses a fresh name
// because squad names are unique for the whole event.
const signIn = async (page) => {
  await page.goto(BASE + '/enter?kit=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#squadcode', 'Layout Check ' + Math.random().toString(36).slice(2, 8));
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);
  // the recovery code is shown once; acknowledge it to reach the case room
  await page.getByRole('button', { name: /open the case/i }).click().catch(() => {});
  await page.waitForURL('**/case', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1800);
};

const WIDTHS = [
  ['phone  ', { width: 390, height: 844 }],
  ['laptop ', { width: 1366, height: 768 }],
  ['wide   ', { width: 2560, height: 1300 }]
];

for (const [name, vp] of WIDTHS) {
  await check(`LANDING ${name}`, vp, (p) => p.goto(BASE + '/', { waitUntil: 'networkidle' }));
}
for (const [name, vp] of WIDTHS) {
  await check(`SIGN-IN ${name}`, vp, (p) => p.goto(BASE + '/enter', { waitUntil: 'networkidle' }));
}
for (const [name, vp] of WIDTHS) {
  await check(`CASE ROOM ${name}`, vp, signIn);
}

await browser.close();
console.log('');
console.log(fails === 0 ? 'LAYOUT: ALL CHECKS PASSED' : `LAYOUT: ${fails} CHECK(S) FAILED`);
process.exit(fails === 0 ? 0 : 1);
