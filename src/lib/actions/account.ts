'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';

/** Deletes the signed-in user and everything they created (sessions, accounts, guestbook notes, reactions cascade). */
export async function deleteMyAccount() {
  const user = await getCurrentUser();
  if (!user) return;
  await dbReady;
  await auth.api.signOut({ headers: await headers() }).catch(() => {});
  await db.delete(schema.user).where(eq(schema.user.id, user.id));
  redirect('/privacy?deleted=1');
}
