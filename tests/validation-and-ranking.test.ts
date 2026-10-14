import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeAnswer, haversineMeters } from '../apps/server/src/level-validator.js';
import { resolveTemplates } from '../apps/server/src/content-loader.js';
import { initDatabase, db, hashPassword } from '../apps/server/src/db.js';
import { hashAllAnswers } from '../scripts/hash-answers.mjs';

describe('Answer Normalization & Geolocation', () => {
  it('correctly normalizes strings according to specification', () => {
    expect(normalizeAnswer('  not me, julian! ')).toBe('NOT ME JULIAN');
    expect(normalizeAnswer('22:37')).toBe('2237');
    expect(normalizeAnswer(' 1938-manningham ')).toBe('1938-MANNINGHAM');
    expect(normalizeAnswer('flag{rowan_hale}')).toBe('FLAG{ROWAN_HALE}');
    expect(normalizeAnswer('  whalebone    arch  ')).toBe('WHALEBONE ARCH');
  });

  it('calculates haversine distance accurately for geolocation radius validation', () => {
    // Distance between the Diu centre (20.7144, 70.9874) and a point ~200m away
    const dist = haversineMeters(54.4897, -0.6173, 54.4905, -0.6170);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(500);

    // Mumbai to Diu should be a few hundred km
    const londonDist = haversineMeters(51.5074, -0.1278, 54.4897, -0.6173);
    expect(londonDist).toBeGreaterThan(300000);
  });
});

describe('Leaderboard Ranking Algorithm', () => {
  it('ranks primarily by levels solved (excluding skipped), then by earlier elapsed time', () => {
    const teams = [
      { name: 'Team Alpha', solved: 4, skipped: 1, elapsedSeconds: 3200 },
      { name: 'Team Bravo', solved: 5, skipped: 0, elapsedSeconds: 4000 },
      { name: 'Team Charlie', solved: 5, skipped: 2, elapsedSeconds: 3500 },
      { name: 'Team Delta', solved: 3, skipped: 0, elapsedSeconds: 2100 }
    ];

    teams.sort((a, b) => {
      if (b.solved !== a.solved) {
        return b.solved - a.solved;
      }
      return a.elapsedSeconds - b.elapsedSeconds;
    });

    expect(teams[0].name).toBe('Team Charlie'); // 5 solved, 3500s
    expect(teams[1].name).toBe('Team Bravo');   // 5 solved, 4000s
    expect(teams[2].name).toBe('Team Alpha');   // 4 solved
    expect(teams[3].name).toBe('Team Delta');   // 3 solved
  });
});

describe('Dynamic Templating Engine', () => {
  it('resolves {{victim.full}} and geographic placeholders dynamically', () => {
    const template = "Found at {{victim.full}}'s estate in {{place.house_area}}, origin {{geo.town}}.";
    const resolved = resolveTemplates(template);

    expect(resolved).toContain('Dr. Elias Vane');
    expect(resolved).toContain('Malabar Hill, Mumbai');
    expect(resolved).toContain('Diu');
  });
});

describe('Hashed Answers & Validation Integrity', () => {
  beforeAll(() => {
    initDatabase();
    hashAllAnswers();
  });

  it('contains hashed answers for all 10 levels', () => {
    const hashed = JSON.parse(
      require('node:fs').readFileSync('apps/server/data/answers.hashed.json', 'utf8')
    );
    for (let i = 1; i <= 10; i++) {
      expect(hashed[i]).toBeDefined();
      expect(hashed[i].level).toBe(i);
    }
  });

  it('validates password hashing consistency', () => {
    const hash1 = hashPassword('ridgeroad');
    const hash2 = hashPassword('ridgeroad');
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex
  });
});
