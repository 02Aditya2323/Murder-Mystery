import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function normalizeAnswer(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s\-_\{\}]/g, '')
    .replace(/\s+/g, ' ');
}

export function computeAnswerHash(normalizedAnswer, level, secret = 'MURDER_MYSTERY_1986_SECRET_KEY') {
  const salt = `LEVEL_${level}_SALT_1986`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${salt}:${normalizedAnswer}`);
  return hmac.digest('hex');
}

export function hashAllAnswers(secret = 'MURDER_MYSTERY_1986_SECRET_KEY') {
  const levelsDir = path.resolve('content/levels');
  const outDir = path.resolve('apps/server/data');
  fs.mkdirSync(outDir, { recursive: true });

  const result = {};

  const levelFolders = fs.readdirSync(levelsDir).filter(f => /^\d+$/.test(f)).sort();

  for (const folder of levelFolders) {
    const levelNum = parseInt(folder, 10);
    const answersPath = path.join(levelsDir, folder, 'answers.private.json');
    if (!fs.existsSync(answersPath)) {
      console.warn(`Warning: Missing ${answersPath}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
    result[levelNum] = {
      level: levelNum,
      isKitBased: !!data.isKitBased,
      stages: []
    };

    if (data.stages) {
      for (const st of data.stages) {
        const primaryNorm = normalizeAnswer(st.answer);
        const hashes = [computeAnswerHash(primaryNorm, levelNum, secret)];

        if (Array.isArray(st.alternates)) {
          for (const alt of st.alternates) {
            const altNorm = normalizeAnswer(alt);
            const h = computeAnswerHash(altNorm, levelNum, secret);
            if (!hashes.includes(h)) {
              hashes.push(h);
            }
          }
        }

        const stageEntry = {
          stage: st.stage,
          validHashes: hashes
        };

        if (st.nudges) {
          stageEntry.nudges = {};
          for (const [key, msg] of Object.entries(st.nudges)) {
            stageEntry.nudges[normalizeAnswer(key)] = msg;
          }
        }

        if (st.blanks) {
          stageEntry.blanks = st.blanks;
        }

        result[levelNum].stages.push(stageEntry);
      }
    }

    if (data.defaultKits) {
      result[levelNum].defaultKits = {};
      for (const [k, v] of Object.entries(data.defaultKits)) {
        result[levelNum].defaultKits[k] = computeAnswerHash(normalizeAnswer(v), levelNum, secret);
      }
    }
  }

  const outPath = path.join(outDir, 'answers.hashed.json');
  if (Object.keys(result).length === 0 && fs.existsSync(outPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
      if (Object.keys(existing).length > 0) {
        console.log(`Preserving existing hashed answers in ${outPath}`);
        return existing;
      }
    } catch {}
  }
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Hashed answers written to ${outPath}`);
  return result;
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  hashAllAnswers();
}

