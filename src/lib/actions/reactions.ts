'use server';

import { randomUUID } from 'node:crypto';
import { refresh } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { PROJECTS } from '@/content/site';
import { REACTION_KINDS } from '@/lib/reaction-kinds';

export async function toggleReaction(slug: string, kind: string): Promise<{ ok: boolean; message?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Sign in to react.' };
  if (user.banned) return { ok: false, message: 'Your account can’t react right now.' };
  if (!PROJECTS.some((p) => p.slug === slug) || !REACTION_KINDS.some((k) => k.id === kind)) return { ok: false };
  await dbReady;
  const where = and(eq(schema.reaction.userId, user.id), eq(schema.reaction.slug, slug), eq(schema.reaction.kind, kind));
  const existing = await db.select({ id: schema.reaction.id }).from(schema.reaction).where(where);
  if (existing.length) await db.delete(schema.reaction).where(where);
  else await db.insert(schema.reaction).values({ id: randomUUID(), userId: user.id, slug, kind }).onConflictDoNothing();
  refresh();
  return { ok: true };
}
