'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type TextareaHTMLAttributes } from 'react';

const noopSubscribe = () => () => {};
/** False during server rendering and hydration, true afterwards (for portals into document.body). */
export const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);
import { COLORS, DUE_STYLE, PRIORITIES, dueState, type KCard, type KLabel, type Priority } from '@/lib/krama/model';
import { dayKind, describeHolidays, isMercantile } from '@/lib/krama/holidays';
import { formatTime, relativeDay } from '@/lib/krama/time';

// ── Icons (24px grid, stroke) ──
const P = {
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  filter: 'M4 6h16M7 12h10M10 18h4',
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  board: 'M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v11h-4z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checklist: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  comment: 'M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  text: 'M5 7h14M5 12h14M5 17h9',
  archive: 'M4 5h16v4H4zM6 9v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9M10 13h4',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
  tag: 'M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8zM8.5 8.5h.01',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  palette: 'M12 3a9 9 0 0 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.3-1-1.6-1-2.9 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8zM7.5 11h.01M10 7h.01M15 7h.01',
  back: 'M15 6l-6 6 6 6',
  next: 'M9 6l6 6-6 6',
  move: 'M5 12h14M15 8l4 4-4 4',
  restore: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  keyboard: 'M4 7h16v10H4zM7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M5.6 18.4l1-1M17.4 6.6l1-1',
} as const;
export type IconName = keyof typeof P | 'moon';

export function Icon({ name, className = 'size-4', strokeWidth = 1.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  if (name === 'moon') {
    // a full moon: Poya days
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <circle cx="12" cy="12" r="7.5" fill="currentColor" />
        <circle cx="9.5" cy="10" r="1.3" fill="rgb(0 0 0 / 0.18)" />
        <circle cx="14" cy="14.5" r="1.8" fill="rgb(0 0 0 / 0.14)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={P[name]} />
    </svg>
  );
}

// ── Popover: anchored under its trigger, closes on outside click or Escape ──
export function Popover({
  open,
  onClose,
  children,
  className = '',
  align = 'left',
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (box.current && !box.current.contains(t) && !(t as Element).closest?.('[data-popover-trigger]')) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={box}
      role="dialog"
      aria-label={label}
      data-lenis-prevent
      className={`k-pop absolute top-[calc(100%+0.5rem)] z-[60] w-72 rounded-2xl border border-line-2 bg-ink-2/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl ${align === 'right' ? 'right-0' : 'left-0'} ${className}`}
    >
      {children}
    </div>
  );
}

export function PopTitle({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 px-1">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-mute">{children}</p>
      <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label="Close">
        <Icon name="x" className="size-3.5" />
      </button>
    </div>
  );
}

// ── Text that grows with its content ──
export function AutoTextarea({ value, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} rows={1} className={`resize-none overflow-hidden ${className}`} {...rest} />;
}

/**
 * Click-to-edit text. Enter saves (Shift+Enter is a new line when `multiline`), Escape cancels, blur saves.
 * Empty input reverts to the old value.
 */
export function InlineEdit({
  value,
  onSave,
  className = '',
  inputClassName = '',
  maxLength,
  label,
  multiline = false,
  startEditing = false,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  label: string;
  multiline?: boolean;
  startEditing?: boolean;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(value);
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  };
  if (!editing) {
    return (
      <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className={`min-w-0 cursor-text text-left ${className}`} aria-label={`${label}: ${value}. Click to edit`}>
        {value}
      </button>
    );
  }
  return (
    <AutoTextarea
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      value={draft}
      maxLength={maxLength}
      aria-label={label}
      onChange={(e) => setDraft(multiline ? e.target.value : e.target.value.replace(/\n/g, ' '))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !(multiline && e.shiftKey)) {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          setDraft(value);
          setEditing(false);
        }
      }}
      className={`w-full rounded-lg border border-ember/60 bg-ink px-2 py-1 outline-none ${inputClassName}`}
    />
  );
}

// ── Small marks used on cards, the modal and the calendar ──
export function LabelChip({ label, compact = false }: { label: KLabel; compact?: boolean }) {
  const c = COLORS[label.color];
  if (compact) return <span className="block h-2 w-10 rounded-full" style={{ background: c.bg }} title={label.name || c.name} />;
  return (
    <span className="inline-flex h-6 max-w-full items-center truncate rounded-md px-2 text-[0.72rem] font-medium" style={{ background: c.bg, color: c.fg }}>
      {label.name || '    '}
    </span>
  );
}

export function PriorityMark({ priority, withText = false }: { priority: Priority; withText?: boolean }) {
  if (priority === 'none' && !withText) return null;
  const p = PRIORITIES[priority];
  const bars = p.rank;
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.72rem]" title={`Priority: ${p.name}`} style={{ color: priority === 'none' ? undefined : p.color }}>
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="w-[3px] rounded-sm" style={{ height: `${25 * i}%`, background: i <= bars ? p.color : 'rgb(237 230 218 / 0.18)' }} />
        ))}
      </span>
      {(withText || priority === 'urgent' || priority === 'high') && <span>{p.name}</span>}
      <span className="sr-only">Priority {p.name}</span>
    </span>
  );
}

/** Moon for Poya days, flag for other holidays; tooltip says which holiday. */
export function HolidayMark({ date, className = 'size-3.5' }: { date: string; className?: string }) {
  const kind = dayKind(date);
  if (!kind) return null;
  const text = describeHolidays(date) ?? '';
  return (
    <span title={text} className={kind === 'poya' ? 'text-[#e9d58a]' : 'text-[#ff8f8f]'}>
      <Icon name={kind === 'poya' ? 'moon' : 'flag'} className={className} />
      <span className="sr-only">{text}</span>
    </span>
  );
}

export function DueBadge({ card, onToggle }: { card: Pick<KCard, 'dueDate' | 'dueTime' | 'dueDone'>; onToggle?: () => void }) {
  const state = dueState(card);
  if (!state || !card.dueDate) return null;
  const s = DUE_STYLE[state];
  const text = `${relativeDay(card.dueDate)}${card.dueTime ? `, ${formatTime(card.dueTime)}` : ''}`;
  const style = state === 'later' ? undefined : { background: s.bg, color: s.fg };
  const inner = (
    <>
      <Icon name={state === 'done' ? 'check' : 'clock'} className="size-3.5" strokeWidth={2.2} />
      {text}
      {isMercantile(card.dueDate) || dayKind(card.dueDate) ? <HolidayMark date={card.dueDate} className="size-3" /> : null}
      {s.label && <span className="sr-only">({s.label})</span>}
    </>
  );
  const cls = `inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-medium ${state === 'later' ? 'text-bone-2' : ''}`;
  if (onToggle) {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`${cls} hover:brightness-110`} style={style} title={card.dueDone ? 'Mark as not done' : 'Mark as done'}>
        {inner}
      </button>
    );
  }
  return <span className={cls} style={style}>{inner}</span>;
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-9 text-right font-mono text-[0.7rem] tabular-nums text-mute">{pct}%</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: pct === 100 ? '#4fbf7a' : 'var(--color-ember)' }} />
      </div>
    </div>
  );
}

export const kbtn = 'inline-flex h-9 items-center gap-2 rounded-full border border-line-2 bg-ink/40 px-3.5 text-sm text-bone-2 transition-colors hover:border-bone hover:text-bone disabled:opacity-40';
export const kfield = 'h-10 w-full rounded-xl border border-line-2 bg-ink px-3 text-sm text-bone placeholder:text-mute focus:border-ember/70 focus:outline-none';
