import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { Deal } from '../models/Deal';
import { parseBooksHtml } from './parseBooksHtml';
import { parseLocalHtml } from './parseLocalHtml';
import { ScrapeResult, ScrapeSource, ScrapedItem } from './types';

const BOOKS_URL = 'https://books.toscrape.com/';
const COOLDOWN_MS = 60_000;
const PAGE_TIMEOUT_MS = 20_000;

let running = false;
let lastFinishedAt = 0;

export function getScrapeStatus() {
  return { running, lastFinishedAt, cooldownMs: COOLDOWN_MS };
}

async function scrapeBooks(): Promise<ScrapedItem[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.goto(BOOKS_URL, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    return parseBooksHtml(html);
  } finally {
    await browser.close();
  }
}

async function scrapeLocal(localBaseUrl: string): Promise<ScrapedItem[]> {
  // prefer reading the file directly — no browser needed, works offline
  const htmlPath = path.join(__dirname, '..', '..', 'sample-store', 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    return parseLocalHtml(html, localBaseUrl);
  }

  // fallback: fetch via playwright if file missing somehow
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    await page.goto(`${localBaseUrl}/sample-store/`, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    return parseLocalHtml(html, localBaseUrl);
  } finally {
    await browser.close();
  }
}

async function upsertItems(items: ScrapedItem[]): Promise<number> {
  const now = new Date();
  let count = 0;
  for (const item of items) {
    await Deal.findOneAndUpdate(
      { source: item.source, link: item.link },
      { ...item, scrapedAt: now },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    count += 1;
  }
  return count;
}

export async function runScrape(
  source: ScrapeSource,
  localBaseUrl: string
): Promise<ScrapeResult & { saved: number; skipped?: string }> {
  if (running) {
    return { items: [], errors: ['A scrape is already running'], sourcesRun: [], saved: 0, skipped: 'busy' };
  }

  const since = Date.now() - lastFinishedAt;
  if (lastFinishedAt > 0 && since < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
    return {
      items: [],
      errors: [`Scrape cooldown — try again in ~${wait}s`],
      sourcesRun: [],
      saved: 0,
      skipped: 'cooldown',
    };
  }

  running = true;
  const result: ScrapeResult = { items: [], errors: [], sourcesRun: [] };

  try {
    const runBooks = source === 'books' || source === 'all';
    const runLocal = source === 'local' || source === 'all';

    if (runLocal) {
      try {
        const items = await scrapeLocal(localBaseUrl);
        result.items.push(...items);
        result.sourcesRun.push('local-sample-store');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`local-sample-store failed: ${msg}`);
      }
    }

    if (runBooks) {
      try {
        const items = await scrapeBooks();
        result.items.push(...items);
        result.sourcesRun.push('books.toscrape.com');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`books.toscrape.com failed: ${msg}`);
      }
    }

    const saved = await upsertItems(result.items);
    return { ...result, saved };
  } finally {
    running = false;
    lastFinishedAt = Date.now();
  }
}

/** reset cooldown between tests */
export function _resetScrapeGateForTests() {
  running = false;
  lastFinishedAt = 0;
}
