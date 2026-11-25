'use server';

import { refresh } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { env } from '@/lib/env';
import { setModeration } from '@/lib/settings';
import { labsKey } from '@/lib/labs';
import { z } from 'zod';

export type AdminResult = { ok: boolean; message?: string };

/** Every admin action re-checks the session server-side; the UI hiding buttons is not the security. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) throw new Error('Not authorised');
  await dbReady;
  return user;
}

/** Admin accounts (from ADMIN_EMAILS) can't be blocked or deleted from the panel, so you can't lock yourself out. */
async function isProtected(userId: string) {
  const [u] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, userId));
  return !u || env.adminEmails.includes(u.email.toLowerCase());
}

// ── Messages ──
export async function setMessageStatus(id: string, status: 'new' | 'read' | 'archived') {
  await requireAdmin();
  await db.update(schema.message).set({ status }).where(eq(schema.message.id, id));
  refresh();
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await db.delete(schema.message).where(eq(schema.message.id, id));
  refresh();
}

// ── Guestbook ──
export async function setGuestbookStatus(ids: string[], status: 'approved' | 'pending' | 'hidden') {
  await requireAdmin();
  if (ids.length) await db.update(schema.guestbook).set({ status }).where(inArray(schema.guestbook.id, ids));
  refresh();
}

export async function deleteGuestbookEntries(ids: string[]) {
  await requireAdmin();
  if (ids.length) await db.delete(schema.guestbook).where(inArray(schema.guestbook.id, ids));
  refresh();
}

export async function setGuestbookModeration(on: boolean) {
  await requireAdmin();
  await setModeration(on);
  refresh();
}

// ── Labs access ──
const LabsEmail = z.email('That doesn’t look like an email address.').max(160);

export async function grantLabsAccess(email: string, note?: string): Promise<AdminResult> {
  await requireAdmin();
  const parsed = LabsEmail.safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const key = labsKey(parsed.data);
  if (env.adminEmails.some((a) => labsKey(a) === key)) return { ok: false, message: 'Admin accounts always have access.' };
  const [existing] = await db.select({ email: schema.labsAccess.email }).from(schema.labsAccess).where(eq(schema.labsAccess.key, key));
  if (existing) return { ok: false, message: `Already approved as ${existing.email}.` };
  await db
    .insert(schema.labsAccess)
    .values({ key, email: parsed.data, note: note?.trim().slice(0, 120) || null })
    .onConflictDoNothing();
  refresh();
  return { ok: true };
}

export async function revokeLabsAccess(key: string): Promise<AdminResult> {
  await requireAdmin();
  await db.delete(schema.labsAccess).where(eq(schema.labsAccess.key, key));
  refresh();
  return { ok: true };
}

// ── Users ──
export async function banUser(userId: string, reason?: string): Promise<AdminResult> {
  await requireAdmin();
  if (await isProtected(userId)) return { ok: false, message: 'Admin accounts can’t be blocked.' };
  await db
    .insert(schema.userBan)
    .values({ userId, reason: reason?.slice(0, 200) || null })
    .onConflictDoUpdate({ target: schema.userBan.userId, set: { reason: reason?.slice(0, 200) || null } });
  // end their sessions too, so the block takes effect immediately
  await db.delete(schema.session).where(eq(schema.session.userId, userId));
  refresh();
  return { ok: true };
}

export async function unbanUser(userId: string): Promise<AdminResult> {
  await requireAdmin();
  await db.delete(schema.userBan).where(eq(schema.userBan.userId, userId));
  refresh();
  return { ok: true };
}

export async function signOutEverywhere(userId: string): Promise<AdminResult> {
  const me = await requireAdmin();
  if (userId === me.id) return { ok: false, message: 'Use “Sign out” to end your own session.' };
  await db.delete(schema.session).where(eq(schema.session.userId, userId));
  refresh();
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<AdminResult> {
  await requireAdmin();
  if (await isProtected(userId)) return { ok: false, message: 'Admin accounts can’t be deleted here.' };
  // sessions, accounts, guestbook notes, reactions and the ban row all cascade
  await db.delete(schema.user).where(eq(schema.user.id, userId));
  refresh();
  return { ok: true };
}
