'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { deleteBoard, removeMember, updateMember, type KramaResult } from '@/lib/actions/krama';
import type { AdminData } from '@/lib/krama/data';
import { ACCESS, COLORS, THEMES, type Access } from '@/lib/krama/model';
import { formatShort } from '@/lib/krama/time';
import { Icon, type IconName } from './ui';

type Tab = 'overview' | 'boards' | 'people' | 'activity';
const TABS: { id: Tab; name: string; icon: IconName }[] = [
  { id: 'overview', name: 'Overview', icon: 'board' },
  { id: 'boards', name: 'Boards', icon: 'calendar' },
  { id: 'people', name: 'People & access', icon: 'users' },
  { id: 'activity', name: 'Activity', icon: 'clock' },
];

/**
 * Krama control panel for the admin: everything across every board in one place. Changes go through the same
 * server actions as the board screens (each re-checks that the caller is the Krama admin).
 */
export function KramaAdmin({ data, from, initialTab, me }: { data: AdminData; from: string | null; initialTab: string | null; me: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? (initialTab as Tab) : 'overview');
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  /** Run an action, show the result, reload the panel's data. */
  const run = (fn: () => Promise<KramaResult>, done: string) =>
    start(async () => {
      const r = await fn().catch(() => ({ ok: false as const, error: 'Something went wrong. Please try again.' }));
      setNote(r.ok ? { ok: true, text: done } : { ok: false, text: r.error });
      router.refresh();
    });

  const totals = useMemo(() => {
    const cards = data.boards.reduce((a, b) => a + b.cards, 0);
    const done = data.boards.reduce((a, b) => a + b.done, 0);
    return { boards: data.boards.length, people: data.people.length, cards, done, open: cards - done, overdue: data.overdue.length };
  }, [data]);
  const fromBoard = from ? data.boards.find((b) => b.id === from) : null;

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]" aria-busy={pending}>
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Link href="/labs/krama" className="hover:text-bone">Krama</Link> <span aria-hidden>/</span> <span className="text-ember">Admin</span>
          </p>
          <h1 className="h-lg mt-3">Control panel</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-mute">Everything across every Krama board. Only you ({me}) can see this page or change members, roles and access.</p>
        </div>
        {fromBoard && (
          <Link href={`/labs/krama/b/${fromBoard.id}`} className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-sm text-bone-2 hover:border-bone hover:text-bone">
            <Icon name="back" /> Back to {fromBoard.title}
          </Link>
        )}
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition-colors ${tab === t.id ? 'bg-bone text-ink' : 'text-bone-2 hover:bg-ink-2 hover:text-bone'}`}>
            <Icon name={t.icon} className="size-4" /> {t.name}
            {t.id === 'people' && <span className="font-mono text-xs opacity-60">{data.people.length}</span>}
            {t.id === 'boards' && <span className="font-mono text-xs opacity-60">{data.boards.length}</span>}
          </button>
        ))}
      </nav>

      {note && (
        <p role="status" className={`mt-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${note.ok ? 'border-[#4fbf7a]/30 bg-[#4fbf7a]/[0.06] text-bone-2' : 'border-red-400/30 bg-red-500/[0.06] text-red-200'}`}>
          {note.text}
          <button type="button" onClick={() => setNote(null)} className="text-mute hover:text-bone" aria-label="Dismiss"><Icon name="x" className="size-3.5" /></button>
        </p>
      )}

      <div className="mt-8">
        {tab === 'overview' && <Overview data={data} totals={totals} onTab={setTab} />}
        {tab === 'boards' && <Boards data={data} onDelete={(id, title) => confirm(`Delete the board "${title}" with all its lists, cards, members and history? This can't be undone.`) && run(() => deleteBoard(id), `Deleted "${title}".`)} />}
        {tab === 'people' && (
          <People
            data={data}
            onAccess={(boardId, memberId, access, who) => run(() => updateMember(boardId, memberId, { access }), `${who} now has ${ACCESS[access].name.toLowerCase()} on that board.`)}
            onRemove={(boardId, memberId, who, board) => confirm(`Remove ${who} from "${board}"?`) && run(() => removeMember(boardId, memberId), `Removed ${who} from "${board}".`)}
            onRemoveAll={(person) => {
              if (!confirm(`Remove ${person.name || person.email} from all ${person.boards.length} boards? They lose access to Krama unless they also have Labs access.`)) return;
              run(async () => {
                for (const b of person.boards) {
                  const r = await removeMember(b.boardId, b.memberId);
                  if (!r.ok) return r;
                }
                return { ok: true };
              }, `Removed ${person.name || person.email} from every board.`);
            }}
          />
        )}
        {tab === 'activity' && <Activity data={data} />}
      </div>
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: number | string; tone?: string; icon: IconName }) {
  return (
    <div className="rounded-[1.2rem] border border-line bg-ink-2/60 p-5">
      <p className="flex items-center gap-2 text-xs text-mute"><Icon name={icon} className="size-3.5" /> {label}</p>
      <p className="mt-3 text-4xl font-medium tabular-nums tracking-tight" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  );
}

function Overview({ data, totals, onTab }: { data: AdminData; totals: { boards: number; people: number; cards: number; done: number; open: number; overdue: number }; onTab: (t: Tab) => void }) {
  const pct = totals.cards ? Math.round((totals.done / totals.cards) * 100) : 0;
  const maxRole = Math.max(1, ...data.roleWork.map((r) => r.open + r.done));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Boards" value={totals.boards} icon="board" />
        <Stat label="Invited people" value={totals.people} icon="users" />
        <Stat label="Active cards" value={totals.cards} icon="checklist" />
        <Stat label="Open" value={totals.open} icon="clock" />
        <Stat label="Done" value={`${pct}%`} tone="#4fbf7a" icon="check" />
        <Stat label="Overdue" value={totals.overdue} tone={totals.overdue ? '#ef5d5d' : undefined} icon="flag" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.4rem] border border-line bg-ink-2/60 p-6" aria-labelledby="k-a-roles">
          <h2 id="k-a-roles" className="text-lg font-medium">Work by role</h2>
          <p className="mt-1 text-sm text-mute">Cards with a role, across every board. Green is done.</p>
          {data.roleWork.length ? (
            <ul className="mt-5 space-y-3.5">
              {data.roleWork.map((r) => (
                <li key={r.code} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-semibold" style={{ background: COLORS[r.color].bg, color: COLORS[r.color].fg }}>{r.code}</span>
                  <span className="flex h-2.5 overflow-hidden rounded-full bg-ink-3" role="img" aria-label={`${r.code}: ${r.done} done, ${r.open} open`}>
                    <span className="h-full bg-[#4fbf7a]" style={{ width: `${(r.done / maxRole) * 100}%` }} />
                    <span className="h-full bg-bone/40" style={{ width: `${(r.open / maxRole) * 100}%` }} />
                  </span>
                  <span className="whitespace-nowrap text-xs tabular-nums text-mute">
                    {r.open} open · {r.done} done{r.overdue > 0 && <span className="text-[#ff9f9f]"> · {r.overdue} late</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-mute">No cards have a role yet. Open a card and choose Role.</p>
          )}
        </section>

        <section className="rounded-[1.4rem] border border-line bg-ink-2/60 p-6" aria-labelledby="k-a-late">
          <h2 id="k-a-late" className="text-lg font-medium">Overdue</h2>
          {data.overdue.length ? (
            <ul className="mt-4 space-y-2">
              {data.overdue.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <Link href={`/labs/krama/b/${o.boardId}?card=${o.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-ink p-3 text-sm hover:border-line-2">
                    <span className="rounded-md bg-[#ef5d5d] px-1.5 py-0.5 text-xs font-medium text-[#2d0707]">{formatShort(o.dueDate)}</span>
                    <span className="min-w-0 flex-1 truncate">{o.title}</span>
                    {o.roleCode && <span className="font-mono text-xs text-mute">{o.roleCode}</span>}
                    <span className="hidden truncate text-xs text-mute sm:block">{o.boardTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-mute">Nothing is overdue. Nice.</p>
          )}
        </section>
      </div>

      <section className="rounded-[1.4rem] border border-line bg-ink-2/60 p-6" aria-labelledby="k-a-recent">
        <div className="flex items-center justify-between gap-3">
          <h2 id="k-a-recent" className="text-lg font-medium">Latest activity</h2>
          <button type="button" onClick={() => onTab('activity')} className="text-sm text-bone-2 hover:text-bone">See all →</button>
        </div>
        <ActivityList items={data.activity.slice(0, 10)} />
      </section>
    </div>
  );
}

function Boards({ data, onDelete }: { data: AdminData; onDelete: (id: string, title: string) => void }) {
  if (!data.boards.length) return <p className="rounded-2xl border border-dashed border-line-2 p-10 text-center text-mute">No boards yet.</p>;
  return (
    <ul className="grid gap-3">
      {data.boards.map((b) => {
        const pct = b.cards ? Math.round((b.done / b.cards) * 100) : 0;
        return (
          <li key={b.id} className="grid gap-4 rounded-[1.2rem] border border-line bg-ink-2/60 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <span className="hidden h-12 w-16 rounded-lg border border-line md:block" style={{ background: THEMES[b.theme]?.bg }} aria-hidden />
            <div className="min-w-0">
              <Link href={`/labs/krama/b/${b.id}`} className="font-medium hover:underline">{b.title}</Link>
              <p className="mt-0.5 text-xs text-mute">
                Owner {b.ownerName} · {b.lists} lists · {b.cards} cards · {b.members} {b.members === 1 ? 'member' : 'members'} · {b.lastActivity ? <>active <RelativeTime iso={b.lastActivity} /></> : <>created <RelativeTime iso={b.createdAt} /></>}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 w-40 overflow-hidden rounded-full bg-ink-3"><span className="block h-full rounded-full bg-[#4fbf7a]" style={{ width: `${pct}%` }} /></span>
                <span className="text-xs tabular-nums text-mute">{pct}% done</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/labs/krama/b/${b.id}`} className="h-8 rounded-full border border-line-2 px-3 text-xs leading-8 text-bone-2 hover:border-bone hover:text-bone">Open</Link>
              <Link href={`/labs/krama/b/${b.id}?view=members`} className="h-8 rounded-full border border-line-2 px-3 text-xs leading-8 text-bone-2 hover:border-bone hover:text-bone">Members &amp; roles</Link>
              <button type="button" onClick={() => onDelete(b.id, b.title)} className="h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300">Delete</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function People({
  data,
  onAccess,
  onRemove,
  onRemoveAll,
}: {
  data: AdminData;
  onAccess: (boardId: string, memberId: string, access: Access, who: string) => void;
  onRemove: (boardId: string, memberId: string, who: string, board: string) => void;
  onRemoveAll: (person: AdminData['people'][number]) => void;
}) {
  const [q, setQ] = useState('');
  const list = data.people.filter((p) => !q || `${p.name} ${p.email} ${p.account?.name ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[62ch] text-sm text-mute">Everyone invited to a board. Click an access chip to switch between full access and read and tick. To add people or change roles, open the board&apos;s Members &amp; roles.</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people" className="h-10 w-64 rounded-full border border-line-2 bg-ink px-4 text-sm placeholder:text-mute focus:border-ember/60 focus:outline-none" />
      </div>
      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line-2 p-10 text-center text-mute">{data.people.length ? 'No one matches.' : 'No one has been invited yet. Add people from a board’s Members & roles tab.'}</p>
      ) : (
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[1.2rem] border border-line">
          {list.map((p) => {
            const who = p.name || p.account?.name || p.email;
            return (
              <li key={p.key} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] lg:items-start">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={{ name: who, image: p.account?.image ?? null }} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{who}</p>
                    <p className="truncate text-xs text-mute">{p.email}</p>
                    <p className={`text-xs ${p.account ? 'text-[#7fd9a0]' : 'text-mute'}`}>{p.account ? 'Has signed in' : 'Not signed in yet'}</p>
                  </div>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {p.boards.map((b) => (
                    <li key={b.memberId} className="flex items-center gap-1.5 rounded-xl border border-line bg-ink py-1 pl-3 pr-1 text-xs">
                      <Link href={`/labs/krama/b/${b.boardId}?view=members`} className="max-w-40 truncate text-bone-2 hover:text-bone">{b.boardTitle}</Link>
                      {b.roles.map((r) => (
                        <span key={r.code} className="rounded px-1 font-mono text-[0.6rem] font-semibold" style={{ background: COLORS[r.color].bg, color: COLORS[r.color].fg }}>{r.code}</span>
                      ))}
                      <button
                        type="button"
                        onClick={() => onAccess(b.boardId, b.memberId, b.access === 'full' ? 'tick' : 'full', who)}
                        title="Click to switch access"
                        className={`rounded-full px-2 py-0.5 transition-colors ${b.access === 'full' ? 'bg-ember/20 text-ember hover:bg-ember/30' : 'bg-[#5fd0e6]/15 text-[#5fd0e6] hover:bg-[#5fd0e6]/25'}`}
                      >
                        {ACCESS[b.access].short}
                      </button>
                      <button type="button" onClick={() => onRemove(b.boardId, b.memberId, who, b.boardTitle)} className="grid size-6 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-red-300" aria-label={`Remove ${who} from ${b.boardTitle}`}>
                        <Icon name="x" className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => onRemoveAll(p)} className="h-8 justify-self-start rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300 lg:justify-self-end">
                  Remove from all boards
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActivityList({ items }: { items: AdminData['activity'] }) {
  if (!items.length) return <p className="mt-4 text-sm text-mute">Nothing yet.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 text-sm">
          <span className="shrink-0"><Avatar user={{ name: a.userName ?? 'Someone', image: a.userImage }} size={28} /></span>
          <p className="min-w-0 flex-1 leading-relaxed text-bone-2">
            <span className="font-medium text-bone">{a.userName ?? 'Someone'}</span> {a.action}
            <span className="block text-xs text-mute">
              {a.cardId ? <Link href={`/labs/krama/b/${a.boardId}?card=${a.cardId}`} className="hover:text-bone">{a.boardTitle}</Link> : <Link href={`/labs/krama/b/${a.boardId}`} className="hover:text-bone">{a.boardTitle}</Link>} · <RelativeTime iso={a.createdAt} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function Activity({ data }: { data: AdminData }) {
  const [board, setBoard] = useState('');
  const [q, setQ] = useState('');
  const items = data.activity.filter((a) => (!board || a.boardId === board) && (!q || `${a.userName ?? ''} ${a.action}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <select value={board} onChange={(e) => setBoard(e.target.value)} aria-label="Filter by board" className="h-10 rounded-full border border-line-2 bg-ink px-4 text-sm [color-scheme:dark] focus:border-ember/60 focus:outline-none">
          <option value="">All boards</option>
          {data.boards.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity (a name, “ticked”…)" aria-label="Search activity" className="h-10 w-72 rounded-full border border-line-2 bg-ink px-4 text-sm placeholder:text-mute focus:border-ember/60 focus:outline-none" />
        <p className="self-center text-xs text-mute">Showing {items.length} of the latest {data.activity.length} events</p>
      </div>
      <div className="mt-5 rounded-[1.4rem] border border-line bg-ink-2/60 p-6">
        <ActivityList items={items} />
      </div>
    </div>
  );
}
