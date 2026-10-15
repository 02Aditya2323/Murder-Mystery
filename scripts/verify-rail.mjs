/**
 * Collapsible case rail check.
 *
 *     npm start            # in another terminal
 *     npm run verify-rail
 */
import { createRequire } from 'node:module';
const require = createRequire('E:/Personal or College Projects/MurderMystery2026/package.json');
const { chromium } = require('playwright-core');
let fails = 0; const ok = (c,m)=>{console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c) fails++;};
const br = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await br.newContext({ viewport: { width: 1700, height: 950 } });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/enter?kit=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.fill('#squadcode', 'Rail ' + Math.random().toString(36).slice(2,7));
await p.click('button[type=submit]');
await p.waitForTimeout(1200);
await p.getByRole('button', { name: /open the case/i }).click().catch(()=>{});
await p.waitForURL('**/case', { timeout: 20000 }).catch(()=>{});
await p.waitForTimeout(2400);

const workW = () => p.evaluate(() => Math.round(document.querySelector('.room-work').getBoundingClientRect().width));
const railVisible = () => p.evaluate(() => !!document.querySelector('.rail'));

const wOpen = await workW();
ok(await railVisible(), 'the rail is shown by default');

await p.locator('.rail-collapse').click();
await p.waitForTimeout(600);
const wClosed = await workW();
ok(!(await railVisible()), 'clicking collapse hides the rail');
ok(wClosed > wOpen + 300, `the work pane takes the space back (${wOpen} -> ${wClosed})`);
ok(!!(await p.locator('.rail-reopen').count()), 'a reopen tab appears');

// survives a reload
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
ok(!(await railVisible()), 'it stays collapsed after a reload');

await p.locator('.rail-reopen').click();
await p.waitForTimeout(600);
ok(await railVisible(), 'the reopen tab brings it back');
ok(Math.abs((await workW()) - wOpen) < 8, 'and the work pane returns to its original width');

await br.close();
console.log('');
console.log(fails === 0 ? 'RAIL: ALL CHECKS PASSED' : `RAIL: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
