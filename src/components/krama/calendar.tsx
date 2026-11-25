'use client';

import { DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import Link from 'next/link';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HOLIDAY_YEARS, holidaysInMonth, holidaysOn, type Holiday } from '@/lib/krama/holidays';
import { COLORS, PRIORITIES, type CoverColor, type Priority } from '@/lib/krama/model';
import { SL_LABEL, addDays, formatLong, formatMonth, formatTime, isWeekend, monthGrid, parts, shiftMonth, todaySL, weekdayMon0 } from '@/lib/krama/time';
import { Icon, useIsClient } from './ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Today in Sri Lanka, kept current (rolls over at SLST midnight even if the tab stays open). */
export function useTodaySL() {
  const [today, setToday] = useState(todaySL);
  useEffect(() => {
    const id = setInterval(() => setToday(todaySL()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

/** The next day that is not a weekend, Poya or public holiday. */
export function nextWorkingDay(from: string) {
  let d = addDays(from, 1);
  while (isWeekend(d) || holidaysOn(d).length) d = addDays(d, 1);
  return d;
}

const dataNote = (year: number) =>
  HOLIDAY_YEARS.official.includes(year)
    ? 'Official gazetted list'
    : HOLIDAY_YEARS.estimated.includes(year)
      ? 'Estimated dates (no official list loaded)'
      : 'No holiday data for this year';

export function Legend({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-bone-2 ${className}`}>
      <li className="flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded bg-[#e9d58a]/15 text-[#e9d58a]"><Icon name="moon" className="size-3" /></span>Poya day</li>
      <li className="flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded bg-[#ff8f8f]/15 text-[#ff8f8f]"><Icon name="flag" className="size-2.5" /></span>Public &amp; bank holiday</li>
      <li className="flex items-center gap-1.5"><span className="rounded bg-[#5fd0e6]/15 px-1 font-mono text-[0.6rem] font-semibold text-[#5fd0e6]">M</span>Mercantile holiday</li>
      <li className="flex items-center gap-1.5"><span className="size-3 rounded-full ring-2 ring-ember" />Today ({SL_LABEL})</li>
    </ul>
  );
}

function dayTint(date: string) {
  const hs = holidaysOn(date);
  if (!hs.length) return null;
  return hs.some((h) => h.poya) ? 'poya' : 'public';
}

// ─────────────────────────────── Date picker ───────────────────────────────
export function DatePicker({
  date,
  time,
  onSave,
  onRemove,
}: {
  date: string | null;
  time: string | null;
  onSave: (date: string, time: string | null) => void;
  onRemove?: () => void;
}) {
  const today = useTodaySL();
  const [sel, setSel] = useState(date ?? today);
  const [t, setT] = useState(time ?? '');
  const [withTime, setWithTime] = useState(!!time);
  const [view, setView] = useState<{ year: number; month: number }>(() => parts(date ?? today));
  const grid = monthGrid(view.year, view.month);
  const hol = holidaysOn(sel);
  const go = (by: number) => setView((v) => shiftMonth(v.year, v.month, by));
  const pick = (d: string) => {
    setSel(d);
    const p = parts(d);
    if (p.month !== view.month || p.year !== view.year) setView(p);
  };

  return (
    <div className="text-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => go(-1)} className="grid size-8 place-items-center rounded-full hover:bg-ink-3" aria-label="Previous month"><Icon name="back" /></button>
        <p className="font-medium">{formatMonth(view.year, view.month)}</p>
        <button type="button" onClick={() => go(1)} className="grid size-8 place-items-center rounded-full hover:bg-ink-3" aria-label="Next month"><Icon name="next" /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.65rem] uppercase tracking-wider text-mute">
        {WEEKDAYS.map((w) => <span key={w} className="py-1">{w.slice(0, 2)}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={formatMonth(view.year, view.month)}>
        {grid.map((d) => {
          const inMonth = parts(d).month === view.month;
          const tint = dayTint(d);
          const selected = d === sel;
          const isToday = d === today;
          const hs = holidaysOn(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => pick(d)}
              title={hs.map((h) => h.name).join(' / ') || undefined}
              aria-pressed={selected}
              aria-label={`${formatLong(d)}${hs.length ? `, ${hs.map((h) => h.name).join(' and ')}` : ''}`}
              className={`relative grid aspect-square place-items-center rounded-lg text-[0.8rem] tabular-nums transition-colors ${
                selected
                  ? 'bg-ember font-semibold text-ink'
                  : tint === 'poya'
                    ? 'bg-[#e9d58a]/12 text-[#f3e3a1] hover:bg-[#e9d58a]/25'
                    : tint === 'public'
                      ? 'bg-[#ff8f8f]/10 text-[#ffb3b3] hover:bg-[#ff8f8f]/20'
                      : 'hover:bg-ink-3'
              } ${!inMonth ? 'opacity-35' : ''} ${!selected && !tint && isWeekend(d) ? 'text-mute' : ''} ${isToday && !selected ? 'ring-1 ring-ember' : ''}`}
            >
              {parts(d).day}
              {tint === 'poya' && !selected && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#e9d58a]" aria-hidden />}
              {hs.some((h) => h.mercantile) && !selected && <span className="absolute bottom-0.5 left-1/2 h-0.5 w-2.5 -translate-x-1/2 rounded-full bg-[#5fd0e6]" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          ['Today', today],
          ['Tomorrow', addDays(today, 1)],
          ['Next working day', nextWorkingDay(today)],
          ['In a week', addDays(today, 7)],
        ].map(([label, d]) => (
          <button key={label} type="button" onClick={() => pick(d)} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${sel === d ? 'border-ember text-ember' : 'border-line-2 text-bone-2 hover:border-bone'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-line bg-ink/60 p-3">
        <p className="font-medium">{formatLong(sel)}</p>
        {hol.length > 0 ? (
          <div className="mt-1 space-y-0.5 text-xs">
            {hol.map((h) => <HolidayLine key={h.name} h={h} />)}
            <p className="text-mute">Banks and government offices are closed{hol.some((h) => h.mercantile) ? ', and so are most private offices' : ''}.</p>
          </div>
        ) : isWeekend(sel) ? (
          <p className="mt-1 text-xs text-mute">Weekend</p>
        ) : (
          <p className="mt-1 text-xs text-mute">Working day</p>
        )}
        <p className="mt-1 text-[0.65rem] text-mute-2">{dataNote(parts(sel).year)} · {SL_LABEL}</p>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-bone-2">
        <input type="checkbox" checked={withTime} onChange={(e) => { setWithTime(e.target.checked); if (e.target.checked && !t) setT('17:00'); }} className="size-4 accent-[var(--color-ember)]" />
        Add a time (Sri Lanka time)
      </label>
      {withTime && (
        <input type="time" value={t} onChange={(e) => setT(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-line-2 bg-ink px-3 text-sm [color-scheme:dark] focus:border-ember/70 focus:outline-none" aria-label="Due time" />
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onSave(sel, withTime && t ? t : null)} className="h-9 flex-1 rounded-full bg-bone text-sm font-medium text-ink transition-colors hover:bg-ember">Save</button>
        {onRemove && date && (
          <button type="button" onClick={onRemove} className="h-9 rounded-full border border-line-2 px-4 text-sm text-bone-2 hover:border-red-400 hover:text-red-300">Remove</button>
        )}
      </div>
    </div>
  );
}

function HolidayLine({ h }: { h: Holiday }) {
  return (
    <p className={h.poya ? 'text-[#f3e3a1]' : 'text-[#ffb3b3]'}>
      <Icon name={h.poya ? 'moon' : 'flag'} className="mr-1 inline size-3 align-[-2px]" />
      {h.name}
      {h.mercantile && <span className="ml-1.5 rounded bg-[#5fd0e6]/15 px-1 font-mono text-[0.6rem] font-semibold text-[#5fd0e6]">M</span>}
      {h.status !== 'official' && <span className="ml-1.5 text-mute">({h.status})</span>}
    </p>
  );
}

// ─────────────────────────────── Month calendar ───────────────────────────────
export type CalItem = {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string | null;
  done: boolean;
  priority: Priority;
  color: CoverColor | null;
  sub?: string;
  href?: string;
};

export function MonthCalendar({
  items,
  onOpen,
  onMove,
  onAdd,
  aside,
}: {
  items: CalItem[];
  onOpen?: (id: string) => void;
  onMove?: (id: string, date: string) => void;
  onAdd?: (date: string, title: string) => void;
  aside?: ReactNode;
}) {
  const today = useTodaySL();
  const [view, setView] = useState<{ year: number; month: number }>(() => parts(today));
  const [adding, setAdding] = useState<string | null>(null);
  const [dragging, setDragging] = useState<CalItem | null>(null);
  const dndId = useId();
  const isClient = useIsClient();
  const grid = monthGrid(view.year, view.month);
  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of items) m.set(it.dueDate, [...(m.get(it.dueDate) ?? []), it]);
    for (const list of m.values()) list.sort((a, b) => (a.dueTime ?? '99').localeCompare(b.dueTime ?? '99'));
    return m;
  }, [items]);
  const monthHolidays = holidaysInMonth(view.year, view.month);
  const go = (by: number) => setView((v) => shiftMonth(v.year, v.month, by));
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }));
  const end = (e: DragEndEvent) => {
    setDragging(null);
    const to = e.over?.id as string | undefined;
    const it = items.find((i) => i.id === e.active.id);
    if (to && it && it.dueDate !== to) onMove?.(it.id, to);
  };
  const monthItems = items.filter((i) => i.dueDate.startsWith(`${view.year}-${String(view.month).padStart(2, '0')}`));

  return (
    <div data-lenis-prevent className="k-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto lg:flex-row lg:overflow-visible">
      <div className="flex min-h-[34rem] min-w-0 flex-1 flex-col rounded-[1.4rem] border border-line bg-ink/70 p-2 backdrop-blur-xl md:p-4 lg:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(-1)} className="grid size-9 place-items-center rounded-full hover:bg-ink-3" aria-label="Previous month"><Icon name="back" /></button>
            <h2 className="min-w-40 text-center text-lg font-medium tracking-tight" aria-live="polite">{formatMonth(view.year, view.month)}</h2>
            <button type="button" onClick={() => go(1)} className="grid size-9 place-items-center rounded-full hover:bg-ink-3" aria-label="Next month"><Icon name="next" /></button>
            <button type="button" onClick={() => setView(parts(today))} className="ml-2 h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-bone hover:text-bone">Today</button>
          </div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-mute">{SL_LABEL}</p>
        </div>

        <div className="grid grid-cols-7 border-b border-line pb-2 text-center text-[0.68rem] uppercase tracking-[0.12em] text-mute">
          {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
        </div>
        <DndContext id={dndId} sensors={sensors} onDragStart={(e) => setDragging(items.find((i) => i.id === e.active.id) ?? null)} onDragEnd={end} onDragCancel={() => setDragging(null)}>
          <div data-lenis-prevent className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px overflow-y-auto pt-px">
            {grid.map((d) => (
              <Day
                key={d}
                date={d}
                inMonth={parts(d).month === view.month}
                today={today}
                items={byDay.get(d) ?? []}
                onOpen={onOpen}
                draggable={!!onMove}
                adding={adding === d}
                onStartAdd={onAdd ? () => setAdding(d) : undefined}
                onAdd={(title) => { onAdd?.(d, title); }}
                onStopAdd={() => setAdding(null)}
              />
            ))}
          </div>
          {/* portalled: the blurred panel (backdrop-filter) would otherwise offset the fixed-position overlay */}
          {isClient && createPortal(<DragOverlay dropAnimation={null}>{dragging && <Chip item={dragging} overlay />}</DragOverlay>, document.body)}
        </DndContext>
      </div>

      <aside data-lenis-prevent className="flex w-full shrink-0 flex-col gap-4 lg:w-72 lg:overflow-y-auto">
        <div className="rounded-[1.4rem] border border-line bg-ink/70 p-4 backdrop-blur-xl">
          <p className="eyebrow">Holidays in {formatMonth(view.year, view.month).split(' ')[0]}</p>
          {monthHolidays.length ? (
            <ul className="mt-3 space-y-2.5">
              {monthHolidays.map((h) => (
                <li key={h.date + h.name} className="flex gap-3 text-sm">
                  <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-mute">{parts(h.date).day} {WEEKDAYS[weekdayMon0(h.date)]}</span>
                  <HolidayLine h={h} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-mute">No public holidays this month.</p>
          )}
          <p className="mt-4 text-[0.68rem] leading-relaxed text-mute-2">{dataNote(view.year)}. Every listed day is also a bank holiday; M marks mercantile holidays.</p>
        </div>
        <div className="rounded-[1.4rem] border border-line bg-ink/70 p-4 backdrop-blur-xl">
          <Legend className="flex-col !items-start" />
          <p className="mt-3 text-xs text-mute">{monthItems.length} {monthItems.length === 1 ? 'card' : 'cards'} due this month.{onMove ? ' Drag a card to another day to reschedule it.' : ''}</p>
        </div>
        {aside}
      </aside>
    </div>
  );
}

function Day({
  date,
  inMonth,
  today,
  items,
  onOpen,
  draggable,
  adding,
  onStartAdd,
  onAdd,
  onStopAdd,
}: {
  date: string;
  inMonth: boolean;
  today: string;
  items: CalItem[];
  onOpen?: (id: string) => void;
  draggable: boolean;
  adding: boolean;
  onStartAdd?: () => void;
  onAdd: (title: string) => void;
  onStopAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const hs = holidaysOn(date);
  const tint = dayTint(date);
  const isToday = date === today;
  const [draft, setDraft] = useState('');
  return (
    <div
      ref={setNodeRef}
      className={`group relative flex min-h-[4.75rem] flex-col gap-1 overflow-hidden rounded-lg p-1.5 transition-colors ${
        isOver ? 'bg-ember/15 ring-1 ring-ember' : tint === 'poya' ? 'bg-[#e9d58a]/[0.07]' : tint === 'public' ? 'bg-[#ff8f8f]/[0.06]' : isWeekend(date) ? 'bg-bone/[0.015]' : ''
      } ${inMonth ? '' : 'opacity-40'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums ${isToday ? 'bg-ember font-semibold text-ink' : isWeekend(date) ? 'text-mute' : 'text-bone-2'}`}>
          {parts(date).day}
        </span>
        {onStartAdd && (
          <button type="button" onClick={onStartAdd} className="grid size-6 place-items-center rounded-full text-mute opacity-0 transition-opacity hover:bg-ink-3 hover:text-bone focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Add a card due ${formatLong(date)}`}>
            <Icon name="plus" className="size-3.5" />
          </button>
        )}
      </div>
      {hs.length > 0 && (
        <p className={`flex items-center gap-1 truncate text-[0.65rem] leading-tight ${tint === 'poya' ? 'text-[#f3e3a1]' : 'text-[#ffb3b3]'}`} title={hs.map((h) => `${h.name}${h.status !== 'official' ? ` (${h.status})` : ''}`).join(' / ')}>
          <Icon name={tint === 'poya' ? 'moon' : 'flag'} className="size-3 shrink-0" />
          <span className="truncate">{hs.map((h) => h.name.replace(' Full Moon Poya Day', ' Poya').replace(' Festival Day', '')).join(' / ')}</span>
          {hs.some((h) => h.mercantile) && <span className="rounded bg-[#5fd0e6]/15 px-0.5 font-mono text-[0.55rem] font-semibold text-[#5fd0e6]">M</span>}
        </p>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        {items.map((it) => (draggable ? <DraggableChip key={it.id} item={it} onOpen={onOpen} /> : <Chip key={it.id} item={it} onOpen={onOpen} />))}
      </div>
      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) onAdd(draft.trim());
            setDraft('');
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { if (draft.trim()) onAdd(draft.trim()); setDraft(''); onStopAdd(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setDraft(''); onStopAdd(); } }}
            placeholder="Card title"
            maxLength={200}
            aria-label="New card title"
            className="w-full rounded-md border border-ember/60 bg-ink px-1.5 py-1 text-xs outline-none"
          />
        </form>
      )}
    </div>
  );
}

function DraggableChip({ item, onOpen }: { item: CalItem; onOpen?: (id: string) => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: item.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-30' : ''}>
      <Chip item={item} onOpen={onOpen} />
    </div>
  );
}

function Chip({ item, onOpen, overlay = false }: { item: CalItem; onOpen?: (id: string) => void; overlay?: boolean }) {
  const color = item.color ? COLORS[item.color].bg : PRIORITIES[item.priority].rank ? PRIORITIES[item.priority].color : 'rgb(237 230 218 / 0.35)';
  const body = (
    <>
      <span className="h-full w-1 shrink-0 self-stretch rounded-full" style={{ background: color }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={`block truncate ${item.done ? 'text-mute line-through' : ''}`}>{item.title}</span>
        {(item.dueTime || item.sub) && <span className="hidden truncate text-[0.62rem] text-mute sm:block">{[item.dueTime && formatTime(item.dueTime), item.sub].filter(Boolean).join(' · ')}</span>}
      </span>
      {item.done && <Icon name="check" className="size-3 shrink-0 text-[#4fbf7a]" strokeWidth={2.4} />}
    </>
  );
  const cls = `flex w-full min-w-0 items-center gap-1 rounded-md border border-line bg-ink-2 px-1 py-1 text-left text-[0.62rem] leading-tight sm:gap-1.5 sm:px-1.5 sm:text-[0.72rem] transition-colors hover:border-line-2 hover:bg-ink-3 ${overlay ? 'w-44 rotate-2 shadow-xl shadow-black/60' : ''}`;
  if (item.href) return <Link href={item.href} className={cls}>{body}</Link>;
  return (
    <button type="button" className={cls} onClick={() => onOpen?.(item.id)}>
      {body}
    </button>
  );
}
