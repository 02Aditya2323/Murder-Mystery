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
const TEAM = { code: process.env.TEAM_CODE || 'COLABA', pass: process.env.TEAM_PASS || 'ridgeroad' };

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
  return { hOverflow: de.scrollWidth - de.clientWidth, scrollers };
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

  await ctx.close();
}

const signIn = async (page) => {
  await page.goto(BASE + '/enter', { waitUntil: 'networkidle' });
  await page.fill('#squadcode', TEAM.code);
  await page.fill('#squadpass', TEAM.pass);
  await page.click('button[type=submit]');
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
