# deal-scout

Personal practice project. I wanted to try out a full stack setup with scraping, so I built a small app that pulls product deals from sample pages and shows them in a dashboard.

It uses React + TypeScript on the front, Express + TypeScript on the back, MongoDB for storage, and Playwright for scraping. Auth is a basic JWT login.

**Note:** this only scrapes sites that are meant for practice (`books.toscrape.com`) plus a fake local store that ships with the repo. I am not scraping real shopping sites.

## What it does

- Register / login
- Hit a button to scrape deals (needs login)
- Browse deals in a simple table, filter by source
- Deals are upserted by source + link so reruns don't create duplicates

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node, Express, TypeScript
- DB: MongoDB (Mongoose)
- Scraper: Playwright
- Auth: JWT + bcrypt

## How to run locally

### 1. Start MongoDB

```bash
docker compose up -d
```

Or point `MONGODB_URI` at any Mongo you already have.

### 2. Backend

```bash
cd server
cp ../.env.example ../.env   # edit JWT_SECRET at least
npm install
npx playwright install chromium
npm run dev
```

API runs on http://localhost:4000

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

Register a new account, then use **Run scrape** on the dashboard.

## API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | no | `{ email, password }` |
| POST | `/api/auth/login` | no | returns `{ token, email }` |
| GET | `/api/deals?source=` | no | list deals, optional source filter |
| POST | `/api/scrape` | yes | body optional `{ source: "books" \| "local" \| "all" }` |
| GET | `/api/health` | no | health check |

Protected routes need `Authorization: Bearer <token>`.

## How scraping works

1. `POST /api/scrape` (logged in) starts a scrape.
2. Only one scrape runs at a time. If one finished in the last 60 seconds, the next call is skipped.
3. Sources:
   - `books` → https://books.toscrape.com (first page)
   - `local` → the HTML file under `server/sample-store/` served at `/sample-store`
   - `all` → both (default)
4. Each item is saved as title, price, currency, link, source, scrapedAt.
5. Upsert key is `(source, link)`.

If a source is down or times out, the response still returns whatever worked, plus an error message for the failed source.

## Tests

```bash
cd server
npm test
```

Uses an in-memory MongoDB, so Docker is not needed for tests. The scraper tests parse the local HTML only (no live network in CI).

## Things I'd improve

- [ ] Add pagination on the deals list
- [ ] Better price parsing for more currencies
- [ ] A scheduled scrape (cron) instead of only manual
- [ ] Deploy the API somewhere free (Render / Railway)
- [ ] Add refresh tokens instead of a single long-lived JWT

## License

MIT
