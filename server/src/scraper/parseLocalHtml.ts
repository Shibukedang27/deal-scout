import { parsePrice } from '../utils/price';
import { ScrapedItem } from './types';

const SOURCE = 'local-sample-store';

/**
 * Parse the bundled sample-store HTML without launching a browser.
 * Used by the scraper and by unit tests.
 */
export function parseLocalHtml(html: string, baseUrl: string): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  // crude but readable: find each .deal block
  const dealBlocks = html.split('class="deal"').slice(1);

  for (const block of dealBlocks) {
    const titleMatch = block.match(/class="title"[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]+)</);
    const priceMatch = block.match(/class="price"[^>]*>([^<]+)</);
    if (!titleMatch || !priceMatch) continue;

    const href = titleMatch[1].trim();
    const title = titleMatch[2].trim();
    const { price, currency, priceDisplay } = parsePrice(priceMatch[1]);
    const link = href.startsWith('http') ? href : new URL(href, baseUrl).toString();

    items.push({ title, price, priceDisplay, currency, link, source: SOURCE });
  }

  return items;
}
