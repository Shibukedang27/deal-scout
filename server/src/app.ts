import path from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import dealRoutes from './routes/deals';
import scrapeRoutes from './routes/scrape';

export function createApp() {
  const app = express();

  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  app.use(cors({ origin }));
  app.use(express.json());

  // serve the fake store so Playwright (or a browser) can hit it
  app.use('/sample-store', express.static(path.join(__dirname, '..', 'sample-store')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/deals', dealRoutes);
  app.use('/api/scrape', scrapeRoutes);

  return app;
}
