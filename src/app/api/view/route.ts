import { sql } from 'drizzle-orm';
import { db, dbReady } from '@/lib/db';
import { ipHash, rateLimit } from '@/lib/rate-limit';

const PATH_RE = /^\/[a-z0-9\-/]{0,80}$/i;

export async function POST(req: Request) {
  try {
    const { path } = (await req.json()) as { path?: string };
    if (!path || !PATH_RE.test(path)) return new Response(null, { status: 204 });
    const ua = req.headers.get('user-agent') ?? '';
    if (/bot|crawler|spider|headless|lighthouse/i.test(ua)) return new Response(null, { status: 204 });
    if (!(await rateLimit(`view:${await ipHash()}`, 120, 3600))) return new Response(null, { status: 204 });
    await dbReady;
    const day = new Date().toISOString().slice(0, 10);
    await db.execute(sql`insert into "page_view" ("path", "day", "count") values (${path}, ${day}, 1)
      on conflict ("path", "day") do update set "count" = "page_view"."count" + 1`);
  } catch (e) {
    console.error('[view]', e);
  }
  return new Response(null, { status: 204 });
}
