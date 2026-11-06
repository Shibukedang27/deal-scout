const API = import.meta.env.VITE_API_URL || '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Register failed');
  return data as { token: string; email: string };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data as { token: string; email: string };
}

export interface Deal {
  _id: string;
  title: string;
  price: number;
  priceDisplay: string;
  currency: string;
  link: string;
  source: string;
  scrapedAt: string;
}

export async function fetchDeals(source?: string) {
  const q = source ? `?source=${encodeURIComponent(source)}` : '';
  const res = await fetch(`${API}/api/deals${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load deals');
  return data as { count: number; deals: Deal[] };
}

export async function runScrape(source: 'books' | 'local' | 'all') {
  const res = await fetch(`${API}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ source }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scrape failed');
  return data as {
    saved: number;
    sourcesRun: string[];
    errors: string[];
    skipped: string | null;
    lastFinishedAt: number | null;
  };
}
