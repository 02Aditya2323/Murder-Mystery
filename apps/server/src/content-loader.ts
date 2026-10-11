import fs from 'node:fs';
import path from 'node:path';
import { loadCharactersConfig, loadEventConfig, rootDir } from './config.js';
export interface LevelInfo {
  id: number;
  title: string;
  type: string;
  tool: string;
  estimated_minutes: number;
  soft_cap_minutes: number;
  hint_count: number;
  stages: Array<{
    index: number;
    name: string;
    instruction: string;
  }>;
}

export function resolveTemplates(text: string): string {
  const characters = loadCharactersConfig();
  const eventConfig = loadEventConfig();

  // Helper to extract nested key e.g. "victim.full"
  return text.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, (_, key) => {
    const parts = key.split('.');
    let cur: any = { ...characters, ...eventConfig };
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return `{{${key}}}`;
      }
    }
    return String(cur);
  });
}

export function getLevelMeta(level: number): LevelInfo {
  const folder = String(level).padStart(2, '0');
  const levelPath = path.resolve(rootDir, `content/levels/${folder}/level.json`);
  const data = JSON.parse(fs.readFileSync(levelPath, 'utf8'));
  return data;
}

export function getLevelStory(level: number): string {
  const folder = String(level).padStart(2, '0');
  const storyPath = path.resolve(rootDir, `content/levels/${folder}/story.md`);
  const raw = fs.readFileSync(storyPath, 'utf8');
  return resolveTemplates(raw);
}

export function getLevelHints(level: number): string[] {
  const folder = String(level).padStart(2, '0');
  const hintsPath = path.resolve(rootDir, `content/levels/${folder}/hints.md`);
  const raw = fs.readFileSync(hintsPath, 'utf8');
  const resolved = resolveTemplates(raw);

  // Split by ### Tier 1, ### Tier 2, ### Tier 3
  const tiers: string[] = [];
  const parts = resolved.split(/### Tier \d+/i);
  for (const p of parts) {
    const trimmed = p.trim();
    if (trimmed) tiers.push(trimmed);
  }
  return tiers;
}

export function getLevelReveal(level: number): string {
  const folder = String(level).padStart(2, '0');
  const revealPath = path.resolve(rootDir, `content/levels/${folder}/reveal.md`);
  const raw = fs.readFileSync(revealPath, 'utf8');
  return resolveTemplates(raw);
}

export function getHashedAnswers() {
  const hashPath = path.resolve(rootDir, 'apps/server/data/answers.hashed.json');
  if (!fs.existsSync(hashPath)) {
    throw new Error('answers.hashed.json is missing! Run npm run hash-answers.');
  }
  return JSON.parse(fs.readFileSync(hashPath, 'utf8'));
}

export function getLevel2MorsePulses() {
  // Morse encoding: dot=1 unit (100ms), dash=3 units (300ms)
  // intra-letter=1 unit (100ms), inter-letter=3 units (300ms), inter-word=7 units (700ms)
  // Message: "NOT ME JULIAN"
  const MORSE_MAP: Record<string, string> = {
    N: '-.',
    O: '---',
    T: '-',
    M: '--',
    E: '.',
    J: '.---',
    U: '..-',
    L: '.-..',
    I: '..',
    A: '.-'
  };

  const words = ['NOT', 'ME', 'JULIAN'];
  const UNIT_MS = 120; // 1 unit = 120ms
  const pulses: Array<{ on: boolean; duration: number }> = [];

  words.forEach((word, wIdx) => {
    const letters = word.split('');
    letters.forEach((letter, lIdx) => {
      const code = MORSE_MAP[letter];
      if (!code) return;
      for (let i = 0; i < code.length; i++) {
        const symbol = code[i];
        const isDash = symbol === '-';
        pulses.push({ on: true, duration: (isDash ? 3 : 1) * UNIT_MS });
        if (i < code.length - 1) {
          // intra-character gap
          pulses.push({ on: false, duration: 1 * UNIT_MS });
        }
      }
      if (lIdx < letters.length - 1) {
        // inter-character gap
        pulses.push({ on: false, duration: 3 * UNIT_MS });
      }
    });
    if (wIdx < words.length - 1) {
      // inter-word gap
      pulses.push({ on: false, duration: 7 * UNIT_MS });
    }
  });

  return {
    unitMs: UNIT_MS,
    pulses,
    totalDurationMs: pulses.reduce((acc, p) => acc + p.duration, 0)
  };
}
