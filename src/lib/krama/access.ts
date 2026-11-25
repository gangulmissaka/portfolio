import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import type { SessionUser } from '@/lib/auth';
import { db, dbReady, schema } from '@/lib/db';
import { labsKey } from '@/lib/labs-key';
import { DEFAULT_ROLES, type Access, type Perm } from './model';

const { kramaBoard: B, kramaMember: M, kramaRole: R } = schema;

export type BoardAccess = Perm & { boardId: string; ownerId: string };

/**
 * The caller's rights on a board, or null if they can't see it.
 * Owner and Krama admin (the site admin): everything, including members and roles.
 * Members: by their access level and roles; they never manage members or roles.
 */
export async function boardAccess(user: SessionUser, boardId: string): Promise<BoardAccess | null> {
  await dbReady;
  const [b] = await db.select({ id: B.id, userId: B.userId }).from(B).where(eq(B.id, boardId));
  if (!b) return null;
  const isOwner = b.userId === user.id;
  const [m] = await db.select({ access: M.access, roleIds: M.roleIds }).from(M).where(and(eq(M.boardId, b.id), eq(M.key, labsKey(user.email))));
  const roleIds = m?.roleIds ?? [];
  if (isOwner || user.isAdmin) {
    return { boardId: b.id, ownerId: b.userId, canEdit: true, canManage: true, isOwner, isAdmin: user.isAdmin, all: true, roleIds, access: 'owner' };
  }
  if (!m || user.banned) return null;
  const access = (m.access === 'full' ? 'full' : 'tick') as Access;
  return { boardId: b.id, ownerId: b.userId, canEdit: access === 'full', canManage: false, isOwner: false, isAdmin: false, all: false, roleIds, access };
}

/**
 * Does this person use Krama: invited to any board, or owner of one? Either opens Labs → Krama for them, so people
 * you invite can also start their own projects and keep them.
 */
export async function isKramaUser(email: string, userId: string) {
  await dbReady;
  const [m] = await db.select({ n: sql<number>`1` }).from(M).where(eq(M.key, labsKey(email))).limit(1);
  if (m) return true;
  const [b] = await db.select({ n: sql<number>`1` }).from(B).where(eq(B.userId, userId)).limit(1);
  return !!b;
}

/**
 * Adds the default team roles (PM, BA, FE, BE, QA, ALL) to a board. Server-only on purpose: it must never be a
 * server action. Also upgrades boards created before roles existed (called when such a board is opened).
 */
export async function seedRoles(boardId: string) {
  await db.insert(R).values(DEFAULT_ROLES.map((r, i) => ({ id: crypto.randomUUID(), boardId, code: r.code, name: r.name, color: r.color, position: i })));
}
