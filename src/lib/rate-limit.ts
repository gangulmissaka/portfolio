import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { sql } from 'drizzle-orm';
import { db, dbReady } from './db';

/** Fixed-window limiter stored in Postgres, so it works across serverless instances. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  await dbReady;
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const res = await db.execute<{ count: number }>(sql`
    insert into "rate_limit" ("key", "count", "windowStart") values (${key}, 1, ${now})
    on conflict ("key") do update set
      "count" = case when "rate_limit"."windowStart" < ${now - windowMs} then 1 else "rate_limit"."count" + 1 end,
      "windowStart" = case when "rate_limit"."windowStart" < ${now - windowMs} then ${now} else "rate_limit"."windowStart" end
    returning "count"`);
  const rows = (Array.isArray(res) ? res : (res as { rows: { count: number }[] }).rows) as { count: number }[];
  return Number(rows[0]?.count ?? 0) <= limit;
}

/** Salted hash of the caller's IP: enough to rate-limit, never stored in the clear. */
export async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local';
  const salt = process.env.BETTER_AUTH_SECRET ?? 'dev-salt';
  return createHash('sha256').update(salt + ip).digest('hex').slice(0, 32);
}
