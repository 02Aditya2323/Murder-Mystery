import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import { initDatabase, db } from '../apps/server/src/db.js';
import { hashAllAnswers } from '../scripts/hash-answers.mjs';
import { startEvent } from '../apps/server/src/event-clock.js';
import authRoutes from '../apps/server/src/routes/auth.js';
import levelRoutes from '../apps/server/src/routes/levels.js';
import theoryRoutes from '../apps/server/src/routes/theory.js';
import notebookRoutes from '../apps/server/src/routes/notebook.js';
import adminRoutes from '../apps/server/src/routes/admin.js';

let server: http.Server;
let port: number;
let baseUrl: string;

beforeAll(async () => {
  initDatabase();
  hashAllAnswers();

  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/levels', levelRoutes);
  app.use('/api/theory', theoryRoutes);
  app.use('/api/notebook', notebookRoutes);
  app.use('/api/admin', adminRoutes);

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr: any = server.address();
      port = addr.port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  // Ensure fresh team 1 state and running event clock
  db.prepare("UPDATE event SET state = 'RUNNING', started_at = datetime('now'), paused_total_ms = 0, pause_started_at = NULL, ended_at = NULL WHERE id = 1").run();
  db.prepare("UPDATE level_state SET status = 'OPEN', started_at = datetime('now'), solved_at = NULL, stage_index = 0, hints_used = 0, wrong_attempts = 0, skipped = 0 WHERE team_id = 'team-1' AND level = 1").run();
  db.prepare("UPDATE level_state SET status = 'SEALED', started_at = NULL, solved_at = NULL, stage_index = 0, hints_used = 0, wrong_attempts = 0, skipped = 0 WHERE team_id = 'team-1' AND level > 1").run();
  db.prepare("DELETE FROM attempts WHERE team_id = 'team-1'").run();
  db.prepare("DELETE FROM theory WHERE team_id = 'team-1'").run();
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('Full 10-Level Investigation Happy Path E2E', () => {
  let sessionCookie = '';

  it('Step 0: Logs in as Team 1 (Colaba Division)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'COLABA', password: 'ridgeroad' })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.team.name).toBe('Colaba Division');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    sessionCookie = setCookie!.split(';')[0];
  });

  it('Step 0b: Verifies sealed levels return 403 Forbidden to prevent guessing', async () => {
    const res = await fetch(`${baseUrl}/levels/4`, {
      headers: { Cookie: sessionCookie }
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain('sealed');
  });

  it('Level 1: Solves The Stopped Clock (Answer: 2237)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/1/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: '2237' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('22:37 to 23:07');
  });

  it('Level 2: Solves Recording Seven (Morse Answer: NOT ME JULIAN)', async () => {
    const morseRes = await fetch(`${baseUrl}/levels/2/morse`, {
      headers: { Cookie: sessionCookie }
    });
    expect(morseRes.status).toBe(200);

    const submitRes = await fetch(`${baseUrl}/levels/2/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: 'NOT ME JULIAN' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('Recording Seven');
  });

  it('Level 3: Solves The Old Case (Stage 0: 1938MANNINGHAM, Stage 1: 32-4417)', async () => {
    // Stage 0 gate
    const gateRes = await fetch(`${baseUrl}/levels/3/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: '1938MANNINGHAM' })
    });
    expect(gateRes.status).toBe(200);
    const gateData = await gateRes.json();
    expect(gateData.correct).toBe(true);
    expect(gateData.nextStage).toBe(true);

    // Stage 1 questions
    const qRes = await fetch(`${baseUrl}/levels/3/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 1, answer: '32-4417' })
    });
    expect(qRes.status).toBe(200);
    const qData = await qRes.json();
    expect(qData.correct).toBe(true);
    expect(qData.solved).toBe(true);
    expect(qData.reveal).toContain('32 minutes');
  });

  it('Level 4: Solves The Patient Files (SQL Answer: LENA_IPAD-P0912)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/4/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: 'LENA_IPAD-P0912' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('LENA_IPAD');
  });

  it('Level 5: Solves Contradictions (Answer: 3527)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/5/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: '3527' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('Four suspects lied');
  });

  it('Level 6: Solves Mira Silence (opaque exhibit refs, true chronological order)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/6/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: 'MV-73,MV-18,MV-41,MV-66,MV-05,MV-29' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('music box');
  });

  it('Level 7: Solves The Perfect Alibi (geolocation)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/7/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: 'Diu' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('Diu');
  });

  it('Level 8: Solves The Garage Panel (per-kit wiring: kit 1 reads 001)', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/8/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: '001' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('A. Cross');
  });

  it('Level 9: Solves The Locked Room (code reading)', async () => {
    // The per-blank checker was removed: it answered with no rate limit and no
    // attempt logging, so twelve requests brute-forced the beat.
    const goneRes = await fetch(`${baseUrl}/levels/9/check-blanks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ picks: ['60', '+', '%'] })
    });
    expect(goneRes.status).not.toBe(200);

    // Submit
    const submitRes = await fetch(`${baseUrl}/levels/9/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: '2308-4417' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('23:08');
  });

  it('Level 10: Solves The Accomplice (Answer: FLAG{ROWAN_HALE})', async () => {
    const submitRes = await fetch(`${baseUrl}/levels/10/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ stage: 0, answer: 'FLAG{ROWAN_HALE}' })
    });
    expect(submitRes.status).toBe(200);
    const data = await submitRes.json();
    expect(data.correct).toBe(true);
    expect(data.solved).toBe(true);
    expect(data.reveal).toContain('Rowan Hale');
  });

  it('Submits Final Theory of Prosecution and Verifies Admin Review Screen', async () => {
    const theoryRes = await fetch(`${baseUrl}/theory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        q1: 'Adrian Cross',
        q2: 'Violent confrontation in study after entering via garage service code.',
        q3: 'To fake time of death to 22:17 aligning with his 22:21 alibi photo.',
        q4: 'Elias killed Julian over falsified patient records, Rowan covered it up.',
        q5: 'Gaslit by Elias into doubting her own memory.',
        q6: 'To destroy Recording Three and hide her liability.',
        q7: 'Julian half-brother gathering evidence.',
        q8: 'Rowan was the corrupt accomplice who opened the maintenance window.'
      })
    });
    expect(theoryRes.status).toBe(200);
    const theoryData = await theoryRes.json();
    expect(theoryData.ok).toBe(true);

    // Admin emergency login
    const adminLoginRes = await fetch(`${baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'malabarhill2026' })
    });
    expect(adminLoginRes.status).toBe(200);
    const adminCookie = adminLoginRes.headers.get('set-cookie')!.split(';')[0];

    // Admin views theories
    const theoriesRes = await fetch(`${baseUrl}/admin/theories`, {
      headers: { Cookie: adminCookie }
    });
    expect(theoriesRes.status).toBe(200);
    const allTheories = await theoriesRes.json();
    expect(allTheories.theories.length).toBeGreaterThan(0);
    expect(allTheories.canonical.q1).toContain('Adrian Cross');
  });
});
