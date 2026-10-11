import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ANSWER_SECRET, rootDir } from './config.js';
import { getHashedAnswers } from './content-loader.js';
import { db } from './db.js';

export function normalizeAnswer(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s\-_\{\}]/g, '')
    .replace(/\s+/g, ' ');
}

export function computeHash(normalized: string, salt: string): string {
  const hmac = crypto.createHmac('sha256', ANSWER_SECRET);
  hmac.update(`${salt}:${normalized}`);
  return hmac.digest('hex');
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function validateAnswer(params: {
  level: number;
  stage: number;
  answer: string;
  teamKitNo?: number;
}): { correct: boolean; nudge?: string } {
  const { level, stage, answer, teamKitNo } = params;
  const normalized = normalizeAnswer(answer);

  // Level 7: Special Geolocation Check (Names or Lat/Lng)
  if (level === 7) {
    const geoConfigPath = path.resolve(rootDir, 'content/assets-private/l7_geo_config.json');
    if (fs.existsSync(geoConfigPath)) {
      try {
        const geoConfig = JSON.parse(fs.readFileSync(geoConfigPath, 'utf8'));
        
        // 1. Check coordinates format: "54.4897, -0.6173" or "54.4897 -0.6173"
        const coordMatch = answer.trim().match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[3]);
          if (!isNaN(lat) && !isNaN(lng)) {
            const dist = haversineMeters(lat, lng, geoConfig.center.lat, geoConfig.center.lng);
            if (dist <= (geoConfig.radius_m || 1000)) {
              return { correct: true };
            }
          }
        }

        // 2. Check accepted names list
        if (Array.isArray(geoConfig.accepted_names)) {
          const cleanInput = normalized.replace(/\bTHE\b/g, '').replace(/\s+/g, ' ').trim();
          for (const name of geoConfig.accepted_names) {
            const cleanName = normalizeAnswer(name).replace(/\bTHE\b/g, '').replace(/\s+/g, ' ').trim();
            if (cleanInput === cleanName || cleanInput.includes(cleanName) || cleanName.includes(cleanInput)) {
              return { correct: true };
            }
          }
        }
      } catch (err) {
        console.error('Error reading geo config:', err);
      }
    }
  }

  // Level 8: Per-Kit Database Check
  if (level === 8) {
    if (!teamKitNo) {
      return { correct: false, nudge: 'No kit number assigned to team.' };
    }
    const kit = db.prepare('SELECT answer_hash, alternates_json FROM kits WHERE kit_no = ?').get(teamKitNo) as {
      answer_hash: string;
      alternates_json: string;
    } | undefined;

    if (kit) {
      const computed = computeHash(normalized, `KIT_${teamKitNo}_SALT_1986`);
      if (computed === kit.answer_hash) {
        return { correct: true };
      }
      try {
        const alts = JSON.parse(kit.alternates_json);
        if (Array.isArray(alts)) {
          for (const alt of alts) {
            if (normalized === normalizeAnswer(alt)) {
              return { correct: true };
            }
          }
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
    return { correct: false };
  }

  // General Check via hashed answers
  const hashedAnswers = getHashedAnswers();
  const levelData = hashedAnswers[level];
  if (!levelData) {
    return { correct: false };
  }

  const stageData = levelData.stages?.find((s: any) => s.stage === stage);
  if (!stageData) {
    return { correct: false };
  }

  // Check nudges
  if (stageData.nudges && stageData.nudges[normalized]) {
    return { correct: false, nudge: stageData.nudges[normalized] };
  }

  const computed = computeHash(normalized, `LEVEL_${level}_SALT_1986`);
  if (stageData.validHashes && stageData.validHashes.includes(computed)) {
    return { correct: true };
  }

  return { correct: false };
}
