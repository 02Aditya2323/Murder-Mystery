import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

import { fileURLToPath } from 'node:url';

dotenv.config();

export const ANSWER_SECRET = process.env.ANSWER_SECRET || 'MURDER_MYSTERY_1986_SECRET_KEY';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'INVESTIGATION_COOKIE_SECRET_1986';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hampstead1986';
export const PORT = parseInt(process.env.PORT || '3000', 10);

function resolveProjectRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(curr, 'content', 'event.config.json'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(fileDir, '../../..');
}

export const rootDir = resolveProjectRoot();

export function loadEventConfig() {
  const cfgPath = path.resolve(rootDir, 'content/event.config.json');
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

export function loadCharactersConfig() {
  const charsPath = path.resolve(rootDir, 'content/characters.json');
  return JSON.parse(fs.readFileSync(charsPath, 'utf8'));
}
