import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app';
import { _resetScrapeGateForTests } from '../src/scraper/runner';

process.env.JWT_SECRET = 'test-secret';

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
  _resetScrapeGateForTests();
});

describe('auth + deals API', () => {
  it('registers and logs in', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'secret1' });
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@example.com', password: 'secret1' });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe('me@example.com');
  });

  it('rejects short passwords', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('lists empty deals', async () => {
    const res = await request(app).get('/api/deals');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('requires auth for scrape', async () => {
    const res = await request(app).post('/api/scrape').send({ source: 'local' });
    expect(res.status).toBe(401);
  });

  it('scrapes local sample store when logged in', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'scraper@example.com', password: 'secret1' });
    const token = reg.body.token;

    const scrape = await request(app)
      .post('/api/scrape')
      .set('Authorization', `Bearer ${token}`)
      .send({ source: 'local' });

    expect(scrape.status).toBe(200);
    expect(scrape.body.saved).toBe(10);
    expect(scrape.body.sourcesRun).toContain('local-sample-store');
    expect(scrape.body.errors).toEqual([]);

    const deals = await request(app).get('/api/deals?source=local-sample-store');
    expect(deals.body.count).toBe(10);

    // upsert: second scrape shouldn't grow the count
    _resetScrapeGateForTests();
    const again = await request(app)
      .post('/api/scrape')
      .set('Authorization', `Bearer ${token}`)
      .send({ source: 'local' });
    expect(again.body.saved).toBe(10);

    const deals2 = await request(app).get('/api/deals');
    expect(deals2.body.count).toBe(10);
  });

  it('health check works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
