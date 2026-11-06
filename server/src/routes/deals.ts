import { Router, Request, Response } from 'express';
import { Deal } from '../models/Deal';

const router = Router();

// public list — easier to demo; scrape itself still needs auth
router.get('/', async (req: Request, res: Response) => {
  try {
    const source = req.query.source ? String(req.query.source) : undefined;
    const filter = source ? { source } : {};
    const deals = await Deal.find(filter).sort({ scrapedAt: -1 }).limit(200);
    return res.json({ count: deals.length, deals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list deals';
    return res.status(500).json({ error: msg });
  }
});

export default router;
