'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { checklistProgress, COLORS, LIMITS, type BoardData, type KCard, type KLabel, type KList } from '@/lib/krama/model';
import type { BoardApi } from './store';
import { DueBadge, Icon, InlineEdit, LabelChip, Popover, PriorityMark, useIsClient } from './ui';

type Props = {
  data: BoardData;
  api: BoardApi;
  visible: (card: KCard) => boolean;
  filtering: boolean;
  onOpen: (id: string) => void;
  composerFor: string | null;
  setComposerFor: (listId: string | null) => void;
};

/**
 * Lists and cards with drag and drop (dnd-kit): drag a list by its header, drag a card anywhere on it.
 * Mouse drags start after 6 px, touch after a short press (so the board still scrolls), and the keyboard works too
 * (focus a card, Space to pick up, arrows to move, Space to drop).
 */
export function BoardView({ data, api, visible, filtering, onOpen, composerFor, setComposerFor }: Props) {
  const { lists, order, cards, labels, comments } = data;
  const dndId = useId(); // stable ids for dnd-kit's screen-reader hints (server and browser must agree)
  const isClient = useIsClient();
  const [active, setActive] = useState<{ id: string; type: 'list' | 'card' } | null>(null);
  const snapshot = useRef<Record<string, string[]> | null>(null);
  const lastOver = useRef<UniqueIdentifier | null>(null);
  const movedContainer = useRef(false);
  const orderRef = useRef(order);
  useEffect(() => {
    orderRef.current = order;
    movedContainer.current = false;
  }, [order]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    // Space picks up and drops; Enter is left free to open a card
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] } }),
  );

  const listOf = useCallback((id: UniqueIdentifier): string | undefined => {
    const o = orderRef.current;
    if (id in o) return id as string;
    return Object.keys(o).find((k) => o[k].includes(id as string));
  }, []);

  // Cards: prefer the card under the pointer; over an empty part of a list, use the closest card in it (or the list).
  const collision: CollisionDetection = useCallback(
    (args) => {
      if (active?.type === 'list') {
        return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'list') });
      }
      const hits = pointerWithin(args);
      const found = hits.length ? hits : rectIntersection(args);
      let overId = getFirstCollision(found, 'id');
      if (overId != null) {
        const o = orderRef.current;
        if (overId in o) {
          const ids = o[overId as string];
          if (ids.length) {
            const inList = args.droppableContainers.filter((c) => c.id !== overId && ids.includes(c.id as string));
            overId = closestCenter({ ...args, droppableContainers: inList })[0]?.id ?? overId;
          }
        }
        lastOver.current = overId;
        return [{ id: overId }];
      }
      if (movedContainer.current) lastOver.current = active?.id ?? null;
      return lastOver.current ? [{ id: lastOver.current }] : [];
    },
    [active],
  );

  const onDragStart = ({ active: a }: DragStartEvent) => {
    setActive({ id: a.id as string, type: a.data.current?.type });
    snapshot.current = orderRef.current;
  };

  const onDragOver = ({ active: a, over }: DragOverEvent) => {
    if (a.data.current?.type !== 'card' || !over) return;
    const from = listOf(a.id);
    const to = listOf(over.id);
    if (!from || !to || from === to) return;
    const o = orderRef.current;
    const toIds = o[to];
    const overIndex = toIds.indexOf(over.id as string);
    let index = toIds.length;
    if (overIndex >= 0) {
      const below = a.rect.current.translated && a.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      index = overIndex + (below ? 1 : 0);
    }
    movedContainer.current = true;
    const next = { ...o, [from]: o[from].filter((x) => x !== a.id), [to]: [...toIds.slice(0, index), a.id as string, ...toIds.slice(index)] };
    orderRef.current = next;
    api.setOrder(next);
  };

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    const type = a.data.current?.type;
    setActive(null);
    const before = snapshot.current;
    snapshot.current = null;
    if (!over) {
      if (before) api.setOrder(before);
      return;
    }
    if (type === 'list') {
      const ids = lists.map((l) => l.id);
      const to = listOf(over.id) ?? (over.id as string);
      const oldI = ids.indexOf(a.id as string);
      const newI = ids.indexOf(to);
      if (oldI !== newI && newI >= 0) api.reorderLists(arrayMove(ids, oldI, newI));
      return;
    }
    const listId = listOf(a.id);
    if (!listId) return;
    let o = orderRef.current;
    const ids = o[listId];
    const oldI = ids.indexOf(a.id as string);
    const newI = ids.indexOf(over.id as string);
    if (newI >= 0 && oldI !== newI) {
      o = { ...o, [listId]: arrayMove(ids, oldI, newI) };
      orderRef.current = o;
      api.setOrder(o);
    }
    const startList = before ? Object.keys(before).find((k) => before[k].includes(a.id as string)) : undefined;
    const changed = !before || startList !== listId || before[listId].join() !== o[listId].join();
    if (changed) api.commitCardMove(a.id as string, listId, o[listId]);
  };

  const onDragCancel = () => {
    setActive(null);
    if (snapshot.current) api.setOrder(snapshot.current);
    snapshot.current = null;
  };

  const activeCard = active?.type === 'card' ? cards[active.id] : null;
  const activeList = active?.type === 'list' ? lists.find((l) => l.id === active.id) : null;

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
      <div data-lenis-prevent data-board-scroller className="k-scroll flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-[var(--gutter)] pb-4">
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          {lists.map((l) => (
            <ListColumn
              key={l.id}
              list={l}
              ids={order[l.id] ?? []}
              cards={cards}
              labels={labels}
              comments={comments}
              api={api}
              visible={visible}
              filtering={filtering}
              onOpen={onOpen}
              composing={composerFor === l.id}
              setComposing={(on) => setComposerFor(on ? l.id : null)}
            />
          ))}
        </SortableContext>
        <AddList api={api} empty={lists.length === 0} />
      </div>
      {/* portalled so no blurred ancestor (backdrop-filter) can offset the fixed-position overlay */}
      {isClient && createPortal(
      <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {activeCard ? (
          <div className="w-[17rem] rotate-[2.5deg] cursor-grabbing">
            <CardFace card={activeCard} labels={labels} lifted />
          </div>
        ) : activeList ? (
          <div className="w-[17.5rem] rotate-[1.5deg] cursor-grabbing rounded-2xl border border-line-2 bg-ink-2/95 p-3 shadow-2xl shadow-black/60">
            <p className="px-1 font-medium">{activeList.title}</p>
            <p className="mt-2 px-1 text-xs text-mute">{(order[activeList.id] ?? []).length} cards</p>
          </div>
        ) : null}
      </DragOverlay>, document.body)}
    </DndContext>
  );
}

// ─────────────────────────────── List ───────────────────────────────
function ListColumn({
  list,
  ids,
  cards,
  labels,
  comments,
  api,
  visible,
  filtering,
  onOpen,
  composing,
  setComposing,
}: {
  list: KList;
  ids: string[];
  cards: Record<string, KCard>;
  labels: KLabel[];
  comments: BoardData['comments'];
  api: BoardApi;
  visible: (c: KCard) => boolean;
  filtering: boolean;
  onOpen: (id: string) => void;
  composing: boolean;
  setComposing: (on: boolean) => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: list.id, data: { type: 'list' } });
  const [menu, setMenu] = useState(false);
  const shown = ids.filter((id) => cards[id] && visible(cards[id]));
  const hidden = ids.length - shown.length;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`k-list flex max-h-full w-[17.5rem] shrink-0 flex-col rounded-2xl border border-line bg-ink/75 backdrop-blur-xl ${isDragging ? 'opacity-40' : ''}`}
      aria-label={`List: ${list.title}`}
    >
      <header className="relative flex items-start gap-1 p-2 pb-1" {...attributes} {...listeners} style={{ cursor: 'grab' }} aria-roledescription="draggable list">
        <div className="min-w-0 flex-1 px-1 py-1" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <InlineEdit value={list.title} label="List name" maxLength={LIMITS.listTitle} onSave={(t) => api.renameList(list.id, t)} className="w-full text-[0.95rem] font-medium leading-snug" inputClassName="text-[0.95rem] font-medium" />
        </div>
        <span className="mt-1.5 shrink-0 rounded-full bg-ink-3 px-2 py-0.5 font-mono text-[0.65rem] tabular-nums text-mute">{ids.length}</span>
        <div className="relative" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <button type="button" data-popover-trigger onClick={() => setMenu((v) => !v)} className="grid size-8 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label={`Actions for list ${list.title}`} aria-expanded={menu}>
            <Icon name="more" strokeWidth={3} />
          </button>
          <Popover open={menu} onClose={() => setMenu(false)} label="List actions" align="right" className="w-56 p-1.5">
            <MenuItem icon="plus" onClick={() => { setMenu(false); setComposing(true); }}>Add a card</MenuItem>
            <MenuItem icon="clock" onClick={() => {
              setMenu(false);
              const sorted = [...ids].sort((a, b) => (cards[a].dueDate ?? '9999').localeCompare(cards[b].dueDate ?? '9999') || (cards[a].dueTime ?? '99').localeCompare(cards[b].dueTime ?? '99'));
              api.setOrder({ [list.id]: sorted });
              api.commitCardMove(sorted[0], list.id, sorted);
            }} disabled={ids.length < 2}>Sort by due date</MenuItem>
            <MenuItem icon="archive" onClick={() => { setMenu(false); ids.forEach((id) => api.patchCard(id, { archived: true })); }} disabled={!ids.length}>Archive all cards</MenuItem>
            <MenuItem icon="trash" danger onClick={() => {
              setMenu(false);
              if (!ids.length || confirm(`Delete the list "${list.title}" and its ${ids.length} ${ids.length === 1 ? 'card' : 'cards'}? This can't be undone.`)) api.deleteList(list.id);
            }}>Delete list</MenuItem>
          </Popover>
        </div>
      </header>

      <SortableContext items={shown} strategy={verticalListSortingStrategy}>
        <ol data-lenis-prevent className="k-scroll flex min-h-2 flex-col gap-2 overflow-y-auto px-2 pb-1 pt-1">
          {shown.map((id) => (
            <SortableCard key={id} card={cards[id]} labels={labels} commentCount={comments[id]?.length ?? 0} onOpen={onOpen} api={api} />
          ))}
        </ol>
      </SortableContext>
      {filtering && hidden > 0 && <p className="px-3 pb-1 text-[0.7rem] text-mute">{hidden} hidden by filters</p>}

      <div className="p-2 pt-1">
        {composing ? (
          <Composer onAdd={(t) => api.addCard(list.id, t)} onClose={() => setComposing(false)} />
        ) : (
          <button type="button" onClick={() => setComposing(true)} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-mute transition-colors hover:bg-ink-3 hover:text-bone">
            <Icon name="plus" /> Add a card
          </button>
        )}
      </div>
    </section>
  );
}

function MenuItem({ icon, children, onClick, danger = false, disabled = false }: { icon: Parameters<typeof Icon>[0]['name']; children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-35 ${danger ? 'text-red-300 hover:bg-red-500/10' : 'text-bone-2 hover:bg-ink-3 hover:text-bone'}`}>
      <Icon name={icon} /> {children}
    </button>
  );
}
export { MenuItem };

/** Add several cards in a row: Enter adds and keeps the box open, Escape or blur on empty closes it. */
function Composer({ onAdd, onClose }: { onAdd: (title: string) => void; onClose: () => void }) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const add = () => {
    const t = v.trim().slice(0, LIMITS.title);
    if (t) onAdd(t);
    setV('');
    ref.current?.focus();
  };
  return (
    <div>
      <textarea
        ref={ref}
        autoFocus
        rows={2}
        value={v}
        maxLength={LIMITS.title}
        onChange={(e) => setV(e.target.value.replace(/\n/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); add(); }
          if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        }}
        onBlur={() => { if (v.trim()) add(); onClose(); }}
        placeholder="Card title, then Enter"
        aria-label="New card title"
        className="w-full resize-none rounded-xl border border-ember/50 bg-ink-2 px-3 py-2 text-sm shadow-lg shadow-black/30 outline-none placeholder:text-mute"
      />
      <div className="mt-1.5 flex items-center gap-2">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={add} className="h-8 rounded-full bg-bone px-3.5 text-xs font-medium text-ink hover:bg-ember">Add card</button>
        <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label="Close"><Icon name="x" /></button>
      </div>
    </div>
  );
}

function AddList({ api, empty }: { api: BoardApi; empty: boolean }) {
  const [open, setOpen] = useState(empty);
  const [v, setV] = useState('');
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-[17.5rem] shrink-0 items-center gap-2 rounded-2xl border border-dashed border-line-2 bg-ink/30 px-4 text-sm text-bone-2 backdrop-blur-xl transition-colors hover:border-bone hover:bg-ink/60 hover:text-bone">
        <Icon name="plus" /> Add another list
      </button>
    );
  }
  return (
    <form
      className="w-[17.5rem] shrink-0 rounded-2xl border border-line bg-ink/75 p-2 backdrop-blur-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const t = v.trim();
        if (t) api.addList(t.slice(0, LIMITS.listTitle));
        setV('');
      }}
    >
      <input
        autoFocus
        value={v}
        maxLength={LIMITS.listTitle}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } }}
        placeholder={empty ? 'Name your first list, e.g. To do' : 'List name'}
        aria-label="New list name"
        className="h-10 w-full rounded-xl border border-ember/50 bg-ink-2 px-3 text-sm outline-none placeholder:text-mute"
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="submit" className="h-8 rounded-full bg-bone px-3.5 text-xs font-medium text-ink hover:bg-ember">Add list</button>
        {!empty && <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label="Close"><Icon name="x" /></button>}
      </div>
    </form>
  );
}

// ─────────────────────────────── Card ───────────────────────────────
const SortableCard = memo(function SortableCard({ card, labels, commentCount, onOpen, api }: { card: KCard; labels: KLabel[]; commentCount: number; onOpen: (id: string) => void; api: BoardApi }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: card.id, data: { type: 'card', listId: card.listId } });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card.id)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !e.defaultPrevented) onOpen(card.id);
      }}
      aria-roledescription="draggable card"
      aria-label={`${card.title}. Press Enter to open, Space to move.`}
      className={`k-card relative cursor-pointer rounded-xl outline-offset-2 ${isDragging ? 'opacity-30' : ''}`}
    >
      <CardFace card={card} labels={labels} commentCount={commentCount} onToggleDone={() => api.patchCard(card.id, { dueDone: !card.dueDone })} />
    </li>
  );
});

export function CardFace({ card, labels, commentCount = 0, lifted = false, onToggleDone }: { card: KCard; labels: KLabel[]; commentCount?: number; lifted?: boolean; onToggleDone?: () => void }) {
  const cardLabels = card.labelIds.map((id) => labels.find((l) => l.id === id)).filter(Boolean) as KLabel[];
  const prog = checklistProgress(card.checklists);
  const hasMeta = !!(card.dueDate || card.description || prog.total || card.priority !== 'none' || commentCount);
  return (
    <div className={`group overflow-hidden rounded-xl border bg-ink-2 transition-[border-color,box-shadow,transform] duration-300 ${lifted ? 'border-ember/60 shadow-2xl shadow-black/70' : 'border-line hover:border-line-2 hover:shadow-lg hover:shadow-black/40'}`}>
      {card.cover && <div className="h-8" style={{ background: COLORS[card.cover].bg }} aria-hidden />}
      <div className="p-2.5">
        {cardLabels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {cardLabels.map((l) => <LabelChip key={l.id} label={l} />)}
          </div>
        )}
        <p className={`break-words text-sm leading-snug ${card.dueDone ? 'text-bone-2' : ''}`}>{card.title}</p>
        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-mute">
            {card.dueDate && <DueBadge card={card} onToggle={onToggleDone} />}
            <PriorityMark priority={card.priority} />
            {card.description && <span title="Has a description"><Icon name="text" className="size-3.5" /><span className="sr-only">Has a description</span></span>}
            {prog.total > 0 && (
              <span className={`inline-flex items-center gap-1 rounded-md px-1 text-[0.72rem] ${prog.done === prog.total ? 'bg-[#4fbf7a] text-[#06200f]' : ''}`} title="Checklist items">
                <Icon name="checklist" className="size-3.5" /> {prog.done}/{prog.total}
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[0.72rem]" title="Comments">
                <Icon name="comment" className="size-3.5" /> {commentCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
