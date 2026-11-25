'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as A from '@/lib/actions/krama';
import type { KramaResult } from '@/lib/actions/krama';
import { uid, type BoardData, type KBoard, type KCard, type KComment, type KLabel, type KList, type KMember, type KRole } from '@/lib/krama/model';

/**
 * Board state for the client. Every change is applied locally first (so the UI never waits on the network) and
 * then persisted with a server action. Server actions from one page run one after another, so saves land in the
 * order they were made. If a save fails, the user gets a toast and the board reloads from the server.
 */

/** Fields a full-access person edits. Ticking done goes through setDone (it has its own permission rule). */
export type CardPatch = Partial<Omit<KCard, 'id' | 'listId' | 'createdAt' | 'dueDone' | 'doneBy' | 'doneAt'>>;

type Act =
  | { t: 'reset'; data: BoardData }
  | { t: 'board'; patch: Partial<KBoard> }
  | { t: 'list/add'; list: KList; index: number }
  | { t: 'list/rename'; id: string; title: string }
  | { t: 'list/delete'; id: string }
  | { t: 'list/order'; ids: string[] }
  | { t: 'card/add'; card: KCard; index?: number }
  | { t: 'card/patch'; id: string; patch: Partial<KCard> }
  | { t: 'card/place'; id: string; listId: string; order: string[] }
  | { t: 'card/delete'; id: string }
  | { t: 'order'; order: Record<string, string[]> }
  | { t: 'label/save'; label: KLabel }
  | { t: 'label/delete'; id: string }
  | { t: 'comment/add'; comment: KComment }
  | { t: 'comment/delete'; cardId: string; id: string }
  | { t: 'role/save'; role: KRole }
  | { t: 'role/delete'; id: string }
  | { t: 'member/save'; member: KMember }
  | { t: 'member/delete'; id: string };

const without = (ids: string[], id: string) => ids.filter((x) => x !== id);

function reducer(s: BoardData, a: Act): BoardData {
  switch (a.t) {
    case 'reset':
      return a.data;
    case 'board':
      return { ...s, board: { ...s.board, ...a.patch } };
    case 'list/add': {
      const lists = [...s.lists];
      lists.splice(a.index, 0, a.list);
      return { ...s, lists, order: { ...s.order, [a.list.id]: [] } };
    }
    case 'list/rename':
      return { ...s, lists: s.lists.map((l) => (l.id === a.id ? { ...l, title: a.title } : l)) };
    case 'list/delete': {
      const cards = Object.fromEntries(Object.entries(s.cards).filter(([, c]) => c.listId !== a.id));
      const { [a.id]: _gone, ...order } = s.order;
      void _gone;
      return { ...s, lists: s.lists.filter((l) => l.id !== a.id), cards, order };
    }
    case 'list/order':
      return { ...s, lists: a.ids.map((id) => s.lists.find((l) => l.id === id)!).filter(Boolean) };
    case 'card/add': {
      const ids = [...(s.order[a.card.listId] ?? [])];
      ids.splice(a.index ?? ids.length, 0, a.card.id);
      return { ...s, cards: { ...s.cards, [a.card.id]: a.card }, order: { ...s.order, [a.card.listId]: ids } };
    }
    case 'card/patch': {
      const prev = s.cards[a.id];
      if (!prev) return s;
      const next = { ...prev, ...a.patch };
      let order = s.order;
      if (a.patch.archived === true && !prev.archived) order = { ...order, [prev.listId]: without(order[prev.listId] ?? [], a.id) };
      if (a.patch.archived === false && prev.archived) order = { ...order, [prev.listId]: [...without(order[prev.listId] ?? [], a.id), a.id] };
      return { ...s, cards: { ...s.cards, [a.id]: next }, order };
    }
    case 'card/place': {
      const prev = s.cards[a.id];
      if (!prev) return s;
      const order = { ...s.order };
      for (const k of Object.keys(order)) if (k !== a.listId && order[k].includes(a.id)) order[k] = without(order[k], a.id);
      order[a.listId] = a.order;
      return { ...s, cards: { ...s.cards, [a.id]: { ...prev, listId: a.listId } }, order };
    }
    case 'card/delete': {
      const prev = s.cards[a.id];
      if (!prev) return s;
      const { [a.id]: _gone, ...cards } = s.cards;
      void _gone;
      return { ...s, cards, order: { ...s.order, [prev.listId]: without(s.order[prev.listId] ?? [], a.id) } };
    }
    case 'order': {
      // used while dragging and sorting (merged over the current order): keep each card's listId in step too
      const cards = { ...s.cards };
      for (const [listId, ids] of Object.entries(a.order)) for (const id of ids) if (cards[id] && cards[id].listId !== listId) cards[id] = { ...cards[id], listId };
      return { ...s, order: { ...s.order, ...a.order }, cards };
    }
    case 'label/save': {
      const exists = s.labels.some((l) => l.id === a.label.id);
      return { ...s, labels: exists ? s.labels.map((l) => (l.id === a.label.id ? a.label : l)) : [...s.labels, a.label] };
    }
    case 'label/delete': {
      const cards = Object.fromEntries(Object.entries(s.cards).map(([id, c]) => [id, c.labelIds.includes(a.id) ? { ...c, labelIds: without(c.labelIds, a.id) } : c]));
      return { ...s, labels: s.labels.filter((l) => l.id !== a.id), cards };
    }
    case 'comment/add':
      return { ...s, comments: { ...s.comments, [a.comment.cardId]: [a.comment, ...(s.comments[a.comment.cardId] ?? [])] } };
    case 'comment/delete':
      return { ...s, comments: { ...s.comments, [a.cardId]: (s.comments[a.cardId] ?? []).filter((c) => c.id !== a.id) } };
    case 'role/save': {
      const exists = s.roles.some((r) => r.id === a.role.id);
      return { ...s, roles: exists ? s.roles.map((r) => (r.id === a.role.id ? a.role : r)) : [...s.roles, a.role] };
    }
    case 'role/delete': {
      const cards = Object.fromEntries(Object.entries(s.cards).map(([id, c]) => [id, c.roleId === a.id ? { ...c, roleId: null } : c]));
      const members = s.members.map((m) => ({ ...m, roleIds: without(m.roleIds, a.id) }));
      return { ...s, roles: s.roles.filter((r) => r.id !== a.id), cards, members };
    }
    case 'member/save': {
      const exists = s.members.some((m) => m.id === a.member.id);
      return { ...s, members: exists ? s.members.map((m) => (m.id === a.member.id ? a.member : m)) : [...s.members, a.member] };
    }
    case 'member/delete':
      return { ...s, members: s.members.filter((m) => m.id !== a.id) };
  }
}

export type Toast = { id: number; text: string; tone: 'error' | 'info'; undo?: () => void };

export function useBoard(initial: BoardData) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);

  // fresh server data (after router.refresh()) replaces local state
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    dispatch({ t: 'reset', data: initial });
  }

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info', undo?: () => void) => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), undo ? 6000 : 4200);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // saves still in flight: background refresh waits for zero so it never overwrites a change being saved
  const pending = useRef(0);
  const save = useCallback(
    (p: Promise<KramaResult>) => {
      pending.current++;
      p.finally(() => { pending.current--; }).catch(() => {}); // failures are handled just below
      p.then((r) => {
        if (!r.ok) {
          toast(r.error, 'error');
          router.refresh();
        }
      }).catch(() => {
        toast('That change could not be saved. Reloading the board.', 'error');
        router.refresh();
      });
    },
    [router, toast],
  );

  const boardId = state.board.id;
  // the latest state for callbacks that need to read it without re-creating the API
  const ref = useRef(state);
  useEffect(() => {
    ref.current = state;
  });

  const api = useMemo(
    () => ({
      // board
      patchBoard(patch: Partial<Pick<KBoard, 'title' | 'theme' | 'starred'>>) {
        dispatch({ t: 'board', patch });
        save(A.updateBoard(boardId, patch));
      },
      // lists
      addList(title: string) {
        const list = { id: uid(), title };
        const index = ref.current.lists.length;
        dispatch({ t: 'list/add', list, index });
        save(A.createList(boardId, { id: list.id, title, order: [...ref.current.lists.map((l) => l.id), list.id] }));
        return list.id;
      },
      renameList(id: string, title: string) {
        dispatch({ t: 'list/rename', id, title });
        save(A.renameList(boardId, id, title));
      },
      deleteList(id: string) {
        dispatch({ t: 'list/delete', id });
        save(A.deleteList(boardId, id));
      },
      reorderLists(ids: string[]) {
        dispatch({ t: 'list/order', ids });
        save(A.reorderLists(boardId, ids));
      },
      // cards
      addCard(listId: string, title: string, extra: { dueDate?: string | null; top?: boolean } = {}) {
        const card: KCard = {
          id: uid(), listId, title, description: '', dueDate: extra.dueDate ?? null, dueTime: null, dueDone: false, priority: 'none',
          cover: null, labelIds: [], checklists: [], archived: false, roleId: null, doneBy: null, doneAt: null, createdAt: new Date().toISOString(),
        };
        dispatch({ t: 'card/add', card, index: extra.top ? 0 : undefined });
        const order = extra.top ? [card.id, ...(ref.current.order[listId] ?? [])] : undefined;
        save(A.createCard(boardId, { id: card.id, listId, title, dueDate: card.dueDate, order }));
        return card.id;
      },
      patchCard(id: string, patch: CardPatch) {
        dispatch({ t: 'card/patch', id, patch });
        save(A.updateCard(boardId, id, patch));
      },
      /** Tick a card done (server checks the role rule). */
      setDone(id: string, done: boolean) {
        dispatch({ t: 'card/patch', id, patch: { dueDone: done, doneBy: done ? ref.current.me.id : null, doneAt: done ? new Date().toISOString() : null } });
        save(A.setCardDone(boardId, id, done));
      },
      /** Tick one checklist item. */
      setItem(cardId: string, checklistId: string, itemId: string, done: boolean) {
        const card = ref.current.cards[cardId];
        if (!card) return;
        const checklists = card.checklists.map((cl) => (cl.id === checklistId ? { ...cl, items: cl.items.map((i) => (i.id === itemId ? { ...i, done } : i)) } : cl));
        dispatch({ t: 'card/patch', id: cardId, patch: { checklists } });
        save(A.setChecklistItem(boardId, cardId, checklistId, itemId, done));
      },
      /** Put a card into `listId` at `index` (end when omitted) and save that list's order. */
      placeCard(id: string, listId: string, index?: number) {
        const ids = without(ref.current.order[listId] ?? [], id);
        ids.splice(index ?? ids.length, 0, id);
        dispatch({ t: 'card/place', id, listId, order: ids });
        save(A.moveCard(boardId, id, listId, ids));
      },
      /** Persist a drag (or sort) that already updated the local order; `order` is the list's final card order. */
      commitCardMove(id: string, listId: string, order: string[]) {
        save(A.moveCard(boardId, id, listId, order));
      },
      setOrder(order: Record<string, string[]>) {
        dispatch({ t: 'order', order });
      },
      deleteCard(id: string) {
        dispatch({ t: 'card/delete', id });
        save(A.deleteCard(boardId, id));
      },
      // labels
      saveLabel(label: KLabel) {
        const at = ref.current.labels.findIndex((l) => l.id === label.id);
        dispatch({ t: 'label/save', label });
        save(A.saveLabel(boardId, { ...label, position: at >= 0 ? at : ref.current.labels.length }));
      },
      deleteLabel(id: string) {
        dispatch({ t: 'label/delete', id });
        save(A.deleteLabel(boardId, id));
      },
      // comments
      addComment(cardId: string, body: string) {
        const me = ref.current.me;
        const comment: KComment = { id: uid(), cardId, body, createdAt: new Date().toISOString(), authorId: me.id, author: { name: me.name, image: me.image } };
        dispatch({ t: 'comment/add', comment });
        save(A.addComment(boardId, { id: comment.id, cardId, body }));
      },
      deleteComment(cardId: string, id: string) {
        dispatch({ t: 'comment/delete', cardId, id });
        save(A.deleteComment(boardId, id));
      },
      // roles and members (Krama admin)
      saveRole(role: KRole) {
        const r = { ...role, code: role.code.trim().toUpperCase() };
        dispatch({ t: 'role/save', role: r });
        save(A.saveRole(boardId, r));
      },
      deleteRole(id: string) {
        dispatch({ t: 'role/delete', id });
        save(A.deleteRole(boardId, id));
      },
      addMember(input: { email: string; name: string; access: KMember['access']; roleIds: string[] }) {
        const member: KMember = { id: uid(), email: input.email.trim().toLowerCase(), name: input.name.trim(), access: input.access, roleIds: input.roleIds, account: null };
        dispatch({ t: 'member/save', member });
        // reload after a successful add so the member's account (name, photo, signed-in status) shows straight away
        save(A.addMember(boardId, { id: member.id, email: member.email, name: member.name, access: member.access, roleIds: member.roleIds }).then((r) => {
          if (r.ok) router.refresh();
          return r;
        }));
      },
      updateMember(id: string, patch: Partial<Pick<KMember, 'name' | 'access' | 'roleIds'>>) {
        const m = ref.current.members.find((x) => x.id === id);
        if (!m) return;
        dispatch({ t: 'member/save', member: { ...m, ...patch } });
        save(A.updateMember(boardId, id, patch));
      },
      removeMember(id: string) {
        dispatch({ t: 'member/delete', id });
        save(A.removeMember(boardId, id));
      },
    }),
    [boardId, save, router],
  );

  const isIdle = useCallback(() => pending.current === 0, []);
  return { state, api, toasts, toast, dismiss, isIdle };
}

export type BoardApi = ReturnType<typeof useBoard>['api'];
