import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_MAX_CONNECTIONS,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Error] Database error:', err);
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[Slow Query] ${duration}ms: ${text}`);
    }
    return res;
  } catch (err: any) {
    const sanitizedParams = params
      ? params.map((p) => (typeof p === 'string' && p.length > 8 ? `${p.slice(0, 3)}***` : p))
      : undefined;
    console.error('[Database Error]', { message: err?.message, text, sanitizedParams });
    throw err;
  }
}

export async function getClient(): Promise<pg.PoolClient> {
  return await pool.connect();
}
