import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export const databaseConfigured = Boolean(process.env.DATABASE_URL ||
  (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME));
if (!databaseConfigured) console.error('[Database configuration] Set DATABASE_URL (Supabase PostgreSQL connection string) or all SQL_* variables.');
// DATABASE_URL stays on the server. A Supabase anon key is not a PostgreSQL password.
const pool = new Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.SQL_HOST, user: process.env.SQL_USER, password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME, port: Number(process.env.SQL_PORT || 5432),
  }),
  max: 5, connectionTimeoutMillis: 5000, query_timeout: 8000,
});
pool.on('error', error => console.error('[PostgreSQL connection]', { code: (error as Error & { code?: string }).code, message: error.message }));
export const db = drizzle(pool, { schema });
