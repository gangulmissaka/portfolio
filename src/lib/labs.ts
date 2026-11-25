import 'server-only';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getCurrentUser, type SessionUser } from './auth';
import { db, dbReady, schema } from './db';

/**
 * Labs is private: only the admin (ADMIN_EMAILS) and the emails approved in Admin → Labs may see the nav link or
 * open /labs. The list lives in the `labs_access` table and is checked on every request, so removing someone
 * takes effect on their next page load.
 */

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

/**
 * The form used to compare addresses. Gmail ignores dots and anything after "+" in the name part, and
 * googlemail.com is the same mailbox, so "John.Doe+x@googlemail.com" and "johndoe@gmail.com" are one account.
 * Other domains (incl. Google Workspace) are only lowercased, because their dots can be significant.
 */
export function labsKey(email: string) {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (!GMAIL.has(domain)) return e;
  return `${local.split('+')[0].replaceAll('.', '')}@gmail.com`;
}

async function isApproved(email: string) {
  await dbReady;
  const [row] = await db.select({ key: schema.labsAccess.key }).from(schema.labsAccess).where(eq(schema.labsAccess.key, labsKey(email)));
  return !!row;
}

/** True for the admin and for approved, non-blocked members. Deduplicated per request. */
export const hasLabsAccess = cache(async (user: SessionUser | null): Promise<boolean> => {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.banned) return false;
  return isApproved(user.email);
});

/** Current user if they may use Labs, else null. Request-time: call inside <Suspense>. */
export async function getLabsUser() {
  const user = await getCurrentUser();
  return (await hasLabsAccess(user)) ? user : null;
}

/**
 * Gate for every Labs page. Anyone without access, signed in or not, gets the same plain 404 as a page that
 * doesn't exist, so the section never advertises itself. Approved people sign in first, then use the nav link.
 */
export async function requireLabsPage() {
  const user = await getLabsUser();
  if (!user) notFound();
  return user;
}

/** For future Labs server actions: hiding the UI is not the security, so every action re-checks. */
export async function requireLabsAction() {
  const user = await getLabsUser();
  if (!user) throw new Error('Not authorised');
  return user;
}
