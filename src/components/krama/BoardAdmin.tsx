'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { deleteBoard } from '@/lib/actions/krama';
import { COLORS, dueState, type BoardData } from '@/lib/krama/model';
import { MemberRow, OwnerRoles } from './MembersView';
import { AddMembers } from './people';
import type { BoardApi } from './store';
import { Icon, type IconName } from './ui';

/**
 * The project's own admin panel: the person who created the project (and the Krama admin) add members, set their
 * access and roles, follow progress and see who did what. Nobody else sees this tab.
 */
export function BoardAdmin({ data, api, onOpenCard }: { data: BoardData; api: BoardApi; onOpenCard: (id: string) => void }) {
  const router = useRouter();
  const { board, roles, members, owner, perm, cards, lists } = data;
  const [deleting, setDeleting] = useState(false);
  const active = Object.values(cards).filter((c) => !c.archived);
  const done = active.filter((c) => c.dueDone).length;
  const overdue = active.filter((c) => dueState(c) === 'overdue');
  const pct = active.length ? Math.round((done / active.length) * 100) : 0;
  const byRole = roles
    .map((r) => {
      const rc = active.filter((c) => c.roleId === r.id);
      return { role: r, open: rc.filter((c) => !c.dueDone).length, done: rc.filter((c) => c.dueDone).length, people: members.filter((m) => m.roleIds.includes(r.id)).length };
    })
    .filter((r) => r.open + r.done + r.people > 0);
  const maxRole = Math.max(1, ...byRole.map((r) => r.open + r.done));

  return (
    <div data-lenis-prevent className="k-scroll min-h-0 flex-1 overflow-y-auto px-[var(--gutter)] pb-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-ember/30 bg-ink/70 p-5 backdrop-blur-xl">
          <div>
            <p className="flex items-center gap-2 text-lg font-medium"><Icon name="shield" className="size-5 text-ember" /> Project admin</p>
            <p className="mt-1 text-sm text-mute">
              Only {perm.isOwner ? 'you, as the creator of this project,' : `${owner.name} (the creator) and you`} can see this tab. Add people here and they’ll find “{board.title}” in Labs → Krama.
            </p>
          </div>
          {perm.isAdmin && (
            <Link href={`/labs/krama/admin?from=${board.id}`} className="flex h-10 items-center gap-2 rounded-full border border-line-2 px-4 text-sm text-bone-2 hover:border-bone hover:text-bone">
              <Icon name="board" /> All projects (Krama admin)
            </Link>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat icon="users" label="People" value={members.length + 1} />
          <Stat icon="board" label="Lists" value={lists.length} />
          <Stat icon="checklist" label="Cards" value={active.length} />
          <Stat icon="check" label="Done" value={`${pct}%`} tone="#4fbf7a" />
          <Stat icon="flag" label="Overdue" value={overdue.length} tone={overdue.length ? '#ef5d5d' : undefined} />
        </div>

        <AddMembers boardId={board.id} boardTitle={board.title} roles={roles} members={members} ownerEmail={owner.email} api={api} />

        <section className="rounded-[1.4rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-ba-members">
          <h2 id="k-ba-members" className="text-lg font-medium">Members · {members.length + 1}</h2>
          <p className="mt-1 text-sm text-mute">Change anyone’s access or roles here. Roles decide who can tick which cards, and only people with a role are scored on Progress (you too).</p>
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            <li className="flex flex-wrap items-center gap-4 bg-ember/[0.04] p-4">
              <Avatar user={{ name: owner.name, image: owner.image }} size={40} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{owner.name} {owner.id === data.me.id && <span className="text-xs text-mute">(you)</span>}</p>
                <p className="truncate text-sm text-mute">{owner.email}</p>
              </div>
              <OwnerRoles data={data} api={api} manage />
              <span className="rounded-full bg-ember/15 px-3 py-1 text-xs text-ember">Creator · full access</span>
            </li>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} roles={roles} manage api={api} isMe={m.account?.id === data.me.id} board={board} />
            ))}
            {members.length === 0 && <li className="p-6 text-center text-sm text-mute">No members yet. Use Add members above.</li>}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.4rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-ba-roles">
            <h2 id="k-ba-roles" className="text-lg font-medium">Work by role</h2>
            {byRole.length ? (
              <ul className="mt-4 space-y-3">
                {byRole.map(({ role, open, done: d, people }) => (
                  <li key={role.id} className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 text-sm">
                    <span className="rounded-md px-1.5 py-0.5 text-center font-mono text-xs font-semibold" style={{ background: COLORS[role.color].bg, color: COLORS[role.color].fg }}>{role.code}</span>
                    <span className="flex h-2.5 overflow-hidden rounded-full bg-ink-3" role="img" aria-label={`${role.code}: ${d} done, ${open} open`}>
                      <span className="h-full bg-[#4fbf7a]" style={{ width: `${(d / maxRole) * 100}%` }} />
                      <span className="h-full bg-bone/40" style={{ width: `${(open / maxRole) * 100}%` }} />
                    </span>
                    <span className="whitespace-nowrap text-xs tabular-nums text-mute">{open} open · {d} done · {people} {people === 1 ? 'person' : 'people'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-mute">No roles in use yet. Give cards a role from the card’s Role button.</p>
            )}
            {overdue.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="text-sm font-medium text-[#ff9f9f]">Overdue</p>
                <ul className="mt-2 space-y-1.5">
                  {overdue.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => onOpenCard(c.id)} className="w-full truncate rounded-lg px-2 py-1 text-left text-sm text-bone-2 hover:bg-ink-3 hover:text-bone">{c.title}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-[1.4rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-ba-activity">
            <h2 id="k-ba-activity" className="text-lg font-medium">Recent activity</h2>
            {data.activity.length ? (
              <ul className="k-scroll mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
                {data.activity.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="shrink-0"><Avatar user={{ name: a.user?.name ?? 'Someone', image: a.user?.image ?? null }} size={26} /></span>
                    <p className="min-w-0 flex-1 leading-relaxed text-bone-2">
                      <span className="font-medium text-bone">{a.user?.name ?? 'Someone'}</span>{' '}
                      {a.cardId && cards[a.cardId] ? <button type="button" onClick={() => onOpenCard(a.cardId!)} className="text-left hover:text-bone hover:underline">{a.action}</button> : a.action}
                      <span className="block text-xs text-mute"><RelativeTime iso={a.createdAt} /></span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-mute">Nothing yet.</p>
            )}
          </section>
        </div>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.4rem] border border-red-400/20 bg-red-500/[0.03] p-5">
          <div>
            <p className="font-medium">Delete this project</p>
            <p className="mt-1 text-sm text-mute">Removes its lists, cards, members and history for everyone. This can’t be undone.</p>
          </div>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              if (!confirm(`Delete "${board.title}" for everyone? This can't be undone.`)) return;
              setDeleting(true);
              const r = await deleteBoard(board.id).catch(() => null);
              if (r?.ok) router.push('/labs/krama');
              else { setDeleting(false); alert(r && !r.ok ? r.error : 'The project could not be deleted. Please try again.'); }
            }}
            className="h-10 rounded-full border border-red-400/50 px-5 text-sm text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-40"
          >
            {deleting ? 'Deleting…' : 'Delete project'}
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: IconName; label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-[1.2rem] border border-line bg-ink/70 p-4 backdrop-blur-xl">
      <p className="flex items-center gap-2 text-xs text-mute"><Icon name={icon} className="size-3.5" /> {label}</p>
      <p className="mt-2 text-3xl font-medium tabular-nums tracking-tight" style={tone ? { color: tone } : undefined}>{value}</p>
    </div>
  );
}
