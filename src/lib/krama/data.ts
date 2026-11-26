import 'server-only';
import { and, asc, desc, eq, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { db, dbReady, schema } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';
import { labsKey } from '@/lib/labs-key';
import { boardAccess, seedRoles } from './access';
import type { Access, BoardData, CoverColor, KCard, KComment, KMember, LabelColor, Priority, ThemeId } from './model';

const { kramaBoard: B, kramaList: L, kramaCard: C, kramaLabel: LB, kramaComment: CM, kramaRole: R, kramaMember: M, kramaActivity: ACT, kramaRevision: RV, user: U } = schema;

/** Every account, keyed by normalised email (to match Krama members to the people who signed in). */
async function accountsByKey() {
  const rows = await db.select({ id: U.id, name: U.name, email: U.email, image: U.image }).from(U).limit(5000);
  return new Map(rows.map((u) => [labsKey(u.email), u]));
}

/** Ids of boards this user can open: their own plus those they were invited to. */
async function accessibleBoardIds(user: SessionUser) {
  const key = labsKey(user.email);
  const rows = await db
    .select({ id: B.id })
    .from(B)
    .where(or(eq(B.userId, user.id), sql`exists(select 1 from "krama_member" m where m."boardId" = "krama_board"."id" and m."key" = ${key})`));
  return rows.map((r) => r.id);
}

/** Boards for the home screen: the user's own (starred first, then recent) and boards shared with them. */
export async function listBoards(user: SessionUser) {
  await dbReady;
  const key = labsKey(user.email);
  // the board id is written out in full: in a single-table select Drizzle renders ${B.id} as a bare "id",
  // which inside these subqueries would point at the subquery's own table
  const bid = sql.raw('"krama_board"."id"');
  const rows = await db
    .select({
      id: B.id,
      title: B.title,
      theme: B.theme,
      starred: B.starred,
      userId: B.userId,
      ownerName: U.name,
      ownerEmail: U.email,
      updatedAt: B.updatedAt,
      lists: sql<number>`(select count(*)::int from "krama_list" where "krama_list"."boardId" = ${bid})`,
      cards: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived")`,
      open: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived" and "krama_card"."dueDate" is not null and not "krama_card"."dueDone")`,
      members: sql<number>`(select count(*)::int from "krama_member" where "krama_member"."boardId" = ${bid})`,
      myAccess: sql<string | null>`(select m."access" from "krama_member" m where m."boardId" = ${bid} and m."key" = ${key})`,
    })
    .from(B)
    .innerJoin(U, eq(U.id, B.userId))
    .where(or(eq(B.userId, user.id), sql`exists(select 1 from "krama_member" m where m."boardId" = ${bid} and m."key" = ${key})`))
    .orderBy(desc(B.starred), desc(B.updatedAt));
  // member counts without the creator's own row (where their roles live)
  const memberRows = rows.length ? await db.select({ boardId: M.boardId, key: M.key }).from(M).where(inArray(M.boardId, rows.map((r) => r.id))) : [];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    theme: r.theme as ThemeId,
    starred: r.starred,
    mine: r.userId === user.id,
    ownerName: r.ownerName,
    access: (r.userId === user.id ? 'owner' : r.myAccess === 'full' ? 'full' : 'tick') as Access | 'owner',
    lists: Number(r.lists),
    cards: Number(r.cards),
    open: Number(r.open),
    members: memberRows.filter((m) => m.boardId === r.id && m.key !== labsKey(r.ownerEmail)).length,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** A project in the account menu's quick list. */
export type MenuBoard = { id: string; title: string; theme: ThemeId; mine: boolean };

/**
 * The account menu's "Your projects" list: boards this user created or was added to as a member, starred first,
 * then most recently changed. Light on purpose (no counts): it runs whenever the menu opens.
 */
export async function menuBoards(user: SessionUser): Promise<MenuBoard[]> {
  await dbReady;
  const key = labsKey(user.email);
  const rows = await db
    .select({ id: B.id, title: B.title, theme: B.theme, userId: B.userId })
    .from(B)
    .where(or(eq(B.userId, user.id), sql`exists(select 1 from "krama_member" m where m."boardId" = "krama_board"."id" and m."key" = ${key})`))
    .orderBy(desc(B.starred), desc(B.updatedAt))
    .limit(50);
  return rows.map((r) => ({ id: r.id, title: r.title, theme: r.theme as ThemeId, mine: r.userId === user.id }));
}

const toCard = (c: typeof C.$inferSelect): KCard => ({
  id: c.id,
  listId: c.listId,
  title: c.title,
  description: c.description,
  dueDate: c.dueDate,
  dueTime: c.dueTime,
  dueDone: c.dueDone,
  priority: c.priority as Priority,
  cover: (c.cover as CoverColor | null) ?? null,
  labelIds: c.labelIds ?? [],
  checklists: c.checklists ?? [],
  archived: c.archived,
  roleId: c.roleId,
  doneBy: c.doneBy,
  doneAt: c.doneAt ? c.doneAt.toISOString() : null,
  revision: c.revisionAt && c.revisionReason ? { reason: c.revisionReason, by: c.revisionBy, at: c.revisionAt.toISOString() } : null,
  createdAt: c.createdAt.toISOString(),
});

/** One board with everything on it, or null if it doesn't exist or this user may not open it. */
export async function loadBoard(user: SessionUser, boardId: string): Promise<BoardData | null> {
  await dbReady;
  const acc = await boardAccess(user, boardId);
  if (!acc) return null;
  const [board] = await db.select().from(B).where(eq(B.id, boardId));
  if (!board) return null;

  let roles = await db.select({ id: R.id, code: R.code, name: R.name, color: R.color }).from(R).where(eq(R.boardId, boardId)).orderBy(asc(R.position));
  if (!roles.length) {
    await seedRoles(boardId); // boards made before roles existed
    roles = await db.select({ id: R.id, code: R.code, name: R.name, color: R.color }).from(R).where(eq(R.boardId, boardId)).orderBy(asc(R.position));
  }

  const ids = await accessibleBoardIds(user);
  const [boards, lists, cards, labels, members, accounts] = await Promise.all([
    db.select({ id: B.id, title: B.title, theme: B.theme }).from(B).where(inArray(B.id, ids)).orderBy(desc(B.starred), desc(B.updatedAt)),
    db.select({ id: L.id, title: L.title }).from(L).where(eq(L.boardId, boardId)).orderBy(asc(L.position), asc(L.createdAt)),
    db.select().from(C).where(eq(C.boardId, boardId)).orderBy(asc(C.position), asc(C.createdAt)),
    db.select({ id: LB.id, name: LB.name, color: LB.color }).from(LB).where(eq(LB.boardId, boardId)).orderBy(asc(LB.position)),
    db.select().from(M).where(eq(M.boardId, boardId)).orderBy(asc(M.createdAt)),
    accountsByKey(),
  ]);
  const revisions = await db.select().from(RV).where(eq(RV.boardId, boardId)).orderBy(asc(RV.createdAt));

  const cardIds = cards.map((c) => c.id);
  const comments = cardIds.length
    ? await db
        .select({ id: CM.id, cardId: CM.cardId, body: CM.body, createdAt: CM.createdAt, userId: CM.userId, name: U.name, image: U.image })
        .from(CM)
        .innerJoin(U, eq(U.id, CM.userId))
        .where(inArray(CM.cardId, cardIds))
        .orderBy(desc(CM.createdAt))
    : [];

  const order: Record<string, string[]> = Object.fromEntries(lists.map((l) => [l.id, []]));
  const byId: Record<string, KCard> = {};
  for (const c of cards) {
    byId[c.id] = toCard(c);
    if (!c.archived) order[c.listId]?.push(c.id);
  }
  const byCard: Record<string, KComment[]> = {};
  for (const c of comments) {
    (byCard[c.cardId] ??= []).push({ id: c.id, cardId: c.cardId, body: c.body, createdAt: c.createdAt.toISOString(), authorId: c.userId, author: { name: c.name, image: c.image } });
  }

  const owner = [...accounts.values()].find((u) => u.id === board.userId);
  const ownerKey = owner ? labsKey(owner.email) : null;
  const ownerRow = members.find((m) => m.key === ownerKey);
  const kmembers: KMember[] = members.filter((m) => m.key !== ownerKey).map((m) => {
    const a = accounts.get(m.key);
    return { id: m.id, email: m.email, name: m.name, access: m.access === 'full' ? 'full' : 'tick', roleIds: m.roleIds ?? [], account: a ? { id: a.id, name: a.name, image: a.image } : null };
  });
  const activity = acc.canManage
    ? await db
        .select({ id: ACT.id, action: ACT.action, cardId: ACT.cardId, createdAt: ACT.createdAt, name: U.name, image: U.image })
        .from(ACT)
        .leftJoin(U, eq(U.id, ACT.userId))
        .where(eq(ACT.boardId, boardId))
        .orderBy(desc(ACT.createdAt))
        .limit(40)
    : [];
  const people: BoardData['people'] = {};
  const peopleIds = [...cards.map((c) => c.doneBy), ...cards.map((c) => c.revisionBy), ...revisions.map((r) => r.byUserId), ...revisions.map((r) => r.targetUserId)];
  for (const id of new Set(peopleIds.filter(Boolean) as string[])) {
    const a = [...accounts.values()].find((u) => u.id === id);
    if (a) people[id] = { name: a.name, image: a.image };
  }

  return {
    board: { id: board.id, title: board.title, theme: board.theme as ThemeId, starred: board.starred },
    boards: boards.map((b) => ({ ...b, theme: b.theme as ThemeId })),
    lists,
    order,
    cards: byId,
    labels: labels.map((l) => ({ ...l, color: l.color as LabelColor })),
    comments: byCard,
    roles: roles.map((r) => ({ ...r, color: r.color as LabelColor })),
    members: kmembers,
    owner: { id: board.userId, name: owner?.name ?? 'Owner', email: owner?.email ?? '', image: owner?.image ?? null, roleIds: ownerRow?.roleIds ?? [] },
    people,
    revisions: revisions.map((r) => ({ id: r.id, cardId: r.cardId, byId: r.byUserId, targetId: r.targetUserId, reason: r.reason, createdAt: r.createdAt.toISOString(), resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null })),
    activity: activity.map((a) => ({ id: a.id, action: a.action, cardId: a.cardId, createdAt: a.createdAt.toISOString(), user: a.name ? { name: a.name, image: a.image } : null })),
    perm: { canEdit: acc.canEdit, canManage: acc.canManage, isOwner: acc.isOwner, isAdmin: acc.isAdmin, all: acc.all, roleIds: acc.roleIds, access: acc.access },
    me: { id: user.id, name: user.name, image: user.image },
  };
}

export type DueItem = {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string | null;
  dueDone: boolean;
  priority: Priority;
  cover: CoverColor | null;
  boardId: string;
  boardTitle: string;
  theme: ThemeId;
  listTitle: string;
  roleCode: string | null;
};

/** Every active card with a due date, across all boards this user can open. */
export async function dueCards(user: SessionUser): Promise<DueItem[]> {
  await dbReady;
  const ids = await accessibleBoardIds(user);
  if (!ids.length) return [];
  const rows = await db
    .select({
      id: C.id,
      title: C.title,
      dueDate: C.dueDate,
      dueTime: C.dueTime,
      dueDone: C.dueDone,
      priority: C.priority,
      cover: C.cover,
      boardId: B.id,
      boardTitle: B.title,
      theme: B.theme,
      listTitle: L.title,
      roleCode: R.code,
    })
    .from(C)
    .innerJoin(B, eq(B.id, C.boardId))
    .innerJoin(L, eq(L.id, C.listId))
    .leftJoin(R, eq(R.id, C.roleId))
    .where(and(inArray(C.boardId, ids), isNotNull(C.dueDate), eq(C.archived, false)))
    .orderBy(asc(C.dueDate), asc(C.dueTime));
  return rows.map((r) => ({ ...r, dueDate: r.dueDate!, priority: r.priority as Priority, cover: r.cover as CoverColor | null, theme: r.theme as ThemeId }));
}

// ─────────────────────────────── Admin panel ───────────────────────────────
export type AdminData = Awaited<ReturnType<typeof adminData>>;

/** Everything in Krama, for the Krama admin's control panel. Call only after checking the user is the admin. */
export async function adminData() {
  await dbReady;
  const bid = sql.raw('"krama_board"."id"');
  const [boards, members, roleWork, activity, accounts, overdue] = await Promise.all([
    db
      .select({
        id: B.id,
        title: B.title,
        theme: B.theme,
        ownerId: B.userId,
        ownerName: U.name,
        ownerEmail: U.email,
        createdAt: B.createdAt,
        updatedAt: B.updatedAt,
        lists: sql<number>`(select count(*)::int from "krama_list" where "krama_list"."boardId" = ${bid})`,
        cards: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived")`,
        done: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived" and "krama_card"."dueDone")`,
        lastActivity: sql<string | null>`(select to_char(max(a."createdAt"), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from "krama_activity" a where a."boardId" = ${bid})`,
      })
      .from(B)
      .innerJoin(U, eq(U.id, B.userId))
      .orderBy(desc(B.updatedAt)),
    db.select({ id: M.id, boardId: M.boardId, key: M.key, email: M.email, name: M.name, access: M.access, roleIds: M.roleIds, createdAt: M.createdAt }).from(M).orderBy(asc(M.email)),
    db
      .select({
        code: R.code,
        color: R.color,
        open: sql<number>`count(*) filter (where not ${C.dueDone})::int`,
        done: sql<number>`count(*) filter (where ${C.dueDone})::int`,
        overdue: sql<number>`count(*) filter (where not ${C.dueDone} and ${C.dueDate} < to_char(now() at time zone 'Asia/Colombo', 'YYYY-MM-DD'))::int`,
      })
      .from(C)
      .innerJoin(R, eq(R.id, C.roleId))
      .where(eq(C.archived, false))
      .groupBy(R.code, R.color),
    db
      .select({ id: ACT.id, boardId: ACT.boardId, cardId: ACT.cardId, action: ACT.action, createdAt: ACT.createdAt, userName: U.name, userImage: U.image })
      .from(ACT)
      .leftJoin(U, eq(U.id, ACT.userId))
      .orderBy(desc(ACT.createdAt))
      .limit(300),
    accountsByKey(),
    db
      .select({ id: C.id, title: C.title, dueDate: C.dueDate, boardId: C.boardId, roleCode: R.code })
      .from(C)
      .leftJoin(R, eq(R.id, C.roleId))
      .where(and(eq(C.archived, false), eq(C.dueDone, false), isNotNull(C.dueDate), sql`${C.dueDate} < to_char(now() at time zone 'Asia/Colombo', 'YYYY-MM-DD')`))
      .orderBy(asc(C.dueDate))
      .limit(50),
  ]);

  const roleNames = await db.select({ id: R.id, code: R.code, name: R.name, color: R.color, boardId: R.boardId }).from(R).orderBy(asc(R.position));
  const boardTitle = new Map(boards.map((b) => [b.id, b.title]));

  // people = everyone invited anywhere, grouped by email
  const people = new Map<string, { key: string; email: string; name: string; account: { id: string; name: string; image: string | null } | null; boards: { memberId: string; boardId: string; boardTitle: string; access: Access; roles: { code: string; color: LabelColor }[] }[] }>();
  const ownerKeyOf = new Map(boards.map((b) => [b.id, labsKey(b.ownerEmail)]));
  const invited = members.filter((m) => ownerKeyOf.get(m.boardId) !== m.key);
  for (const m of invited) {
    const a = accounts.get(m.key);
    const p = people.get(m.key) ?? { key: m.key, email: m.email, name: m.name, account: a ? { id: a.id, name: a.name, image: a.image } : null, boards: [] };
    if (!p.name && m.name) p.name = m.name;
    p.boards.push({
      memberId: m.id,
      boardId: m.boardId,
      boardTitle: boardTitle.get(m.boardId) ?? 'Board',
      access: m.access === 'full' ? 'full' : 'tick',
      roles: (m.roleIds ?? []).map((id) => roleNames.find((r) => r.id === id)).filter(Boolean).map((r) => ({ code: r!.code, color: r!.color as LabelColor })),
    });
    people.set(m.key, p);
  }

  const rolesByBoard: Record<string, { id: string; code: string; name: string; color: LabelColor }[]> = {};
  for (const r of roleNames) (rolesByBoard[r.boardId] ??= []).push({ id: r.id, code: r.code, name: r.name, color: r.color as LabelColor });

  return {
    rolesByBoard,
    boards: boards.map((b) => ({
      ...b,
      theme: b.theme as ThemeId,
      lists: Number(b.lists),
      cards: Number(b.cards),
      done: Number(b.done),
      members: invited.filter((m) => m.boardId === b.id).length,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    people: [...people.values()],
    roleWork: roleWork.map((r) => ({ code: r.code, color: r.color as LabelColor, open: Number(r.open), done: Number(r.done), overdue: Number(r.overdue) })).sort((a, b) => b.open - a.open),
    activity: activity.map((a) => ({ ...a, boardTitle: boardTitle.get(a.boardId) ?? 'Board', createdAt: a.createdAt.toISOString() })),
    overdue: overdue.map((o) => ({ ...o, dueDate: o.dueDate!, boardTitle: boardTitle.get(o.boardId) ?? 'Board' })),
  };
}
