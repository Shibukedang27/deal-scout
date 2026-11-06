import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { createApp } from './app';

// load ../.env from repo root, then local .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dealscout';

async function main() {
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET not set — using a dev default. Set it in .env for real use.');
    process.env.JWT_SECRET = 'dev-only-secret-change-me';
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
