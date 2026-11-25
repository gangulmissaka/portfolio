'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createBoard, updateBoard } from '@/lib/actions/krama';
import { upcomingHolidays } from '@/lib/krama/holidays';
import type { DueItem } from '@/lib/krama/data';
import { LIMITS, THEME_IDS, THEMES, dueState, type ThemeId } from '@/lib/krama/model';
import { SL_LABEL, daysBetween, formatShort, formatWeekday, relativeDay } from '@/lib/krama/time';
import { Legend, useTodaySL } from './calendar';
import { DueBadge, Icon, kfield } from './ui';

export type BoardTile = { id: string; title: string; theme: ThemeId; starred: boolean; lists: number; cards: number; open: number; updatedAt: string };

export function KramaHome({ boards, due, firstName }: { boards: BoardTile[]; due: DueItem[]; firstName: string }) {
  const today = useTodaySL();
  const [creating, setCreating] = useState(boards.length === 0);
  const [starred, setStarred] = useState<Record<string, boolean>>(() => Object.fromEntries(boards.map((b) => [b.id, b.starred])));
  const soon = due.filter((d) => !d.dueDone && daysBetween(today, d.dueDate) <= 7).slice(0, 8);
  const holidays = upcomingHolidays(today, 6);

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2.5rem)]">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="eyebrow flex items-center gap-2"><Link href="/labs" className="hover:text-bone">Labs</Link> <span aria-hidden>/</span> Task planner</p>
          <h1 className="display mt-4 text-[clamp(3rem,8vw,6.5rem)]">Krama</h1>
          <p className="mt-3 max-w-[46ch] text-bone-2">Boards, lists and cards for planning anything, with Sri Lankan holidays and Poya days built into the calendar. Good to see you, {firstName}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/labs/krama/calendar" className="flex h-11 items-center gap-2 rounded-full border border-line-2 px-4 text-sm text-bone-2 transition-colors hover:border-bone hover:text-bone">
            <Icon name="calendar" /> Calendar
          </Link>
          <button type="button" onClick={() => setCreating(true)} className="flex h-11 items-center gap-2 rounded-full bg-bone px-5 text-sm font-medium text-ink transition-colors hover:bg-ember">
            <Icon name="plus" strokeWidth={2.2} /> New board
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="k-boards">
          <h2 id="k-boards" className="eyebrow">Your boards · {boards.length}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((b) => (
              <li key={b.id} className="group relative">
                <Link href={`/labs/krama/b/${b.id}`} className="flex h-40 flex-col justify-between overflow-hidden rounded-[1.2rem] border border-line p-5 transition-all duration-500 hover:-translate-y-1 hover:border-line-2 hover:shadow-2xl hover:shadow-black/50" style={{ background: THEMES[b.theme]?.bg }}>
                  <span className="flex items-start justify-between gap-3 pr-8">
                    <span className="text-lg font-medium leading-snug tracking-tight">{b.title}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-bone-2">
                    <span>{b.lists} {b.lists === 1 ? 'list' : 'lists'}</span>
                    <span>{b.cards} {b.cards === 1 ? 'card' : 'cards'}</span>
                    {b.open > 0 && <span className="flex items-center gap-1"><Icon name="clock" className="size-3.5" /> {b.open} with due dates</span>}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const next = !starred[b.id];
                    setStarred((s) => ({ ...s, [b.id]: next }));
                    updateBoard(b.id, { starred: next }).catch(() => setStarred((s) => ({ ...s, [b.id]: !next })));
                  }}
                  className={`absolute right-3 top-3 grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/60 ${starred[b.id] ? 'text-[#f2c94c]' : 'text-bone-2/60 opacity-0 focus-visible:opacity-100 group-hover:opacity-100'}`}
                  aria-label={starred[b.id] ? `Unstar ${b.title}` : `Star ${b.title}`}
                  aria-pressed={!!starred[b.id]}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill={starred[b.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => setCreating(true)} className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-[1.2rem] border border-dashed border-line-2 text-sm text-bone-2 transition-colors hover:border-bone hover:bg-ink-2 hover:text-bone">
                <Icon name="plus" className="size-5" /> Create a board
              </button>
            </li>
          </ul>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[1.2rem] border border-line bg-ink-2/60 p-5" aria-labelledby="k-soon">
            <h2 id="k-soon" className="eyebrow">Due in the next 7 days</h2>
            {soon.length ? (
              <ul className="mt-4 space-y-2.5">
                {soon.map((d) => (
                  <li key={d.id}>
                    <Link href={`/labs/krama/b/${d.boardId}?card=${d.id}`} className="block rounded-xl border border-line bg-ink p-3 transition-colors hover:border-line-2">
                      <p className="text-sm leading-snug">{d.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-mute">
                        <DueBadge card={d} />
                        <span className="truncate">{d.boardTitle} · {d.listTitle}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mute">Nothing due this week.</p>
            )}
            {due.some((d) => dueState(d, today) === 'overdue') && (
              <p className="mt-3 text-xs text-[#ff9f9f]">{due.filter((d) => dueState(d, today) === 'overdue').length} overdue across your boards.</p>
            )}
          </section>

          <section className="rounded-[1.2rem] border border-line bg-ink-2/60 p-5" aria-labelledby="k-hol">
            <h2 id="k-hol" className="eyebrow">Coming holidays in Sri Lanka</h2>
            <ul className="mt-4 space-y-3">
              {holidays.map((h) => (
                <li key={h.date + h.name} className="flex gap-3 text-sm">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${h.poya ? 'bg-[#e9d58a]/12 text-[#f3e3a1]' : 'bg-[#ff8f8f]/10 text-[#ffb3b3]'}`}>
                    <Icon name={h.poya ? 'moon' : 'flag'} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-snug">{h.name}</span>
                    <span className="text-xs text-mute">
                      {formatWeekday(h.date)} {formatShort(h.date, today)} · {relativeDay(h.date, today) === formatShort(h.date, today) ? `in ${daysBetween(today, h.date)} days` : relativeDay(h.date, today)}
                      {h.mercantile && ' · mercantile'}
                      {h.status !== 'official' && ` · ${h.status}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Legend className="mt-5 border-t border-line pt-4" />
            <p className="mt-3 text-[0.68rem] text-mute-2">All dates and times in Krama are Sri Lanka time ({SL_LABEL}).</p>
          </section>
        </aside>
      </div>

      {creating && <CreateBoard onClose={() => setCreating(false)} first={boards.length === 0} />}
    </div>
  );
}

function CreateBoard({ onClose, first }: { onClose: () => void; first: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(first ? 'My first board' : '');
  const [theme, setTheme] = useState<ThemeId>('ember');
  const [template, setTemplate] = useState<'basic' | 'sample' | 'blank'>(first ? 'sample' : 'basic');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const submit = () =>
    start(async () => {
      const id = crypto.randomUUID();
      const r = await createBoard({ id, title, theme, template }).catch(() => ({ ok: false as const, error: 'Could not create the board. Please try again.' }));
      if (r.ok) router.push(`/labs/krama/b/${id}`);
      else setError(r.error);
    });

  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && !first) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="k-new-title"
        className="w-full max-w-md overflow-hidden rounded-[1.4rem] border border-line-2 bg-ink-2 shadow-2xl shadow-black/70"
      >
        <div className="h-28 p-5 transition-[background] duration-500" style={{ background: THEMES[theme].bg }}>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => <span key={i} className="h-16 w-20 rounded-lg bg-ink/60 backdrop-blur" style={{ height: `${4 - i * 0.6}rem` }} />)}
          </div>
        </div>
        <div className="space-y-5 p-6">
          <h2 id="k-new-title" className="text-xl font-medium tracking-tight">{first ? 'Create your first board' : 'New board'}</h2>
          <div>
            <label htmlFor="k-board-title" className="text-xs text-mute">Board name</label>
            <input id="k-board-title" autoFocus required value={title} maxLength={LIMITS.boardTitle} onChange={(e) => setTitle(e.target.value)} onFocus={(e) => e.currentTarget.select()} placeholder="e.g. Final year project" className={`${kfield} mt-1`} />
          </div>
          <fieldset>
            <legend className="text-xs text-mute">Background</legend>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {THEME_IDS.map((t) => (
                <button key={t} type="button" onClick={() => setTheme(t)} className={`aspect-square rounded-lg border ${theme === t ? 'border-bone ring-2 ring-bone/40' : 'border-line'}`} style={{ background: THEMES[t].bg }} aria-label={THEMES[t].name} aria-pressed={theme === t}>
                  <span className="mx-auto block size-2 rounded-full" style={{ background: THEMES[t].swatch }} />
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs text-mute">Start with</legend>
            <div className="mt-2 grid gap-2">
              {([
                ['basic', 'To do, Doing, Done', 'Three empty lists'],
                ['sample', 'A sample board', 'A few example cards that show what Krama can do'],
                ['blank', 'Nothing', 'An empty board'],
              ] as const).map(([id, name, sub]) => (
                <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${template === id ? 'border-ember/70 bg-ember/5' : 'border-line hover:border-line-2'}`}>
                  <input type="radio" name="template" checked={template === id} onChange={() => setTemplate(id)} className="mt-1 accent-[var(--color-ember)]" />
                  <span><span className="block text-sm">{name}</span><span className="text-xs text-mute">{sub}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending || !title.trim()} className="h-11 flex-1 rounded-full bg-bone text-sm font-medium text-ink transition-colors hover:bg-ember disabled:opacity-40">
              {pending ? 'Creating…' : 'Create board'}
            </button>
            <button type="button" onClick={onClose} className="h-11 rounded-full border border-line-2 px-5 text-sm text-bone-2 hover:border-bone">Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
