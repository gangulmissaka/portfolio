import 'server-only';
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { db, dbReady, schema } from '@/lib/db';
import type { SessionUser } from '@/lib/auth';
import type { BoardData, KCard, KComment, LabelColor, Priority, ThemeId, CoverColor } from './model';

const { kramaBoard: B, kramaList: L, kramaCard: C, kramaLabel: LB, kramaComment: CM } = schema;

/** The signed-in user's boards (starred first, then most recently changed), with simple counts for the tiles. */
export async function listBoards(userId: string) {
  await dbReady;
  // the board id is written out in full: in a single-table select Drizzle renders ${B.id} as a bare "id",
  // which inside these subqueries would point at the subquery's own table
  const bid = sql.raw('"krama_board"."id"');
  const rows = await db
    .select({
      id: B.id,
      title: B.title,
      theme: B.theme,
      starred: B.starred,
      updatedAt: B.updatedAt,
      lists: sql<number>`(select count(*)::int from "krama_list" where "krama_list"."boardId" = ${bid})`,
      cards: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived")`,
      open: sql<number>`(select count(*)::int from "krama_card" where "krama_card"."boardId" = ${bid} and not "krama_card"."archived" and "krama_card"."dueDate" is not null and not "krama_card"."dueDone")`,
    })
    .from(B)
    .where(eq(B.userId, userId))
    .orderBy(desc(B.starred), desc(B.updatedAt));
  return rows.map((r) => ({ ...r, theme: r.theme as ThemeId, lists: Number(r.lists), cards: Number(r.cards), open: Number(r.open), updatedAt: r.updatedAt.toISOString() }));
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
  createdAt: c.createdAt.toISOString(),
});

/** One board with everything on it, or null if it doesn't exist or isn't this user's. */
export async function loadBoard(user: SessionUser, boardId: string): Promise<BoardData | null> {
  await dbReady;
  const [board] = await db.select().from(B).where(and(eq(B.id, boardId), eq(B.userId, user.id)));
  if (!board) return null;

  const [boards, lists, cards, labels] = await Promise.all([
    db.select({ id: B.id, title: B.title, theme: B.theme }).from(B).where(eq(B.userId, user.id)).orderBy(desc(B.starred), desc(B.updatedAt)),
    db.select({ id: L.id, title: L.title }).from(L).where(eq(L.boardId, boardId)).orderBy(asc(L.position), asc(L.createdAt)),
    db.select().from(C).where(eq(C.boardId, boardId)).orderBy(asc(C.position), asc(C.createdAt)),
    db.select({ id: LB.id, name: LB.name, color: LB.color }).from(LB).where(eq(LB.boardId, boardId)).orderBy(asc(LB.position)),
  ]);

  const cardIds = cards.map((c) => c.id);
  const comments = cardIds.length
    ? await db
        .select({ id: CM.id, cardId: CM.cardId, body: CM.body, createdAt: CM.createdAt, name: schema.user.name, image: schema.user.image })
        .from(CM)
        .innerJoin(schema.user, eq(schema.user.id, CM.userId))
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
    (byCard[c.cardId] ??= []).push({ id: c.id, cardId: c.cardId, body: c.body, createdAt: c.createdAt.toISOString(), author: { name: c.name, image: c.image } });
  }

  return {
    board: { id: board.id, title: board.title, theme: board.theme as ThemeId, starred: board.starred },
    boards: boards.map((b) => ({ ...b, theme: b.theme as ThemeId })),
    lists,
    order,
    cards: byId,
    labels: labels.map((l) => ({ ...l, color: l.color as LabelColor })),
    comments: byCard,
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
};

/** Every active card with a due date, across all of the user's boards (for the overall calendar and "due soon"). */
export async function dueCards(userId: string): Promise<DueItem[]> {
  await dbReady;
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
    })
    .from(C)
    .innerJoin(B, eq(B.id, C.boardId))
    .innerJoin(L, eq(L.id, C.listId))
    .where(and(eq(B.userId, userId), isNotNull(C.dueDate), eq(C.archived, false)))
    .orderBy(asc(C.dueDate), asc(C.dueTime));
  return rows.map((r) => ({ ...r, dueDate: r.dueDate!, priority: r.priority as Priority, cover: r.cover as CoverColor | null, theme: r.theme as ThemeId }));
}
