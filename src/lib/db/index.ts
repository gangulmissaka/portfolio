import 'server-only';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import { mkdirSync } from 'node:fs';
import * as schema from './schema';

/**
 * Production: Neon Postgres (DATABASE_URL). Local development without a DATABASE_URL: an embedded Postgres
 * (PGlite), in memory unless PGLITE_DIR is set, so the backend works with zero setup.
 */
function create() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    const db = drizzleNeon({ client: pool, schema });
    const ready = pool.query(schema.DDL).then(() => undefined);
    return { db, ready, kind: 'neon' as const };
  }
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PGLITE) {
    console.warn('[db] DATABASE_URL is not set; using a temporary embedded database. Data will not persist.');
  }
  // In-memory by default (fresh on every restart, can't be corrupted). Set PGLITE_DIR to keep data between runs.
  const dir = process.env.NODE_ENV === 'production' ? undefined : process.env.PGLITE_DIR || undefined;
  if (dir) mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzlePglite({ client, schema });
  const ready = client.exec(schema.DDL).then(() => undefined);
  return { db, ready, kind: 'pglite' as const };
}

type Created = ReturnType<typeof create>;
const g = globalThis as unknown as { __gmdb?: Created };
const created = g.__gmdb ?? (g.__gmdb = create());

export const db = created.db as Created['db'];
/** Await before your own queries so the tables exist on a brand-new database. */
export const dbReady = created.ready;
export const dbKind = created.kind;
export { schema };
