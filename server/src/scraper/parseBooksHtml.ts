import { parsePrice } from '../utils/price';
import { ScrapedItem } from './types';

const SOURCE = 'books.toscrape.com';
const SITE = 'https://books.toscrape.com/';

/**
 * Parse a books.toscrape.com listing page HTML.
 * Separated so tests can feed fixture HTML without network.
 */
export function parseBooksHtml(html: string): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const pods = html.split('class="product_pod"').slice(1);

  for (const pod of pods) {
    const withTitle = pod.match(/<h3>\s*<a[^>]*href="([^"]+)"[^>]*title="([^"]+)"/);
    const withTitleAlt = pod.match(/<h3>\s*<a[^>]*title="([^"]+)"[^>]*href="([^"]+)"/);
    const priceMatch = pod.match(/class="price_color"[^>]*>([^<]+)</);

    if (!priceMatch) continue;

    let href = '';
    let title = '';
    if (withTitle) {
      href = withTitle[1].trim();
      title = withTitle[2].trim();
    } else if (withTitleAlt) {
      title = withTitleAlt[1].trim();
      href = withTitleAlt[2].trim();
    } else {
      continue;
    }

    const { price, currency, priceDisplay } = parsePrice(priceMatch[1]);
    const link = href.startsWith('http') ? href : new URL(href, SITE).toString();

    items.push({ title, price, priceDisplay, currency, link, source: SOURCE });
  }

  return items;
}
