'use server';

import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, dbReady, schema } from '@/lib/db';
import { requireLabsAction } from '@/lib/labs';
import { upcomingHolidays } from '@/lib/krama/holidays';
import { addDays, todaySL } from '@/lib/krama/time';
import { COLOR_IDS, DEFAULT_LABELS, LIMITS, PRIORITY_IDS, THEME_IDS, type LabelColor, type Priority, type ThemeId } from '@/lib/krama/model';

/**
 * Krama server actions. The client updates its own state first (optimistic UI) and calls these to persist.
 * Every action: Labs access → the board belongs to the caller → validated input. All writes are also filtered by
 * boardId, so ids from someone else's board can never be touched.
 */

const { kramaBoard: B, kramaList: L, kramaCard: C, kramaLabel: LB, kramaComment: CM } = schema;
export type KramaResult = { ok: true } | { ok: false; error: string };
const fail = (error: string): KramaResult => ({ ok: false, error });
const OK: KramaResult = { ok: true };

const Id = z.uuid();
const Ids = z.array(Id).max(1000);
const ThemeZ = z.enum(THEME_IDS as [ThemeId, ...ThemeId[]]);
const ColorZ = z.enum(COLOR_IDS as [LabelColor, ...LabelColor[]]);
const PriorityZ = z.enum(PRIORITY_IDS as [Priority, ...Priority[]]);
const DateZ = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
const TimeZ = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const text = (max: number) => z.string().trim().min(1, 'Give it a name.').max(max);

const ChecklistZ = z.object({
  id: Id,
  title: z.string().trim().max(LIMITS.checklistTitle),
  items: z.array(z.object({ id: Id, text: z.string().trim().min(1).max(LIMITS.item), done: z.boolean() })).max(LIMITS.items),
});

async function me() {
  const user = await requireLabsAction();
  await dbReady;
  return user;
}

/** Throws unless the board exists and belongs to the user. Also bumps its "last changed" time. */
async function ownBoard(boardId: string, userId: string) {
  const id = Id.parse(boardId);
  const [b] = await db.select({ id: B.id }).from(B).where(and(eq(B.id, id), eq(B.userId, userId)));
  if (!b) throw new Error('Board not found');
  await db.update(B).set({ updatedAt: new Date() }).where(eq(B.id, id));
  return id;
}

async function listOnBoard(listId: string, boardId: string) {
  const [l] = await db.select({ id: L.id }).from(L).where(and(eq(L.id, Id.parse(listId)), eq(L.boardId, boardId)));
  if (!l) throw new Error('List not found');
  return l.id;
}

async function nextCardPosition(listId: string) {
  const [r] = await db.select({ n: sql<number>`coalesce(max("position"), -1)::int + 1` }).from(C).where(eq(C.listId, listId));
  return Number(r?.n ?? 0);
}

/** Sets position = index for the given ids (one statement), optionally moving them all into `listId`. */
async function writeOrder(table: 'krama_card' | 'krama_list', boardId: string, ids: string[], listId?: string) {
  if (!ids.length) return;
  const values = sql.join(ids.map((id, i) => sql`(${id}, ${i})`), sql`, `);
  const t = sql.identifier(table);
  const setList = listId ? sql`, "listId" = ${listId}` : sql``;
  await db.execute(sql`update ${t} set "position" = v.pos::int${setList} from (values ${values}) as v(id, pos) where ${t}."id" = v.id and ${t}."boardId" = ${boardId}`);
}

// ── Boards ──
export async function createBoard(input: { id: string; title: string; theme: string; template: 'blank' | 'basic' | 'sample' }): Promise<KramaResult> {
  const user = await me();
  const p = z.object({ id: Id, title: text(LIMITS.boardTitle), theme: ThemeZ, template: z.enum(['blank', 'basic', 'sample']) }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Check the board details.');
  const { id, title, theme, template } = p.data;

  await db.insert(B).values({ id, userId: user.id, title, theme });
  const labelIds = DEFAULT_LABELS.map(() => crypto.randomUUID());
  await db.insert(LB).values(DEFAULT_LABELS.map((l, i) => ({ id: labelIds[i], boardId: id, name: l.name, color: l.color, position: i })));
  if (template === 'blank') return OK;

  const lists = ['To do', 'Doing', 'Done'].map((t, i) => ({ id: crypto.randomUUID(), boardId: id, title: t, position: i }));
  await db.insert(L).values(lists);
  if (template === 'basic') return OK;

  const today = todaySL();
  const poya = upcomingHolidays(addDays(today, 1), 40).find((h) => h.poya);
  const [work, personal, idea, , , errand] = labelIds; // same order as DEFAULT_LABELS
  const item = (t: string, done = false) => ({ id: crypto.randomUUID(), text: t, done });
  await db.insert(C).values([
    {
      id: crypto.randomUUID(), boardId: id, listId: lists[0].id, position: 0, title: 'Open me to see what a card can hold',
      description: 'Cards can have a description, labels, checklists, a due date, a priority, a cover colour and comments.\n\nClick around, change anything, then delete this card when you are done.',
      labelIds: [idea],
      checklists: [{ id: crypto.randomUUID(), title: 'Try these', items: [item('Drag this card to Doing'), item('Add a label'), item('Set a due date'), item('Tick this item', true)] }],
    },
    ...(poya
      ? [{
          id: crypto.randomUUID(), boardId: id, listId: lists[0].id, position: 1, title: 'Plan around the next Poya day',
          description: `This card is due on ${poya.name}. Poya days and other Sri Lankan public, bank and mercantile holidays are highlighted on the calendar and in the date picker.`,
          dueDate: poya.date, priority: 'medium', labelIds: [errand],
        }]
      : []),
    { id: crypto.randomUUID(), boardId: id, listId: lists[0].id, position: 2, title: 'Press / to search and N to add a card', labelIds: [work] },
    { id: crypto.randomUUID(), boardId: id, listId: lists[1].id, position: 0, title: 'Drag cards between lists', priority: 'high', cover: 'orange', dueDate: addDays(today, 2), labelIds: [idea] },
    { id: crypto.randomUUID(), boardId: id, listId: lists[2].id, position: 0, title: 'Create your first board', dueDate: today, dueDone: true, labelIds: [personal] },
  ]);
  return OK;
}

export async function updateBoard(boardId: string, patch: { title?: string; theme?: string; starred?: boolean }): Promise<KramaResult> {
  const user = await me();
  const id = await ownBoard(boardId, user.id);
  const p = z.object({ title: text(LIMITS.boardTitle), theme: ThemeZ, starred: z.boolean() }).partial().safeParse(patch);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid change.');
  if (Object.keys(p.data).length) await db.update(B).set(p.data).where(eq(B.id, id));
  return OK;
}

export async function deleteBoard(boardId: string): Promise<KramaResult> {
  const user = await me();
  const id = await ownBoard(boardId, user.id);
  await db.delete(B).where(eq(B.id, id)); // lists, cards, labels and comments cascade
  return OK;
}

// ── Lists ──
export async function createList(boardId: string, input: { id: string; title: string; order: string[] }): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const p = z.object({ id: Id, title: text(LIMITS.listTitle), order: Ids }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid list.');
  await db.insert(L).values({ id: p.data.id, boardId: bid, title: p.data.title, position: p.data.order.indexOf(p.data.id) });
  await writeOrder('krama_list', bid, p.data.order);
  return OK;
}

export async function renameList(boardId: string, listId: string, title: string): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const t = text(LIMITS.listTitle).safeParse(title);
  if (!t.success) return fail(t.error.issues[0]?.message ?? 'Invalid name.');
  await db.update(L).set({ title: t.data }).where(and(eq(L.id, Id.parse(listId)), eq(L.boardId, bid)));
  return OK;
}

export async function deleteList(boardId: string, listId: string): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  await db.delete(L).where(and(eq(L.id, Id.parse(listId)), eq(L.boardId, bid)));
  return OK;
}

export async function reorderLists(boardId: string, order: string[]): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  await writeOrder('krama_list', bid, Ids.parse(order));
  return OK;
}

// ── Cards ──
export async function createCard(boardId: string, input: { id: string; listId: string; title: string; dueDate?: string | null; order?: string[] }): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const p = z.object({ id: Id, listId: Id, title: text(LIMITS.title), dueDate: DateZ.nullish(), order: Ids.optional() }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid card.');
  const listId = await listOnBoard(p.data.listId, bid);
  await db.insert(C).values({ id: p.data.id, boardId: bid, listId, title: p.data.title, dueDate: p.data.dueDate ?? null, position: await nextCardPosition(listId) });
  if (p.data.order) await writeOrder('krama_card', bid, p.data.order, listId);
  return OK;
}

const CardPatch = z
  .object({
    title: text(LIMITS.title),
    description: z.string().max(LIMITS.description),
    dueDate: DateZ.nullable(),
    dueTime: TimeZ.nullable(),
    dueDone: z.boolean(),
    priority: PriorityZ,
    cover: ColorZ.nullable(),
    labelIds: z.array(Id).max(50),
    checklists: z.array(ChecklistZ).max(LIMITS.checklists),
    archived: z.boolean(),
  })
  .partial()
  .strict();
export type CardPatchInput = z.input<typeof CardPatch>;

export async function updateCard(boardId: string, cardId: string, patch: CardPatchInput): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const p = CardPatch.safeParse(patch);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid change.');
  const id = Id.parse(cardId);
  const set: Partial<typeof C.$inferInsert> = { ...p.data, updatedAt: new Date() };
  if (p.data.archived === false) {
    // restoring: put it back at the bottom of its list
    const [c] = await db.select({ listId: C.listId }).from(C).where(and(eq(C.id, id), eq(C.boardId, bid)));
    if (c) set.position = await nextCardPosition(c.listId);
  }
  await db.update(C).set(set).where(and(eq(C.id, id), eq(C.boardId, bid)));
  return OK;
}

/** Moves a card into `listId` and saves that list's full card order (which must include the card). */
export async function moveCard(boardId: string, cardId: string, listId: string, order: string[]): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const lid = await listOnBoard(listId, bid);
  const ids = Ids.parse(order);
  if (!ids.includes(Id.parse(cardId))) return fail('Card missing from the new order.');
  await writeOrder('krama_card', bid, ids, lid);
  return OK;
}

export async function deleteCard(boardId: string, cardId: string): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  await db.delete(C).where(and(eq(C.id, Id.parse(cardId)), eq(C.boardId, bid)));
  return OK;
}

// ── Labels ──
export async function saveLabel(boardId: string, input: { id: string; name: string; color: string; position: number }): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const p = z.object({ id: Id, name: z.string().trim().max(LIMITS.label), color: ColorZ, position: z.number().int().min(0).max(100) }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid label.');
  const [existing] = await db.select({ boardId: LB.boardId }).from(LB).where(eq(LB.id, p.data.id));
  if (existing && existing.boardId !== bid) return fail('Label not found.');
  await db
    .insert(LB)
    .values({ ...p.data, boardId: bid })
    .onConflictDoUpdate({ target: LB.id, set: { name: p.data.name, color: p.data.color } });
  return OK;
}

export async function deleteLabel(boardId: string, labelId: string): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const id = Id.parse(labelId);
  await db.delete(LB).where(and(eq(LB.id, id), eq(LB.boardId, bid)));
  // jsonb "-" removes the string from every card's label array
  await db.update(C).set({ labelIds: sql`"labelIds" - ${id}::text` }).where(and(eq(C.boardId, bid), sql`"labelIds" @> jsonb_build_array(${id}::text)`));
  return OK;
}

// ── Comments ──
export async function addComment(boardId: string, input: { id: string; cardId: string; body: string }): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  const p = z.object({ id: Id, cardId: Id, body: z.string().trim().min(1, 'Write something first.').max(LIMITS.comment) }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid comment.');
  const [c] = await db.select({ id: C.id }).from(C).where(and(eq(C.id, p.data.cardId), eq(C.boardId, bid)));
  if (!c) return fail('Card not found.');
  await db.insert(CM).values({ id: p.data.id, cardId: c.id, userId: user.id, body: p.data.body });
  return OK;
}

export async function deleteComment(boardId: string, commentId: string): Promise<KramaResult> {
  const user = await me();
  const bid = await ownBoard(boardId, user.id);
  await db
    .delete(CM)
    .where(and(eq(CM.id, Id.parse(commentId)), eq(CM.userId, user.id), sql`exists(select 1 from "krama_card" where "krama_card"."id" = ${CM.cardId} and "krama_card"."boardId" = ${bid})`));
  return OK;
}
