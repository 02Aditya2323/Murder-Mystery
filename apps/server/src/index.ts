import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';

import { PORT, rootDir } from './config.js';
import { initDatabase } from './db.js';
import authRoutes from './routes/auth.js';
import levelRoutes from './routes/levels.js';
import notebookRoutes from './routes/notebook.js';
import theoryRoutes from './routes/theory.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import caseRoutes from './routes/case.js';

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'", 'data:', 'blob:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on sensitive endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/admin/login', loginLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/notebook', notebookRoutes);
app.use('/api/theory', theoryRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/case', caseRoutes);

// Health check. Render pings this, and an external uptime pinger can hit it
// during the event to stop a free instance spinning down mid-case.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

// Serve frontend build and public assets if they exist
const webDistPath = path.resolve(rootDir, 'apps/web/dist');
const webPublicPath = path.resolve(rootDir, 'apps/web/public');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
}
if (fs.existsSync(webPublicPath)) {
  app.use(express.static(webPublicPath));
}

// SPA fallback for HTML5 history API navigation
if (fs.existsSync(webDistPath)) {
  app.get('*', (req, res) => {
    // If request has a file extension or is an API route, return 404 rather than index.html
    if (req.path.startsWith('/api') || path.extname(req.path)) {
      return res.status(404).type('text/plain').send('Not found');
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`Unhandled server error on ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start server
initDatabase();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Investigation server running at http://localhost:${PORT}`);
});

export default app;
