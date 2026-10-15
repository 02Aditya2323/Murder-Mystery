/**
 * Registration flow check.
 *
 * Covers the way the room actually works: the organiser binds a kit number to
 * each machine once per batch, squads name themselves on arrival, and the kit
 * stays bound for the next squad on that PC.
 *
 *     npm start                   # in another terminal
 *     npm run verify-registration
 */
import { createRequire } from 'node:module';
const require = createRequire('E:/Personal or College Projects/MurderMystery2026/package.json');
const { chromium } = require('playwright-core');
const B = 'http://localhost:3000';
let fails = 0;
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fails++; };

const br = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await br.newContext({ viewport: { width: 1500, height: 950 } });
const p = await ctx.newPage();

// 1. a brand-new machine: no kit bound
await p.goto(B + '/enter', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
let body = await p.evaluate(() => document.body.innerText);
ok(/which kit is on this table/i.test(body), 'an unassigned machine asks the organiser for a kit');
ok(!!(await p.locator('#kitno').count()), 'the kit field is shown');

// 2. organiser binds kit 4
await p.fill('#kitno', '4');
await p.getByRole('button', { name: /assign this machine/i }).click();
await p.waitForTimeout(800);
body = await p.evaluate(() => document.body.innerText);
ok(/name your squad/i.test(body), 'it moves on to the squad name screen');
ok(/KIT #4/.test(body), 'the bound kit is shown on the card');

// 3. squad names itself
const name = 'Worli Night Desk ' + Math.random().toString(36).slice(2, 6);
await p.fill('#squadcode', name);
await p.getByRole('button', { name: /open case file/i }).click();
await p.waitForTimeout(1500);
body = await p.evaluate(() => document.body.innerText);
ok(/write this down/i.test(body), 'the recovery code screen appears');
const code = await p.locator('.recovery-code').textContent();
ok(!!code && code.trim().length === 4, `a four-character recovery code is shown (${code && code.trim()})`);

// 4. into the case
await p.getByRole('button', { name: /open the case/i }).click();
await p.waitForURL('**/case', { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(2200);
body = await p.evaluate(() => document.body.innerText);
ok(/The Stopped Clock/i.test(body), 'the case room opens on beat 1');
ok(body.includes(name), 'the squad sees its own chosen name');
ok(/Kit #4/i.test(body), 'and its kit number');

// 5. the machine remembers its kit for the NEXT squad
const p2 = await ctx.newPage();
await p2.goto(B + '/enter', { waitUntil: 'networkidle' });
await p2.waitForTimeout(900);
const body2 = await p2.evaluate(() => document.body.innerText);
ok(/name your squad/i.test(body2), 'the next squad on this PC skips setup');
ok(/KIT #4/.test(body2), 'and inherits the same kit');

// 6. a different machine is still unassigned
const ctx2 = await br.newContext({ viewport: { width: 1500, height: 950 } });
const p3 = await ctx2.newPage();
await p3.goto(B + '/enter', { waitUntil: 'networkidle' });
await p3.waitForTimeout(900);
ok(/which kit is on this table/i.test(await p3.evaluate(() => document.body.innerText)),
   'a different machine still needs its own setup');

await br.close();
console.log('');
console.log(fails === 0 ? 'REGISTRATION: ALL CHECKS PASSED' : `REGISTRATION: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
