/**
 * Organiser answer key, rendered to PDF.
 *
 * Reads content/answers.key.json, which is git-ignored, and prints through
 * the system Chrome. The PDF it writes is git-ignored too.
 *
 *     npm run answer-key-pdf
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(ROOT + '/package.json');
const { chromium } = require('playwright-core');

const key = JSON.parse(fs.readFileSync(ROOT + '/content/answers.key.json', 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const beatRows = key.beats.map((b) => `
  <tr>
    <td class="n">${b.beat}</td>
    <td class="t">${esc(b.title)}</td>
    <td class="a">${esc(b.answer)}</td>
    <td class="h">${esc(b.how)}</td>
  </tr>`).join('');

const kitCards = key.kits.map((k) => `
  <div class="kit">
    <div class="kh">
      <span class="kn">KIT ${k.kit_no}</span>
      <span class="ka">${esc(k.answer)}</span>
    </div>
    <table class="kmeta">
      <tr><th>Chips</th><td>${esc(k.ics)}</td></tr>
      <tr><th>Switches</th><td class="mono">${esc(k.inputs)} &nbsp;<em>taped down, do not move</em></td></tr>
      <tr><th>Jumper out</th><td class="mono">${esc(k.missingStage)}</td></tr>
    </table>
    <div class="wlabel">Full wiring</div>
    <pre class="wiring">${k.wiring.map(esc).join('\n')}</pre>
  </div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Answer Key</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Helvetica, Arial, sans-serif; color: #14181d; font-size: 10pt; margin: 0; }
  h1 { font-size: 19pt; margin: 0 0 2mm; letter-spacing: -0.2px; }
  .sub { color: #5b646f; font-size: 9pt; margin: 0 0 5mm; }
  .warn { border: 1.6pt solid #8C281E; background: #fdf2f1; color: #6d1f18;
          padding: 3.5mm 4mm; border-radius: 2mm; margin: 0 0 6mm; font-size: 9.5pt; }
  .warn b { display: block; font-size: 11pt; margin-bottom: 1mm; }
  h2 { font-size: 12.5pt; margin: 7mm 0 2.5mm; padding-bottom: 1.4mm;
       border-bottom: 1.2pt solid #14181d; }
  table.beats { width: 100%; border-collapse: collapse; font-size: 9pt; }
  table.beats th { background: #eef1f4; text-align: left; padding: 2mm; border: 0.6pt solid #c6ccd3; }
  table.beats td { padding: 2mm; border: 0.6pt solid #d7dce2; vertical-align: top; }
  td.n { width: 7mm; text-align: center; color: #5b646f; }
  td.t { width: 34mm; font-weight: 600; }
  td.a { width: 45mm; font-family: "Consolas", monospace; color: #0d5c2f; font-weight: 700; }
  td.h { color: #3d454e; }
  .kits { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .kit { border: 0.9pt solid #c6ccd3; border-radius: 2mm; padding: 3mm; break-inside: avoid; }
  .kh { display: flex; justify-content: space-between; align-items: baseline;
        border-bottom: 0.8pt solid #d7dce2; padding-bottom: 1.6mm; margin-bottom: 2mm; }
  .kn { font-weight: 700; font-size: 11pt; letter-spacing: 0.4px; }
  .ka { font-family: "Consolas", monospace; font-size: 16pt; font-weight: 700;
        color: #0d5c2f; letter-spacing: 2.5px; }
  table.kmeta { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 2mm; }
  table.kmeta th { text-align: left; width: 22mm; color: #5b646f; font-weight: 600;
                   padding: 0.8mm 0; vertical-align: top; }
  table.kmeta td { padding: 0.8mm 0; }
  .mono { font-family: "Consolas", monospace; }
  .mono em { font-family: "Segoe UI", sans-serif; color: #8C281E; font-style: normal; font-size: 8pt; }
  .wlabel { font-size: 7.5pt; text-transform: uppercase; letter-spacing: 1px;
            color: #5b646f; margin-bottom: 1mm; }
  pre.wiring { font-family: "Consolas", monospace; font-size: 7.8pt; line-height: 1.45;
               background: #f5f7f9; border: 0.6pt solid #e1e6ea; border-radius: 1.5mm;
               padding: 2mm; margin: 0; white-space: pre-wrap; }
  .note { font-size: 8.8pt; color: #3d454e; background: #f5f7f9;
          border-left: 2.2pt solid #8d969f; padding: 2.5mm 3mm; margin: 3mm 0 0; }
  .pagebreak { break-before: page; }
</style></head><body>

<h1>The Last Recording &mdash; Answer Key</h1>
<p class="sub">Murder Mystery 2026 &middot; E-CESA, Abhiyantriki &middot; one batch, eight kits &middot; generated ${new Date().toISOString().slice(0, 10)}</p>

<div class="warn">
  <b>Organisers only</b>
  Every answer in the case is on these pages. Do not leave this on a desk, a screen or a shared drive that a squad can reach.
</div>

<h2>The ten beats</h2>
<table class="beats">
  <thead><tr><th>#</th><th>Beat</th><th>Answer</th><th>How it is reached</th></tr></thead>
  <tbody>${beatRows}</tbody>
</table>

<div class="note">
  <strong>Beat 8 is per kit.</strong> Each squad is bound to one kit at sign-in, and the server
  only accepts that kit's reading. A code from another kit is rejected.
  <br><strong>Beat 10 runs outside the app:</strong> an E-CESA council member's public profile bio
  carries a base64 string &rarr; it decodes to a Drive image &rarr; the image is a QR &rarr; the QR
  opens an Instagram post &rarr; the flag is in the post. The Drive link must be set to
  &ldquo;anyone with the link can view&rdquo;.
</div>

<div class="pagebreak"></div>
<h2>Beat 8 &mdash; the eight kits</h2>
<p class="sub">Kits 1&ndash;4 are 7400 NAND + 7402 NOR. Kits 5&ndash;8 are 7400 NAND + 7404 inverter.
Every circuit uses both chips. Pin 14 to +5V and pin 7 to ground on each chip.
Three output LEDs, read left to right.</p>
<div class="kits">${kitCards}</div>

<div class="note" style="margin-top:5mm">
  Kits 2 and 7 both read <span class="mono">110</span>, and kits 3 and 8 both read
  <span class="mono">101</span>. These topologies only reach six patterns, so two repeats are
  unavoidable. Each pair uses different chips and different wiring, so nothing leaks between them.
  No kit reads <span class="mono">000</span>, which means all three LEDs dark always indicates an
  unfinished or unpowered board.
</div>

</body></html>`;

const out = path.join(ROOT, 'content', 'ANSWER_KEY.pdf');
const br = await chromium.launch({ channel: 'chrome', headless: true });
const p = await br.newPage();
await p.setContent(html, { waitUntil: 'load' });
await p.pdf({ path: out, format: 'A4', printBackground: true,
              margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
await br.close();
console.log('wrote ' + out + '  (' + Math.round(fs.statSync(out).size / 1024) + ' KB)');
