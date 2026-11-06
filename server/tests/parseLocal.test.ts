import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { parseLocalHtml } from '../src/scraper/parseLocalHtml';
import { parsePrice } from '../src/utils/price';

describe('parsePrice', () => {
  it('parses rupee prices with commas', () => {
    const r = parsePrice('₹2,499.00');
    expect(r.price).toBe(2499);
    expect(r.currency).toBe('INR');
  });

  it('parses pound prices', () => {
    const r = parsePrice('£51.77');
    expect(r.price).toBe(51.77);
    expect(r.currency).toBe('GBP');
  });
});

describe('parseLocalHtml', () => {
  it('extracts deals from the sample store', () => {
    const htmlPath = path.join(__dirname, '..', 'sample-store', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const items = parseLocalHtml(html, 'http://127.0.0.1:4000');

    expect(items.length).toBe(10);
    expect(items[0].title).toBe('4-Port USB Hub');
    expect(items[0].price).toBe(499);
    expect(items[0].source).toBe('local-sample-store');
    expect(items[0].link).toContain('/sample-store/items/');
  });
});
