'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { deleteBoard } from '@/lib/actions/krama';
import { ACCESS, LIMITS, PRIORITY_IDS, THEME_IDS, THEMES, dueState, type BoardData, type KCard, type Priority } from '@/lib/krama/model';
import { addDays, daysBetween, formatShort } from '@/lib/krama/time';
import { BoardView, MenuItem } from './BoardView';
import { CardModal } from './CardModal';
import { MonthCalendar, nextWorkingDay, useTodaySL, type CalItem } from './calendar';
import { AppLock } from './AppLock';
import { ReportButton } from './ReportButton';
import { BoardAdmin } from './BoardAdmin';
import { MembersView } from './MembersView';
import { ProgressView } from './ProgressView';
import { useBoard } from './store';
import { RoleBadge, TeamProvider } from './team';
import { Icon, LabelChip, Popover, PopTitle, PriorityMark, kfield } from './ui';

type View = 'board' | 'calendar' | 'members' | 'progress' | 'admin';
const VIEWS: View[] = ['board', 'calendar', 'members', 'progress'];
const VIEW_NAME: Record<View, string> = { board: 'Board', calendar: 'Calendar', members: 'Members & Roles', progress: 'Progress', admin: 'Admin' };
const VIEW_ICON = { board: 'board', calendar: 'calendar', members: 'users', progress: 'sun', admin: 'shield' } as const;

type DueFilter = 'overdue' | 'today' | 'week' | 'none' | 'done' | 'revision';
const DUE_FILTERS: { id: DueFilter; name: string }[] = [
  { id: 'overdue', name: 'Overdue' },
  { id: 'today', name: 'Due today' },
  { id: 'week', name: 'Due in the next 7 days' },
  { id: 'none', name: 'No due date' },
  { id: 'done', name: 'Done' },
  { id: 'revision', name: 'Sent back for revision' },
];

/** Keep ?card= and ?view= in the address bar without a navigation (so links and reloads land on the same place). */
function setParam(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(window.history.state, '', url);
}

export function BoardApp({ initial }: { initial: BoardData }) {
  const { state, api, toasts, dismiss, isIdle } = useBoard(initial);
  const { board, lists, cards, labels, roles, perm } = state;
  const edit = perm.canEdit;
  const params = useSearchParams();
  const router = useRouter();
  const today = useTodaySL();

  // the Admin tab is for the project's creator (and the Krama admin)
  const views: View[] = perm.canManage ? [...VIEWS, 'admin'] : VIEWS;
  const [view, setView] = useState<View>(() => (views.includes(params.get('view') as View) ? (params.get('view') as View) : 'board'));
  const [openId, setOpenId] = useState<string | null>(() => {
    const id = params.get('card');
    return id && initial.cards[id] ? id : null;
  });
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());
  const [fLabels, setFLabels] = useState<string[]>([]);
  const [fDue, setFDue] = useState<DueFilter[]>([]);
  const [fPrio, setFPrio] = useState<Priority[]>([]);
  const [fRoles, setFRoles] = useState<string[]>([]);
  const [fMine, setFMine] = useState(false);
  const [pop, setPop] = useState<'filter' | 'add' | 'menu' | 'boards' | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [composerFor, setComposerFor] = useState<string | null>(null);
  const [calList, setCalList] = useState<string>('');
  const search = useRef<HTMLInputElement>(null);

  const open = useCallback((id: string) => {
    setOpenId(id);
    setParam('card', id);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    setParam('card', null);
  }, []);
  const switchView = (v: View) => {
    setView(v);
    setParam('view', v === 'board' ? null : v);
  };

  const allRoleId = roles.find((r) => r.code === 'ALL')?.id;
  const filtering = !!(q || fLabels.length || fDue.length || fPrio.length || fRoles.length || fMine);
  const filterCount = fLabels.length + fDue.length + fPrio.length + fRoles.length + (fMine ? 1 : 0);
  const visible = useCallback(
    (c: KCard) => {
      if (q) {
        const hay = [c.title, c.description, ...c.labelIds.map((id) => labels.find((l) => l.id === id)?.name ?? ''), ...c.checklists.flatMap((l) => l.items.map((i) => i.text))].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (fLabels.length && !fLabels.some((id) => c.labelIds.includes(id))) return false;
      if (fPrio.length && !fPrio.includes(c.priority)) return false;
      if (fRoles.length && !fRoles.includes(c.roleId ?? 'none')) return false;
      if (fMine && !(c.roleId && (perm.roleIds.includes(c.roleId) || c.roleId === allRoleId || (!!allRoleId && perm.roleIds.includes(allRoleId))))) return false;
      if (fDue.length) {
        const s = dueState(c, today);
        const ok = fDue.some((f) => {
          if (f === 'none') return !c.dueDate;
          if (f === 'done') return s === 'done';
          if (f === 'revision') return !!c.revision;
          if (f === 'overdue') return s === 'overdue';
          if (f === 'today') return c.dueDate === today && s !== 'done';
          return !!c.dueDate && s !== 'done' && daysBetween(today, c.dueDate) >= 0 && daysBetween(today, c.dueDate) <= 7;
        });
        if (!ok) return false;
      }
      return true;
    },
    [q, fLabels, fDue, fPrio, fRoles, fMine, labels, today, perm.roleIds, allRoleId],
  );
  const clearFilters = () => { setQuery(''); setFLabels([]); setFDue([]); setFPrio([]); setFRoles([]); setFMine(false); };

  const active = useMemo(() => Object.values(cards).filter((c) => !c.archived), [cards]);
  const shownCount = active.filter(visible).length;
  const archived = Object.values(cards).filter((c) => c.archived);

  // keyboard: "/" search, "n" new card, "c" calendar, "b" board
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || openId || t.closest('input, textarea, select, [contenteditable], dialog')) return;
      if (e.key === '/') { e.preventDefault(); search.current?.focus(); }
      else if (e.key === 'n' && lists[0] && edit) { e.preventDefault(); switchView('board'); setComposerFor(lists[0].id); }
      else if (e.key === 'c') switchView('calendar');
      else if (e.key === 'b') switchView('board');
      else if (e.key === 'm') switchView('members');
      else if (e.key === 'p') switchView('progress');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Teammates' changes: quietly reload the board every 20 s and when the tab regains focus, but only when nothing
  // is being saved, dragged, typed or open, so a refresh can never undo what you are doing.
  const openRef = useRef(openId);
  useEffect(() => {
    openRef.current = openId;
  }, [openId]);
  useEffect(() => {
    const sync = () => {
      const typing = document.activeElement?.matches('input, textarea, select, [contenteditable]');
      if (document.visibilityState !== 'visible' || !isIdle() || openRef.current || document.body.dataset.kDragging || typing || document.querySelector('.k-pop')) return;
      router.refresh();
    };
    const id = setInterval(sync, 20_000);
    window.addEventListener('focus', sync);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', sync);
    };
  }, [isIdle, router]);

  const theme = THEMES[board.theme] ?? THEMES.ember;
  const calItems: CalItem[] = active
    .filter((c) => c.dueDate && visible(c))
    .map((c) => ({ id: c.id, title: c.title, dueDate: c.dueDate!, dueTime: c.dueTime, done: c.dueDone, priority: c.priority, color: c.cover ?? (c.labelIds[0] ? labels.find((l) => l.id === c.labelIds[0])?.color ?? null : null), sub: lists.find((l) => l.id === c.listId)?.title }));
  const addTarget = calList && lists.some((l) => l.id === calList) ? calList : lists[0]?.id;

  return (
    <TeamProvider perm={perm} roles={roles} members={state.members}>
    <div data-krama-app className="relative flex h-dvh flex-col overflow-hidden pt-[var(--header-h)]" style={{ background: theme.bg }}>
      <AppLock />
      {/* ── toolbar ── */}
      <div className="relative z-30 flex flex-wrap items-center gap-2 px-[var(--gutter)] pb-3 pt-3">
        <Link href="/labs/krama" className="grid size-9 shrink-0 place-items-center rounded-full border border-line-2 bg-ink/40 text-bone-2 backdrop-blur hover:border-bone hover:text-bone" aria-label="All boards">
          <Icon name="back" />
        </Link>
        <div className="relative flex min-w-0 items-center gap-1">
          {edit ? <BoardTitle title={board.title} onSave={(t) => api.patchBoard({ title: t })} /> : <h1 className="truncate px-2 text-lg font-medium tracking-tight">{board.title}</h1>}
          <button type="button" data-popover-trigger onClick={() => setPop(pop === 'boards' ? null : 'boards')} className="grid size-8 shrink-0 place-items-center rounded-full text-mute hover:bg-ink/60 hover:text-bone" aria-label="Switch board" aria-expanded={pop === 'boards'}>
            <Icon name="next" className="size-4 rotate-90" />
          </button>
          {(perm.isOwner || perm.isAdmin) && <button type="button" onClick={() => api.patchBoard({ starred: !board.starred })} className={`grid size-8 shrink-0 place-items-center rounded-full hover:bg-ink/60 ${board.starred ? 'text-[#f2c94c]' : 'text-mute hover:text-bone'}`} aria-label={board.starred ? 'Unstar board' : 'Star board'} aria-pressed={board.starred}>
            <svg viewBox="0 0 24 24" className="size-4" fill={board.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          </button>}
          {perm.access !== 'owner' && (
            <span className={`ml-1 hidden shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] sm:inline ${edit ? 'bg-ember/15 text-ember' : 'bg-[#5fd0e6]/15 text-[#5fd0e6]'}`} title={ACCESS[perm.access].body}>
              {ACCESS[perm.access].name}
            </span>
          )}
          <Popover open={pop === 'boards'} onClose={() => setPop(null)} label="Your boards" className="w-64 p-1.5">
            {state.boards.map((b) => (
              <Link key={b.id} href={`/labs/krama/b/${b.id}`} onClick={() => setPop(null)} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-ink-3 ${b.id === board.id ? 'bg-ink-3' : ''}`}>
                <span className="size-4 shrink-0 rounded" style={{ background: THEMES[b.theme]?.swatch }} />
                <span className="truncate">{b.title}</span>
              </Link>
            ))}
            <Link href="/labs/krama" className="mt-1 flex items-center gap-2.5 rounded-xl border-t border-line px-2.5 py-2 text-sm text-mute hover:text-bone">All boards</Link>
          </Popover>
        </div>

        <div className="ml-1 flex max-w-full overflow-x-auto rounded-full border border-line-2 bg-ink/50 p-0.5 backdrop-blur [scrollbar-width:none]" role="tablist" aria-label="View">
          {views.map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => switchView(v)} className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition-colors ${view === v ? (v === 'admin' ? 'bg-ember text-ink' : 'bg-bone text-ink') : v === 'admin' ? 'text-ember hover:bg-ember/15' : 'text-bone-2 hover:text-bone'}`}>
              <Icon name={VIEW_ICON[v]} className="size-3.5" /> {VIEW_NAME[v]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="relative flex items-center">
            <span className="sr-only">Search cards</span>
            <Icon name="search" className="pointer-events-none absolute left-3 z-10 size-4 text-mute" />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur(); } }}
              placeholder="Search"
              className="h-9 w-28 rounded-full sm:w-40 border border-line-2 bg-ink/50 pl-9 pr-8 text-sm backdrop-blur transition-[width] duration-300 placeholder:text-mute focus:w-56 focus:border-ember/60 focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-3 hidden font-mono text-[0.65rem] text-mute sm:block">/</kbd>
          </label>

          <div className="relative">
            <button type="button" data-popover-trigger onClick={() => setPop(pop === 'filter' ? null : 'filter')} className={`flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm backdrop-blur transition-colors ${filterCount ? 'border-ember bg-ember/15 text-ember' : 'border-line-2 bg-ink/50 text-bone-2 hover:border-bone hover:text-bone'}`} aria-expanded={pop === 'filter'} aria-label={filterCount ? `Filter cards, ${filterCount} active` : 'Filter cards'}>
              <Icon name="filter" /> <span className="hidden sm:inline">Filter</span>{filterCount ? <span>{filterCount}</span> : null}
            </button>
            <Popover open={pop === 'filter'} onClose={() => setPop(null)} label="Filter cards" align="right" className="w-80">
              <PopTitle onClose={() => setPop(null)}>Filter cards</PopTitle>
              <FilterGroup title="Labels">
                {labels.map((l) => (
                  <Check key={l.id} checked={fLabels.includes(l.id)} onChange={(on) => setFLabels((s) => (on ? [...s, l.id] : s.filter((x) => x !== l.id)))}>
                    <LabelChip label={l} />
                  </Check>
                ))}
              </FilterGroup>
              <FilterGroup title="Due date">
                {DUE_FILTERS.map((f) => (
                  <Check key={f.id} checked={fDue.includes(f.id)} onChange={(on) => setFDue((s) => (on ? [...s, f.id] : s.filter((x) => x !== f.id)))}>{f.name}</Check>
                ))}
              </FilterGroup>
              {roles.length > 0 && (
                <FilterGroup title="Role">
                  {perm.roleIds.length > 0 && (
                    <Check checked={fMine} onChange={setFMine}><span className="font-medium text-bone">Cards for my roles</span></Check>
                  )}
                  {roles.map((r) => (
                    <Check key={r.id} checked={fRoles.includes(r.id)} onChange={(on) => setFRoles((s) => (on ? [...s, r.id] : s.filter((x) => x !== r.id)))}>
                      <span className="flex items-center gap-2"><RoleBadge role={r} /> <span className="truncate text-xs text-mute">{r.name}</span></span>
                    </Check>
                  ))}
                  <Check checked={fRoles.includes('none')} onChange={(on) => setFRoles((s) => (on ? [...s, 'none'] : s.filter((x) => x !== 'none')))}>No role</Check>
                </FilterGroup>
              )}
              <FilterGroup title="Priority">
                {[...PRIORITY_IDS].reverse().map((p) => (
                  <Check key={p} checked={fPrio.includes(p)} onChange={(on) => setFPrio((s) => (on ? [...s, p] : s.filter((x) => x !== p)))}>
                    <PriorityMark priority={p} withText />
                  </Check>
                ))}
              </FilterGroup>
              <p className="mt-3 border-t border-line pt-3 text-xs text-mute">Cards matching any ticked box in each group are shown.</p>
              {filterCount > 0 && <button type="button" onClick={() => { setFLabels([]); setFDue([]); setFPrio([]); setFRoles([]); setFMine(false); }} className="mt-2 h-9 w-full rounded-full border border-line-2 text-sm text-bone-2 hover:border-bone">Clear filters</button>}
            </Popover>
          </div>

          {edit && <div className="relative">
            <button type="button" data-popover-trigger onClick={() => setPop(pop === 'add' ? null : 'add')} disabled={!lists.length} className="flex h-9 items-center gap-1.5 rounded-full bg-bone px-3.5 text-sm font-medium text-ink transition-colors hover:bg-ember disabled:opacity-40" aria-expanded={pop === 'add'} title="Quick add (N)">
              <Icon name="plus" strokeWidth={2.2} /> Add<span className="hidden sm:inline"> card</span>
            </button>
            <Popover open={pop === 'add'} onClose={() => setPop(null)} label="Quick add a card" align="right" className="w-80">
              <PopTitle onClose={() => setPop(null)}>Quick add</PopTitle>
              <QuickAdd lists={lists} today={today} onAdd={(listId, title, due, openAfter) => { const id = api.addCard(listId, title, { dueDate: due }); if (openAfter) { setPop(null); open(id); } }} />
            </Popover>
          </div>}

          <ReportButton data={state} />

          <div className="relative">
            <button type="button" data-popover-trigger onClick={() => setPop(pop === 'menu' ? null : 'menu')} className="grid size-9 place-items-center rounded-full border border-line-2 bg-ink/50 text-bone-2 backdrop-blur hover:border-bone hover:text-bone" aria-label="Board menu" aria-expanded={pop === 'menu'}>
              <Icon name="more" strokeWidth={3} />
            </button>
            <Popover open={pop === 'menu'} onClose={() => setPop(null)} label="Board menu" align="right" className="w-80">
              <PopTitle onClose={() => setPop(null)}>Board</PopTitle>
              {edit && <>
              <p className="px-1 text-xs text-mute">Background</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {THEME_IDS.map((t) => (
                  <button key={t} type="button" onClick={() => api.patchBoard({ theme: t })} className={`h-12 rounded-xl border transition-transform hover:scale-[1.04] ${board.theme === t ? 'border-bone ring-2 ring-bone/40' : 'border-line'}`} style={{ background: THEMES[t].bg }} aria-label={`${THEMES[t].name} background`} aria-pressed={board.theme === t}>
                    <span className="mx-auto block size-2.5 rounded-full" style={{ background: THEMES[t].swatch }} />
                  </button>
                ))}
              </div>
              </>}
              <div className={edit ? 'mt-3 border-t border-line pt-2' : ''}>
                <MenuItem icon="users" onClick={() => { setPop(null); switchView('members'); }}>Members &amp; Roles</MenuItem>
                <MenuItem icon="archive" onClick={() => { setPop(null); setArchiveOpen(true); }}>Archived cards ({archived.length})</MenuItem>
                {(perm.isOwner || perm.isAdmin) && <MenuItem icon="trash" danger onClick={async () => {
                  if (!confirm(`Delete the board "${board.title}" with all its lists and cards? This can't be undone.`)) return;
                  setPop(null);
                  const r = await deleteBoard(board.id).catch(() => null);
                  if (r?.ok) router.push('/labs/krama');
                  else alert(r && !r.ok ? r.error : 'The board could not be deleted. Please try again.');
                }}>Delete board</MenuItem>}
              </div>
              <p className="mt-2 border-t border-line px-1 pt-3 text-[0.7rem] leading-relaxed text-mute">
                Shortcuts: <kbd className="font-mono text-bone-2">/</kbd> search{edit && <> · <kbd className="font-mono text-bone-2">N</kbd> new card</>} · <kbd className="font-mono text-bone-2">B</kbd> board · <kbd className="font-mono text-bone-2">C</kbd> calendar · <kbd className="font-mono text-bone-2">M</kbd> members · <kbd className="font-mono text-bone-2">P</kbd> progress{edit && <> · <kbd className="font-mono text-bone-2">Space</kbd> pick up a focused card, arrows to move</>}
              </p>
            </Popover>
          </div>
        </div>
      </div>

      {filtering && (
        <div className="relative z-20 mx-[var(--gutter)] mb-3 flex flex-wrap items-center gap-3 rounded-full border border-ember/30 bg-ink/60 px-4 py-2 text-sm backdrop-blur">
          <span className="text-bone-2">Showing <b className="font-medium text-bone">{shownCount}</b> of {active.length} cards</span>
          <button type="button" onClick={clearFilters} className="text-ember hover:underline">Clear search and filters</button>
        </div>
      )}

      {/* ── content ── */}
      {view === 'board' ? (
        <BoardView data={state} api={api} visible={visible} filtering={filtering} onOpen={open} composerFor={composerFor} setComposerFor={setComposerFor} />
      ) : view === 'members' ? (
        <MembersView data={state} api={api} />
      ) : view === 'progress' ? (
        <ProgressView data={state} />
      ) : view === 'admin' && perm.canManage ? (
        <BoardAdmin data={state} api={api} onOpenCard={open} />
      ) : (
        <div className="flex min-h-0 flex-1 px-[var(--gutter)] pb-4">
          <MonthCalendar
            items={calItems}
            onOpen={open}
            onMove={edit ? (id, date) => api.patchCard(id, { dueDate: date }) : undefined}
            onAdd={edit && addTarget ? (date, title) => api.addCard(addTarget, title.slice(0, LIMITS.title), { dueDate: date }) : undefined}
            aside={
              edit && lists.length > 0 && (
                <div className="rounded-[1.4rem] border border-line bg-ink/70 p-4 backdrop-blur-xl">
                  <label className="eyebrow" htmlFor="k-cal-list">New cards from the calendar go to</label>
                  <select id="k-cal-list" value={addTarget} onChange={(e) => setCalList(e.target.value)} className={`${kfield} mt-2 [color-scheme:dark]`}>
                    {lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                  <p className="mt-2 text-xs text-mute">Hover a day and press + to add a card due that day.</p>
                  <p className="mt-3 text-xs text-mute">{active.filter((c) => !c.dueDate).length} cards have no due date.</p>
                </div>
              )
            }
          />
        </div>
      )}

      {openId && cards[openId] && <CardModal key={openId} cardId={openId} data={state} api={api} onClose={close} />}
      {archiveOpen && <ArchiveDrawer canEdit={edit} cards={archived} lists={lists} onClose={() => setArchiveOpen(false)} onOpen={(id) => { setArchiveOpen(false); open(id); }} onRestore={(id) => api.patchCard(id, { archived: false })} onDelete={(id) => api.deleteCard(id)} />}

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[95] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2.5 text-sm shadow-xl shadow-black/50 backdrop-blur-xl ${t.tone === 'error' ? 'border-red-400/40 bg-[#2a1212]/95 text-red-100' : 'border-line-2 bg-ink-2/95 text-bone'}`}>
            {t.text}
            <button type="button" onClick={() => dismiss(t.id)} className="text-mute hover:text-bone" aria-label="Dismiss"><Icon name="x" className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
    </TeamProvider>
  );
}

function BoardTitle({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(title);
  const commit = () => {
    setEditing(false);
    const t = v.trim();
    if (t && t !== title) onSave(t.slice(0, LIMITS.boardTitle));
    else setV(title);
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={v}
        maxLength={LIMITS.boardTitle}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setV(title); setEditing(false); } }}
        aria-label="Board name"
        className="h-9 w-64 max-w-[60vw] rounded-lg border border-ember/60 bg-ink/80 px-2 text-lg font-medium tracking-tight outline-none"
      />
    );
  }
  return (
    <button type="button" onClick={() => { setV(title); setEditing(true); }} className="h-9 min-w-0 truncate rounded-lg px-2 text-left text-lg font-medium tracking-tight hover:bg-ink/50" title="Rename board">
      <h1 className="truncate">{title}</h1>
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-3 first-of-type:mt-1">
      <legend className="mb-1.5 px-1 text-xs text-mute">{title}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm text-bone-2 hover:bg-ink-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 shrink-0 accent-[var(--color-ember)]" />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

function QuickAdd({ lists, today, onAdd }: { lists: BoardData['lists']; today: string; onAdd: (listId: string, title: string, due: string | null, openAfter: boolean) => void }) {
  const [title, setTitle] = useState('');
  const [listId, setListId] = useState(lists[0]?.id ?? '');
  const [due, setDue] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const options: [string, string | null][] = [
    ['No date', null],
    ['Today', today],
    ['Tomorrow', addDays(today, 1)],
    [`Next working day (${formatShort(nextWorkingDay(today), today)})`, nextWorkingDay(today)],
  ];
  const submit = (openAfter: boolean) => {
    const t = title.trim().slice(0, LIMITS.title);
    if (!t || !listId) return;
    onAdd(listId, t, due, openAfter);
    setTitle('');
    setAdded((n) => n + 1);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="space-y-3">
      <input autoFocus value={title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" aria-label="Card title" className={kfield} />
      <div>
        <label className="px-1 text-xs text-mute" htmlFor="k-qa-list">List</label>
        <select id="k-qa-list" value={listId} onChange={(e) => setListId(e.target.value)} className={`${kfield} mt-1 [color-scheme:dark]`}>
          {lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([label, d]) => (
          <button key={label} type="button" onClick={() => setDue(d)} className={`rounded-full border px-2.5 py-1 text-xs ${due === d ? 'border-ember text-ember' : 'border-line-2 text-bone-2 hover:border-bone'}`}>{label}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={!title.trim()} className="h-9 flex-1 rounded-full bg-bone text-sm font-medium text-ink hover:bg-ember disabled:opacity-40">Add</button>
        <button type="button" disabled={!title.trim()} onClick={() => submit(true)} className="h-9 rounded-full border border-line-2 px-3.5 text-sm text-bone-2 hover:border-bone disabled:opacity-40">Add and open</button>
      </div>
      {added > 0 && <p className="text-xs text-mute" role="status">Added {added} {added === 1 ? 'card' : 'cards'}. Keep typing to add more.</p>}
    </form>
  );
}

function ArchiveDrawer({ canEdit, cards, lists, onClose, onOpen, onRestore, onDelete }: { canEdit: boolean; cards: KCard[]; lists: BoardData['lists']; onClose: () => void; onOpen: (id: string) => void; onRestore: (id: string) => void; onDelete: (id: string) => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-black/50 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside data-lenis-prevent className="flex h-full w-full max-w-sm flex-col border-l border-line-2 bg-ink-2 p-5 shadow-2xl" aria-label="Archived cards">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Archived cards</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-ink-3" aria-label="Close"><Icon name="x" /></button>
        </div>
        <p className="mt-1 text-sm text-mute">Archived cards are hidden from the board and calendar. Restore them any time.</p>
        <ul className="mt-5 flex-1 space-y-2 overflow-y-auto">
          {cards.length === 0 && <li className="rounded-xl border border-dashed border-line-2 p-6 text-center text-sm text-mute">Nothing archived.</li>}
          {cards.map((c) => (
            <li key={c.id} className="rounded-xl border border-line bg-ink p-3">
              <button type="button" onClick={() => onOpen(c.id)} className="block w-full text-left text-sm hover:underline">{c.title}</button>
              <p className="mt-0.5 text-xs text-mute">in {lists.find((l) => l.id === c.listId)?.title}</p>
              {canEdit && <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => onRestore(c.id)} className="h-7 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-bone">Restore</button>
                <button type="button" onClick={() => confirm(`Delete "${c.title}" for good?`) && onDelete(c.id)} className="h-7 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300">Delete</button>
              </div>}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

