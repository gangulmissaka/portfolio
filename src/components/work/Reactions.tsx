import { and, eq, notExists, sql } from 'drizzle-orm';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { REACTION_KINDS } from '@/lib/reaction-kinds';
import { ReactionButtons } from './ReactionButtons';

/** Server island (request-time): counts per reaction + which ones the visitor gave. */
export async function Reactions({ slug }: { slug: string }) {
  await connection();
  let counts: Record<string, number> = {};
  let mine: string[] = [];
  const user = await getCurrentUser();
  try {
    await dbReady;
    const rows = await db
      .select({ kind: schema.reaction.kind, n: sql<number>`count(*)::int` })
      .from(schema.reaction)
      .where(and(eq(schema.reaction.slug, slug), notExists(db.select().from(schema.userBan).where(eq(schema.userBan.userId, schema.reaction.userId)))))
      .groupBy(schema.reaction.kind);
    counts = Object.fromEntries(rows.map((r) => [r.kind, Number(r.n)]));
    if (user) {
      mine = (await db.select({ kind: schema.reaction.kind }).from(schema.reaction).where(and(eq(schema.reaction.slug, slug), eq(schema.reaction.userId, user.id)))).map((r) => r.kind);
    }
  } catch (e) {
    unstable_rethrow(e);
    console.error('[reactions]', e);
  }
  return <ReactionButtons slug={slug} kinds={[...REACTION_KINDS]} counts={counts} mine={mine} signedIn={!!user} />;
}
