export interface ScrapedItem {
  title: string;
  price: number;
  priceDisplay: string;
  currency: string;
  link: string;
  source: string;
}

export type ScrapeSource = 'books' | 'local' | 'all';

export interface ScrapeResult {
  items: ScrapedItem[];
  errors: string[];
  sourcesRun: string[];
}
