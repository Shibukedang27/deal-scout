import { describe, it, expect } from 'vitest';
import { parseBooksHtml } from '../src/scraper/parseBooksHtml';

const FIXTURE = `
<html><body>
<article class="product_pod">
  <h3><a href="catalogue/a-light-in-the-attic_1000/index.html" title="A Light in the Attic">A Light in the ...</a></h3>
  <div class="product_price"><p class="price_color">£51.77</p></div>
</article>
<article class="product_pod">
  <h3><a href="catalogue/tipping-the-velvet_999/index.html" title="Tipping the Velvet">Tipping the Velvet</a></h3>
  <div class="product_price"><p class="price_color">£53.74</p></div>
</article>
</body></html>
`;

describe('parseBooksHtml', () => {
  it('parses product pods from fixture HTML', () => {
    const items = parseBooksHtml(FIXTURE);
    expect(items.length).toBe(2);
    expect(items[0].title).toBe('A Light in the Attic');
    expect(items[0].price).toBe(51.77);
    expect(items[0].currency).toBe('GBP');
    expect(items[0].source).toBe('books.toscrape.com');
    expect(items[0].link).toContain('books.toscrape.com');
  });
});
