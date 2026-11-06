import { Router, Response } from 'express';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { runScrape, getScrapeStatus } from '../scraper/runner';
import { ScrapeSource } from '../scraper/types';

const router = Router();

router.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const raw = String(req.body?.source || 'all');
    const source = (['books', 'local', 'all'].includes(raw) ? raw : 'all') as ScrapeSource;

    const port = process.env.PORT || '4000';
    const localBaseUrl = `http://127.0.0.1:${port}`;

    const result = await runScrape(source, localBaseUrl);
    const status = getScrapeStatus();

    return res.json({
      saved: result.saved,
      sourcesRun: result.sourcesRun,
      errors: result.errors,
      skipped: result.skipped || null,
      sample: result.items.slice(0, 5),
      lastFinishedAt: status.lastFinishedAt || null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scrape failed';
    return res.status(500).json({ error: msg });
  }
});

router.get('/status', requireAuth, (_req: AuthedRequest, res: Response) => {
  return res.json(getScrapeStatus());
});

export default router;
