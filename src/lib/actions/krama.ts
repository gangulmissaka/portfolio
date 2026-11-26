'use server';

import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/lib/db';
import { getLabsUser, requireLabsAction } from '@/lib/labs';
import { labsKey } from '@/lib/labs-key';
import { boardAccess, seedRoles, type BoardAccess } from '@/lib/krama/access';
import { menuBoards, type MenuBoard } from '@/lib/krama/data';
import { upcomingHolidays } from '@/lib/krama/holidays';
import { addDays, todaySL } from '@/lib/krama/time';
import { canTickCard, COLOR_IDS, DEFAULT_LABELS, LIMITS, PRIORITY_IDS, THEME_IDS, type LabelColor, type Priority, type ThemeId } from '@/lib/krama/model';
import type { SessionUser } from '@/lib/auth';

/**
 * Krama server actions. The client updates its own state first (optimistic UI) and calls these to persist.
 * Every action: Labs access → the caller's rights on the board (boardAccess) → validated input. All writes are
 * filtered by boardId, so ids from another board can never be touched. Hiding buttons in the UI is not the security.
 *
 * Rights: "view" (any member), "edit" (owner, Krama admin, full-access members), "own" and "manage" (owner or
 * Krama admin; "manage" covers members and roles). Ticking a card done follows canTickCard().
 */

const { kramaBoard: B, kramaList: L, kramaCard: C, kramaLabel: LB, kramaComment: CM, kramaRole: R, kramaMember: M, kramaActivity: ACT, kramaRevision: RV } = schema;
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
const AccessZ = z.enum(['full', 'tick']);
const text = (max: number) => z.string().trim().min(1, 'Give it a name.').max(max);

const ChecklistZ = z.object({
  id: Id,
  title: z.string().trim().max(LIMITS.checklistTitle),
  items: z.array(z.object({ id: Id, text: z.string().trim().min(1).max(LIMITS.item), done: z.boolean() })).max(LIMITS.items),
});

type Need = 'view' | 'edit' | 'own' | 'manage';
const DENIED: Record<Need, string> = {
  view: 'Board not found.',
  edit: 'You have read and tick access on this board, so you can’t change it.',
  own: 'Only the board owner can do that.',
  manage: 'Only the project owner or the Krama admin can change members and roles.',
};

class Denied extends Error {}

/** Signed-in Labs user + their rights on the board, or a thrown Denied (turned into a toast by `guard`). */
async function access(boardId: string, need: Need): Promise<{ user: SessionUser; acc: BoardAccess }> {
  const user = await requireLabsAction();
  const acc = await boardAccess(user, Id.parse(boardId));
  if (!acc) throw new Denied(DENIED.view);
  const ok = need === 'view' || (need === 'edit' && acc.canEdit) || (need === 'own' && (acc.isOwner || acc.isAdmin)) || (need === 'manage' && acc.canManage);
  if (!ok) throw new Denied(DENIED[need]);
  if (need !== 'view') await db.update(B).set({ updatedAt: new Date() }).where(eq(B.id, acc.boardId));
  return { user, acc };
}

/** Runs an action body; permission problems come back as a friendly result instead of a server error. */
async function guard(fn: () => Promise<KramaResult>): Promise<KramaResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Denied) return fail(e.message);
    if (e instanceof z.ZodError) return fail('That change wasn’t valid.');
    throw e;
  }
}

async function log(boardId: string, userId: string, action: string, cardId?: string | null) {
  await db.insert(ACT).values({ id: crypto.randomUUID(), boardId, userId, cardId: cardId ?? null, action: action.slice(0, 300) });
}
const q = (s: string) => `“${s.length > 60 ? s.slice(0, 59) + '…' : s}”`;

async function listOnBoard(listId: string, boardId: string) {
  const [l] = await db.select({ id: L.id, title: L.title }).from(L).where(and(eq(L.id, Id.parse(listId)), eq(L.boardId, boardId)));
  if (!l) throw new Denied('List not found.');
  return l;
}

async function cardOnBoard(cardId: string, boardId: string) {
  const [c] = await db.select().from(C).where(and(eq(C.id, Id.parse(cardId)), eq(C.boardId, boardId)));
  if (!c) throw new Denied('Card not found.');
  return c;
}

const rolesOf = (boardId: string) => db.select({ id: R.id, code: R.code, name: R.name }).from(R).where(eq(R.boardId, boardId));

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
/** The account menu's project list, fresh each time the menu opens. Empty for anyone without Labs access. */
export async function myMenuBoards(): Promise<MenuBoard[]> {
  const user = await getLabsUser();
  return user ? menuBoards(user) : [];
}

export async function createBoard(input: { id: string; title: string; theme: string; template: 'blank' | 'basic' | 'sample' }): Promise<KramaResult> {
  const user = await requireLabsAction();
  const p = z.object({ id: Id, title: text(LIMITS.boardTitle), theme: ThemeZ, template: z.enum(['blank', 'basic', 'sample']) }).safeParse(input);
  if (!p.success) return fail(p.error.issues[0]?.message ?? 'Check the board details.');
  const { id, title, theme, template } = p.data;

  await db.insert(B).values({ id, userId: user.id, title, theme });
  await seedRoles(id);
  await log(id, user.id, `created the board ${q(title)}`);
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
      description: 'Cards can have a description, labels, checklists, a due date, a priority, a team role, a cover colour and comments.\n\nClick around, change anything, then delete this card when you are done.',
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
    { id: crypto.randomUUID(), boardId: id, listId: lists[2].id, position: 0, title: 'Create your first board', dueDate: today, dueDone: true, doneBy: user.id, doneAt: new Date(), labelIds: [personal] },
  ]);
  return OK;
}

export async function updateBoard(boardId: string, patch: { title?: string; theme?: string; starred?: boolean }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, patch.starred !== undefined ? 'own' : 'edit');
    const p = z.object({ title: text(LIMITS.boardTitle), theme: ThemeZ, starred: z.boolean() }).partial().safeParse(patch);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid change.');
    if (Object.keys(p.data).length) await db.update(B).set(p.data).where(eq(B.id, acc.boardId));
    if (p.data.title) await log(acc.boardId, user.id, `renamed the board to ${q(p.data.title)}`);
    return OK;
  });
}

export async function deleteBoard(boardId: string): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'own');
    await db.delete(B).where(eq(B.id, acc.boardId)); // lists, cards, labels, roles, members, comments, activity cascade
    return OK;
  });
}

// ── Lists ──
export async function createList(boardId: string, input: { id: string; title: string; order: string[] }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const p = z.object({ id: Id, title: text(LIMITS.listTitle), order: Ids }).safeParse(input);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid list.');
    await db.insert(L).values({ id: p.data.id, boardId: acc.boardId, title: p.data.title, position: p.data.order.indexOf(p.data.id) });
    await writeOrder('krama_list', acc.boardId, p.data.order);
    await log(acc.boardId, user.id, `added the list ${q(p.data.title)}`);
    return OK;
  });
}

export async function renameList(boardId: string, listId: string, title: string): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'edit');
    const t = text(LIMITS.listTitle).safeParse(title);
    if (!t.success) return fail(t.error.issues[0]?.message ?? 'Invalid name.');
    await db.update(L).set({ title: t.data }).where(and(eq(L.id, Id.parse(listId)), eq(L.boardId, acc.boardId)));
    return OK;
  });
}

export async function deleteList(boardId: string, listId: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const l = await listOnBoard(listId, acc.boardId);
    await db.delete(L).where(and(eq(L.id, l.id), eq(L.boardId, acc.boardId)));
    await log(acc.boardId, user.id, `deleted the list ${q(l.title)}`);
    return OK;
  });
}

export async function reorderLists(boardId: string, order: string[]): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'edit');
    await writeOrder('krama_list', acc.boardId, Ids.parse(order));
    return OK;
  });
}

// ── Cards ──
export async function createCard(boardId: string, input: { id: string; listId: string; title: string; dueDate?: string | null; order?: string[] }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const p = z.object({ id: Id, listId: Id, title: text(LIMITS.title), dueDate: DateZ.nullish(), order: Ids.optional() }).safeParse(input);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid card.');
    const list = await listOnBoard(p.data.listId, acc.boardId);
    await db.insert(C).values({ id: p.data.id, boardId: acc.boardId, listId: list.id, title: p.data.title, dueDate: p.data.dueDate ?? null, position: await nextCardPosition(list.id) });
    if (p.data.order) await writeOrder('krama_card', acc.boardId, p.data.order, list.id);
    await log(acc.boardId, user.id, `added ${q(p.data.title)} to ${q(list.title)}`, p.data.id);
    return OK;
  });
}

const CardPatch = z
  .object({
    title: text(LIMITS.title),
    description: z.string().max(LIMITS.description),
    dueDate: DateZ.nullable(),
    dueTime: TimeZ.nullable(),
    priority: PriorityZ,
    cover: ColorZ.nullable(),
    labelIds: z.array(Id).max(50),
    checklists: z.array(ChecklistZ).max(LIMITS.checklists),
    archived: z.boolean(),
    roleId: Id.nullable(),
  })
  .partial()
  .strict();
export type CardPatchInput = z.input<typeof CardPatch>;

export async function updateCard(boardId: string, cardId: string, patch: CardPatchInput): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const p = CardPatch.safeParse(patch);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid change.');
    const card = await cardOnBoard(cardId, acc.boardId);
    const set: Partial<typeof C.$inferInsert> = { ...p.data, updatedAt: new Date() };
    if (p.data.roleId) {
      const role = (await rolesOf(acc.boardId)).find((r) => r.id === p.data.roleId);
      if (!role) return fail('That role is not on this board.');
      if (role.id !== card.roleId) await log(acc.boardId, user.id, `gave ${q(card.title)} to ${role.code}`, card.id);
    } else if (p.data.roleId === null && card.roleId) {
      await log(acc.boardId, user.id, `removed the role from ${q(card.title)}`, card.id);
    }
    if (p.data.archived === false && card.archived) set.position = await nextCardPosition(card.listId); // restore at the bottom
    if (p.data.archived !== undefined && p.data.archived !== card.archived) await log(acc.boardId, user.id, `${p.data.archived ? 'archived' : 'restored'} ${q(card.title)}`, card.id);
    await db.update(C).set(set).where(and(eq(C.id, card.id), eq(C.boardId, acc.boardId)));
    return OK;
  });
}

/** Tick a card done (or not). Allowed by role: see canTickCard(). */
export async function setCardDone(boardId: string, cardId: string, done: boolean): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'view');
    const card = await cardOnBoard(cardId, acc.boardId);
    const roles = await rolesOf(acc.boardId);
    if (!canTickCard(acc, card, roles)) {
      const role = roles.find((r) => r.id === card.roleId);
      return fail(role ? `Only people with the ${role.code} role can tick this card.` : 'You can’t tick this card.');
    }
    const d = z.boolean().parse(done);
    const now = new Date();
    // ticking it again closes any open revision request
    const clearRevision = d ? { revisionReason: null, revisionBy: null, revisionAt: null } : {};
    await db.update(C).set({ dueDone: d, doneBy: d ? user.id : null, doneAt: d ? now : null, updatedAt: now, ...clearRevision }).where(and(eq(C.id, card.id), eq(C.boardId, acc.boardId)));
    if (d && card.revisionAt) await db.update(RV).set({ resolvedAt: now }).where(and(eq(RV.cardId, card.id), sql`${RV.resolvedAt} is null`));
    await log(acc.boardId, user.id, `${d ? 'ticked' : 'unticked'} ${q(card.title)}`, card.id);
    return OK;
  });
}

/**
 * Send a finished card back: full access only, a reason is required. Unticks it, marks it for revision (red on the
 * board) and records who did the work, who loses points on the Progress scoreboard.
 */
export async function requestRevision(boardId: string, cardId: string, reason: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const r = z.string().trim().min(3, 'Please give a reason (a few words is enough).').max(LIMITS.revision).safeParse(reason);
    if (!r.success) return fail(r.error.issues[0]?.message ?? 'Please give a reason.');
    const card = await cardOnBoard(cardId, acc.boardId);
    if (!card.dueDone) return fail('Only a ticked (done) card can be sent back for revision.');
    const now = new Date();
    await db.insert(RV).values({ id: crypto.randomUUID(), boardId: acc.boardId, cardId: card.id, byUserId: user.id, targetUserId: card.doneBy, reason: r.data, createdAt: now });
    await db
      .update(C)
      .set({ dueDone: false, doneBy: null, doneAt: null, revisionReason: r.data, revisionBy: user.id, revisionAt: now, updatedAt: now })
      .where(and(eq(C.id, card.id), eq(C.boardId, acc.boardId)));
    await log(acc.boardId, user.id, `sent ${q(card.title)} back for revision: ${r.data}`, card.id);
    return OK;
  });
}

/** Tick a checklist item. Full access may tick any; read-and-tick members only on cards for their roles. */
export async function setChecklistItem(boardId: string, cardId: string, checklistId: string, itemId: string, done: boolean): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'view');
    const card = await cardOnBoard(cardId, acc.boardId);
    if (!acc.canEdit && !canTickCard(acc, card, await rolesOf(acc.boardId))) return fail('You can only tick items on cards for your roles.');
    const [cid, iid, d] = [Id.parse(checklistId), Id.parse(itemId), z.boolean().parse(done)];
    const checklists = (card.checklists ?? []).map((cl) => (cl.id === cid ? { ...cl, items: cl.items.map((i) => (i.id === iid ? { ...i, done: d } : i)) } : cl));
    await db.update(C).set({ checklists, updatedAt: new Date() }).where(and(eq(C.id, card.id), eq(C.boardId, acc.boardId)));
    return OK;
  });
}

/** Moves a card into `listId` and saves that list's full card order (which must include the card). */
export async function moveCard(boardId: string, cardId: string, listId: string, order: string[]): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const list = await listOnBoard(listId, acc.boardId);
    const card = await cardOnBoard(cardId, acc.boardId);
    const ids = Ids.parse(order);
    if (!ids.includes(card.id)) return fail('Card missing from the new order.');
    await writeOrder('krama_card', acc.boardId, ids, list.id);
    if (card.listId !== list.id) await log(acc.boardId, user.id, `moved ${q(card.title)} to ${q(list.title)}`, card.id);
    return OK;
  });
}

export async function deleteCard(boardId: string, cardId: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const card = await cardOnBoard(cardId, acc.boardId);
    await db.delete(C).where(and(eq(C.id, card.id), eq(C.boardId, acc.boardId)));
    await log(acc.boardId, user.id, `deleted ${q(card.title)}`);
    return OK;
  });
}

// ── Labels ──
export async function saveLabel(boardId: string, input: { id: string; name: string; color: string; position: number }): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'edit');
    const p = z.object({ id: Id, name: z.string().trim().max(LIMITS.label), color: ColorZ, position: z.number().int().min(0).max(100) }).safeParse(input);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid label.');
    const [existing] = await db.select({ boardId: LB.boardId }).from(LB).where(eq(LB.id, p.data.id));
    if (existing && existing.boardId !== acc.boardId) return fail('Label not found.');
    await db.insert(LB).values({ ...p.data, boardId: acc.boardId }).onConflictDoUpdate({ target: LB.id, set: { name: p.data.name, color: p.data.color } });
    return OK;
  });
}

export async function deleteLabel(boardId: string, labelId: string): Promise<KramaResult> {
  return guard(async () => {
    const { acc } = await access(boardId, 'edit');
    const id = Id.parse(labelId);
    await db.delete(LB).where(and(eq(LB.id, id), eq(LB.boardId, acc.boardId)));
    // jsonb "-" removes the string from every card's label array
    await db.update(C).set({ labelIds: sql`"labelIds" - ${id}::text` }).where(and(eq(C.boardId, acc.boardId), sql`"labelIds" @> jsonb_build_array(${id}::text)`));
    return OK;
  });
}

// ── Comments (full access) ──
export async function addComment(boardId: string, input: { id: string; cardId: string; body: string }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'edit');
    const p = z.object({ id: Id, cardId: Id, body: z.string().trim().min(1, 'Write something first.').max(LIMITS.comment) }).safeParse(input);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid comment.');
    const card = await cardOnBoard(p.data.cardId, acc.boardId);
    await db.insert(CM).values({ id: p.data.id, cardId: card.id, userId: user.id, body: p.data.body });
    return OK;
  });
}

export async function deleteComment(boardId: string, commentId: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'view');
    // your own comments, or any comment if you own/administer the board
    const mine = acc.isOwner || acc.isAdmin ? sql`true` : eq(CM.userId, user.id);
    await db.delete(CM).where(and(eq(CM.id, Id.parse(commentId)), mine, sql`exists(select 1 from "krama_card" where "krama_card"."id" = ${CM.cardId} and "krama_card"."boardId" = ${acc.boardId})`));
    return OK;
  });
}

// ── Roles (Krama admin only) ──
const RoleZ = z.object({
  id: Id,
  code: z.string().trim().min(1, 'Give the role a short code, e.g. PM.').max(LIMITS.roleCode, `Codes are at most ${LIMITS.roleCode} characters.`).transform((s) => s.toUpperCase()),
  name: z.string().trim().max(LIMITS.roleName),
  color: ColorZ,
});

export async function saveRole(boardId: string, input: { id: string; code: string; name: string; color: string }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const p = RoleZ.safeParse(input);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid role.');
    const roles = await db.select({ id: R.id, code: R.code, position: R.position }).from(R).where(eq(R.boardId, acc.boardId));
    if (roles.some((r) => r.code === p.data.code && r.id !== p.data.id)) return fail(`There is already a ${p.data.code} role.`);
    const [other] = await db.select({ boardId: R.boardId }).from(R).where(eq(R.id, p.data.id));
    if (other && other.boardId !== acc.boardId) return fail('Role not found.');
    const isNew = !other;
    await db
      .insert(R)
      .values({ ...p.data, boardId: acc.boardId, position: roles.length })
      .onConflictDoUpdate({ target: R.id, set: { code: p.data.code, name: p.data.name, color: p.data.color } });
    if (isNew) await log(acc.boardId, user.id, `added the role ${p.data.code}`);
    return OK;
  });
}

export async function deleteRole(boardId: string, roleId: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const id = Id.parse(roleId);
    const [role] = await db.select({ code: R.code }).from(R).where(and(eq(R.id, id), eq(R.boardId, acc.boardId)));
    if (!role) return fail('Role not found.');
    await db.delete(R).where(eq(R.id, id));
    await db.update(C).set({ roleId: null }).where(and(eq(C.boardId, acc.boardId), eq(C.roleId, id)));
    await db.update(M).set({ roleIds: sql`"roleIds" - ${id}::text` }).where(and(eq(M.boardId, acc.boardId), sql`"roleIds" @> jsonb_build_array(${id}::text)`));
    await log(acc.boardId, user.id, `deleted the role ${role.code}`);
    return OK;
  });
}

// ── People search for "Add members" (owner or Krama admin) ──
export type PersonHit = { id: string; name: string; email: string; image: string | null; onBoard: boolean };
export type PeopleResult = { ok: true; people: PersonHit[] } | { ok: false; error: string };

/**
 * Accounts the caller can add to this board, matching `query` (name or email).
 * The Krama admin searches everyone who has signed in to the site. Other owners only see people who already use
 * Labs or Krama (approved for Labs, on a board, or owning one), so they can't browse the site's other accounts.
 */
export async function searchPeople(boardId: string, query: string): Promise<PeopleResult> {
  try {
    const { user, acc } = await access(boardId, 'manage');
    const q = z.string().trim().max(80).parse(query).toLowerCase();
    const [users, banned, members, labs, owners, board] = await Promise.all([
      db.select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, image: schema.user.image }).from(schema.user).limit(5000),
      db.select({ id: schema.userBan.userId }).from(schema.userBan),
      db.select({ key: M.key, boardId: M.boardId }).from(M),
      db.select({ key: schema.labsAccess.key }).from(schema.labsAccess),
      db.select({ userId: B.userId }).from(B),
      db.select({ userId: B.userId }).from(B).where(eq(B.id, acc.boardId)),
    ]);
    const bannedIds = new Set(banned.map((b) => b.id));
    const onBoard = new Set(members.filter((m) => m.boardId === acc.boardId).map((m) => m.key));
    const known = new Set([...members.map((m) => m.key), ...labs.map((l) => l.key)]);
    const ownerIds = new Set(owners.map((o) => o.userId));
    const people = users
      .filter((u) => !bannedIds.has(u.id) && u.id !== user.id && u.id !== board[0]?.userId)
      .filter((u) => user.isAdmin || known.has(labsKey(u.email)) || ownerIds.has(u.id))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map((u) => ({ id: u.id, name: u.name, email: u.email, image: u.image, onBoard: onBoard.has(labsKey(u.email)) }))
      .sort((a, b) => Number(a.onBoard) - Number(b.onBoard) || a.name.localeCompare(b.name))
      .slice(0, 25);
    return { ok: true, people };
  } catch (e) {
    if (e instanceof Denied) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: 'Search is too long.' };
    throw e;
  }
}

// ── Members (owner or Krama admin) ──
async function validRoleIds(boardId: string, ids: string[]) {
  const roles = await rolesOf(boardId);
  return ids.filter((id) => roles.some((r) => r.id === id));
}

export async function addMember(boardId: string, input: { id: string; email: string; name: string; access: string; roleIds: string[] }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const p = z
      .object({ id: Id, email: z.email('That doesn’t look like an email address.').max(160), name: z.string().trim().max(LIMITS.memberName), access: AccessZ, roleIds: Ids })
      .safeParse({ ...input, email: input.email.trim().toLowerCase() });
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Check the member details.');
    const key = labsKey(p.data.email);
    const [owner] = await db.select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.id, acc.ownerId));
    if (owner && labsKey(owner.email) === key) return fail('That is the creator of this project. Give them roles on their own row instead.');
    const [dupe] = await db.select({ email: M.email }).from(M).where(and(eq(M.boardId, acc.boardId), eq(M.key, key)));
    if (dupe) return fail(`${dupe.email} is already on this board.`);
    await db.insert(M).values({ id: p.data.id, boardId: acc.boardId, key, email: p.data.email, name: p.data.name, access: p.data.access, roleIds: await validRoleIds(acc.boardId, p.data.roleIds) });
    await log(acc.boardId, user.id, `added ${p.data.name || p.data.email} (${p.data.access === 'full' ? 'full access' : 'read and tick'})`);
    return OK;
  });
}

export async function updateMember(boardId: string, memberId: string, patch: { name?: string; access?: string; roleIds?: string[] }): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const p = z.object({ name: z.string().trim().max(LIMITS.memberName), access: AccessZ, roleIds: Ids }).partial().strict().safeParse(patch);
    if (!p.success) return fail(p.error.issues[0]?.message ?? 'Invalid change.');
    const id = Id.parse(memberId);
    const [m] = await db.select().from(M).where(and(eq(M.id, id), eq(M.boardId, acc.boardId)));
    if (!m) return fail('Member not found.');
    const set = { ...p.data, ...(p.data.roleIds && { roleIds: await validRoleIds(acc.boardId, p.data.roleIds) }) };
    await db.update(M).set(set).where(eq(M.id, id));
    if (p.data.access && p.data.access !== m.access) await log(acc.boardId, user.id, `changed ${m.name || m.email} to ${p.data.access === 'full' ? 'full access' : 'read and tick'}`);
    if (p.data.roleIds) {
      const roles = await rolesOf(acc.boardId);
      const codes = set.roleIds!.map((rid) => roles.find((r) => r.id === rid)?.code).filter(Boolean);
      if (set.roleIds!.join() !== (m.roleIds ?? []).join()) await log(acc.boardId, user.id, `set ${m.name || m.email}’s roles to ${codes.join(', ') || 'none'}`);
    }
    return OK;
  });
}

/** Roles for the project's creator (so they can be scored on Progress). Stored as a member row for their email. */
export async function setOwnerRoles(boardId: string, roleIds: string[]): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const ids = await validRoleIds(acc.boardId, Ids.parse(roleIds));
    const [owner] = await db.select({ email: schema.user.email, name: schema.user.name }).from(schema.user).where(eq(schema.user.id, acc.ownerId));
    if (!owner) return fail('Creator not found.');
    const key = labsKey(owner.email);
    await db
      .insert(M)
      .values({ id: crypto.randomUUID(), boardId: acc.boardId, key, email: owner.email.toLowerCase(), name: owner.name, access: 'full', roleIds: ids })
      .onConflictDoUpdate({ target: [M.boardId, M.key], set: { roleIds: ids } });
    const roles = await rolesOf(acc.boardId);
    await log(acc.boardId, user.id, `set the creator’s roles to ${ids.map((rid) => roles.find((r) => r.id === rid)?.code).filter(Boolean).join(', ') || 'none'}`);
    return OK;
  });
}

export async function removeMember(boardId: string, memberId: string): Promise<KramaResult> {
  return guard(async () => {
    const { user, acc } = await access(boardId, 'manage');
    const id = Id.parse(memberId);
    const [m] = await db.select({ email: M.email, name: M.name }).from(M).where(and(eq(M.id, id), eq(M.boardId, acc.boardId)));
    if (!m) return fail('Member not found.');
    await db.delete(M).where(eq(M.id, id));
    await log(acc.boardId, user.id, `removed ${m.name || m.email} from the board`);
    return OK;
  });
}
