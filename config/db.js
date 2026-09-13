import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

// Neon HTTP client — zero IP restrictions, works natively with Vercel serverless
const sql = neon(process.env.DATABASE_URL);

export default sql;
