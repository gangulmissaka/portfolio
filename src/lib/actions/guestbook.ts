'use server';

import { randomUUID } from 'node:crypto';
import { refresh } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { getModeration } from '@/lib/settings';
import { rateLimit } from '@/lib/rate-limit';

export type FormState = { ok: boolean; message: string } | null;

const Entry = z.string().trim().min(2, 'Say a little more.').max(280, 'Keep it under 280 characters.');

export async function signGuestbook(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: 'Please sign in first.' };
  if (user.banned) return { ok: false, message: 'Your account can’t post notes right now.' };
  const parsed = Entry.safeParse(form.get('body'));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  if (!(await rateLimit(`gb:${user.id}`, 3, 3600))) return { ok: false, message: 'You’ve signed a few times already. Try again later.' };

  await dbReady;
  const status = (await getModeration()) && !user.isAdmin ? 'pending' : 'approved';
  await db.insert(schema.guestbook).values({ id: randomUUID(), userId: user.id, body: parsed.data, status });
  refresh();
  return { ok: true, message: status === 'pending' ? 'Thanks! Your note will appear once it’s approved.' : 'Thanks for signing!' };
}

export async function deleteOwnEntry(id: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await dbReady;
  const [row] = await db.select({ userId: schema.guestbook.userId }).from(schema.guestbook).where(eq(schema.guestbook.id, id));
  if (row && (row.userId === user.id || user.isAdmin)) {
    await db.delete(schema.guestbook).where(eq(schema.guestbook.id, id));
    refresh();
  }
}
