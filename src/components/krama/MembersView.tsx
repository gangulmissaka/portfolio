'use client';

import { useState } from 'react';
import { Avatar } from '@/components/auth/AccountMenu';
import { labsKey } from '@/lib/labs-key';
import { ACCESS, COLOR_IDS, COLORS, LIMITS, uid, type Access, type BoardData, type KMember, type KRole, type LabelColor } from '@/lib/krama/model';
import type { BoardApi } from './store';
import { RoleBadge } from './team';
import { Icon, InlineEdit, kfield } from './ui';

/**
 * Members & Roles. Everyone on the board can see who holds which role; only the Krama admin can change it.
 */
export function MembersView({ data, api }: { data: BoardData; api: BoardApi }) {
  const { roles, members, perm, owner, cards } = data;
  const manage = perm.canManage;
  const openByRole = (id: string) => Object.values(cards).filter((c) => !c.archived && c.roleId === id && !c.dueDone).length;

  return (
    <div data-lenis-prevent className="k-scroll min-h-0 flex-1 overflow-y-auto px-[var(--gutter)] pb-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {!manage && (
          <p className="flex items-center gap-2 rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-bone-2 backdrop-blur">
            <Icon name="lock" className="size-4 shrink-0 text-mute" /> Only the Krama admin can change members and roles. Your access: <b className="font-medium text-bone">{perm.access === 'owner' ? 'Owner' : ACCESS[perm.access].name}</b>
            {perm.roleIds.length > 0 && <> · your roles: {perm.roleIds.map((id) => roles.find((r) => r.id === id)).filter(Boolean).map((r) => <RoleBadge key={r!.id} role={r!} />)}</>}
          </p>
        )}

        {/* ── roles ── */}
        <section className="rounded-[1.4rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-roles">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="k-roles" className="text-xl font-medium tracking-tight">Roles</h2>
              <p className="mt-1 max-w-[60ch] text-sm text-mute">Give each card a role. Only people with that role can tick the card done; a card for ALL can be ticked by the whole team.</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roles.map((r) => (
              <RoleCard key={r.id} role={r} people={members.filter((m) => m.roleIds.includes(r.id))} open={openByRole(r.id)} manage={manage} api={api} />
            ))}
            {manage && <NewRole api={api} existing={roles} />}
          </ul>
        </section>

        {/* ── access levels ── */}
        <section className="grid gap-3 md:grid-cols-2" aria-label="Access levels">
          {(Object.keys(ACCESS) as Access[]).map((a) => (
            <div key={a} className="rounded-[1.2rem] border border-line bg-ink/60 p-5 backdrop-blur">
              <p className="flex items-center gap-2 font-medium">
                <span className={`grid size-7 place-items-center rounded-full ${a === 'full' ? 'bg-ember/15 text-ember' : 'bg-[#5fd0e6]/15 text-[#5fd0e6]'}`}><Icon name={a === 'full' ? 'edit' : 'check'} className="size-3.5" /></span>
                {ACCESS[a].name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{ACCESS[a].body}</p>
            </div>
          ))}
        </section>

        {/* ── members ── */}
        <section className="rounded-[1.4rem] border border-line bg-ink/70 p-5 backdrop-blur-xl md:p-6" aria-labelledby="k-members">
          <h2 id="k-members" className="text-xl font-medium tracking-tight">Members · {members.length + 1}</h2>
          <p className="mt-1 text-sm text-mute">People sign in with the Google account of the email you add here. Adding someone also lets them open Labs and this board.</p>

          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            <li className="flex flex-wrap items-center gap-4 bg-ember/[0.04] p-4">
              <Avatar user={{ name: owner.name, image: owner.image }} size={40} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">{owner.name} {owner.id === data.me.id && <span className="text-xs text-mute">(you)</span>}</p>
                <p className="truncate text-sm text-mute">{owner.email}</p>
              </div>
              <span className="rounded-full bg-ember/15 px-3 py-1 text-xs text-ember">Owner · full access, can tick every card</span>
            </li>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} roles={roles} manage={manage} api={api} isMe={m.account?.id === data.me.id} />
            ))}
            {members.length === 0 && <li className="p-6 text-center text-sm text-mute">{manage ? 'No one else yet. Add your team below.' : 'No other members.'}</li>}
          </ul>

          {manage && <AddMember roles={roles} members={members} ownerEmail={owner.email} api={api} />}
        </section>
      </div>
    </div>
  );
}

function RoleCard({ role, people, open, manage, api }: { role: KRole; people: KMember[]; open: number; manage: boolean; api: BoardApi }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <li><RoleForm initial={role} onSave={(r) => { api.saveRole(r); setEditing(false); }} onCancel={() => setEditing(false)} onDelete={() => { if (confirm(`Delete the ${role.code} role? Cards with this role will have no role, and members lose it.`)) api.deleteRole(role.id); }} /></li>;
  return (
    <li className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-ink-2/70 p-4">
      <div className="flex items-start gap-3">
        <RoleBadge role={role} size="md" />
        <p className="min-w-0 flex-1 text-sm leading-snug text-bone-2">{role.name || <span className="text-mute">No description</span>}</p>
        {manage && (
          <button type="button" onClick={() => setEditing(true)} className="grid size-8 shrink-0 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label={`Edit role ${role.code}`}>
            <Icon name="edit" className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-xs text-mute">
        <span className="flex -space-x-2">
          {people.slice(0, 5).map((p) => (
            <span key={p.id} className="rounded-full ring-2 ring-ink-2" title={p.name || p.email}><Avatar user={{ name: p.name || p.account?.name || p.email, image: p.account?.image ?? null }} size={24} /></span>
          ))}
          {people.length === 0 && <span>{role.code === 'ALL' ? 'Everyone on the board' : 'No one yet'}</span>}
        </span>
        <span>{open} open {open === 1 ? 'card' : 'cards'}</span>
      </div>
    </li>
  );
}

function RoleForm({ initial, onSave, onCancel, onDelete }: { initial?: KRole; onSave: (r: KRole) => void; onCancel: () => void; onDelete?: () => void }) {
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState<LabelColor>(initial?.color ?? 'gray');
  const valid = code.trim().length > 0;
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? uid(), code: code.trim().toUpperCase(), name: name.trim(), color }); }}
      className="flex h-full flex-col gap-3 rounded-2xl border border-ember/50 bg-ink-2 p-4"
    >
      <div className="flex gap-2">
        <input autoFocus value={code} maxLength={LIMITS.roleCode} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="Code" aria-label="Role code" className={`${kfield} w-24 font-mono uppercase`} />
        <input value={name} maxLength={LIMITS.roleName} onChange={(e) => setName(e.target.value)} placeholder="What this role does" aria-label="Role description" className={kfield} />
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Role colour">
        {COLOR_IDS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={COLORS[c].name} onClick={() => setColor(c)} className={`size-7 rounded-md ${color === c ? 'ring-2 ring-bone ring-offset-2 ring-offset-ink-2' : ''}`} style={{ background: COLORS[c].bg }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!valid} className="h-8 rounded-full bg-bone px-4 text-xs font-medium text-ink hover:bg-ember disabled:opacity-40">{initial ? 'Save' : 'Add role'}</button>
        <button type="button" onClick={onCancel} className="h-8 rounded-full px-3 text-xs text-mute hover:text-bone">Cancel</button>
        {onDelete && <button type="button" onClick={onDelete} className="ml-auto h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300">Delete role</button>}
      </div>
    </form>
  );
}

function NewRole({ api, existing }: { api: BoardApi; existing: KRole[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (open) {
    return (
      <li>
        <RoleForm
          onSave={(r) => {
            if (existing.some((x) => x.code === r.code)) return setError(`There is already a ${r.code} role.`);
            api.saveRole(r);
            setOpen(false);
            setError(null);
          }}
          onCancel={() => { setOpen(false); setError(null); }}
        />
        {error && <p className="mt-2 text-xs text-red-300" role="alert">{error}</p>}
      </li>
    );
  }
  return (
    <li>
      <button type="button" onClick={() => setOpen(true)} className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-2 text-sm text-bone-2 transition-colors hover:border-bone hover:text-bone">
        <Icon name="plus" /> Add a role
      </button>
    </li>
  );
}

function AccessSwitch({ value, onChange, disabled = false, name }: { value: Access; onChange: (a: Access) => void; disabled?: boolean; name: string }) {
  return (
    <div className="flex rounded-full border border-line-2 bg-ink p-0.5" role="radiogroup" aria-label={`Access for ${name}`}>
      {(['full', 'tick'] as Access[]).map((a) => (
        <button
          key={a}
          type="button"
          role="radio"
          aria-checked={value === a}
          disabled={disabled}
          onClick={() => onChange(a)}
          title={ACCESS[a].body}
          className={`h-8 whitespace-nowrap rounded-full px-3 text-xs transition-colors disabled:cursor-default ${value === a ? (a === 'full' ? 'bg-ember text-ink' : 'bg-[#5fd0e6] text-[#04232a]') : 'text-mute enabled:hover:text-bone'}`}
        >
          {ACCESS[a].short}
        </button>
      ))}
    </div>
  );
}

function RoleTicks({ roles, value, onChange, disabled = false, name }: { roles: KRole[]; value: string[]; onChange: (ids: string[]) => void; disabled?: boolean; name: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Roles for ${name}`}>
      {roles.map((r) => {
        const on = value.includes(r.id);
        const c = COLORS[r.color];
        return (
          <button
            key={r.id}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            title={`${r.code}: ${r.name}`}
            onClick={() => onChange(on ? value.filter((x) => x !== r.id) : [...value, r.id])}
            className={`flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-[0.7rem] font-semibold transition-colors disabled:cursor-default ${on ? 'border-transparent' : 'border-line-2 text-mute enabled:hover:border-bone enabled:hover:text-bone'}`}
            style={on ? { background: c.bg, color: c.fg } : undefined}
          >
            {on && <Icon name="check" className="size-3" strokeWidth={3} />}
            {r.code}
          </button>
        );
      })}
    </div>
  );
}

function MemberRow({ member, roles, manage, api, isMe }: { member: KMember; roles: KRole[]; manage: boolean; api: BoardApi; isMe: boolean }) {
  const display = member.name || member.account?.name || member.email.split('@')[0];
  return (
    <li className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1.6fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={{ name: display, image: member.account?.image ?? null }} size={40} />
        <div className="min-w-0">
          {manage ? (
            <InlineEdit value={display} label="Member name" maxLength={LIMITS.memberName} onSave={(n) => api.updateMember(member.id, { name: n })} className="max-w-full truncate font-medium" inputClassName="font-medium" />
          ) : (
            <p className="truncate font-medium">{display}</p>
          )}
          <p className="flex items-center gap-1.5 truncate text-sm text-mute">
            <span className={`size-1.5 shrink-0 rounded-full ${member.account ? 'bg-[#4fbf7a]' : 'bg-mute-2'}`} aria-hidden />
            <span className="truncate">{member.email}</span>
            {isMe && <span className="text-xs">(you)</span>}
          </p>
          <p className="sr-only">{member.account ? 'Has signed in' : 'Has not signed in yet'}</p>
        </div>
      </div>
      <AccessSwitch value={member.access} disabled={!manage} name={display} onChange={(a) => api.updateMember(member.id, { access: a })} />
      <RoleTicks roles={roles} value={member.roleIds} disabled={!manage} name={display} onChange={(ids) => api.updateMember(member.id, { roleIds: ids })} />
      {manage ? (
        <button type="button" onClick={() => confirm(`Remove ${display} from this board? They lose access to it straight away.`) && api.removeMember(member.id)} className="h-8 justify-self-start rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300 lg:justify-self-end">
          Remove
        </button>
      ) : (
        <span />
      )}
    </li>
  );
}

function AddMember({ roles, members, ownerEmail, api }: { roles: KRole[]; members: KMember[]; ownerEmail: string; api: BoardApi }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [access, setAccess] = useState<Access>('tick');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setNote({ ok: false, text: 'That doesn’t look like an email address.' });
    if (labsKey(e) === labsKey(ownerEmail)) return setNote({ ok: false, text: 'That is the board owner; they already have full access.' });
    if (members.some((m) => labsKey(m.email) === labsKey(e))) return setNote({ ok: false, text: `${e} is already on this board.` });
    api.addMember({ email: e, name, access, roleIds });
    setNote({ ok: true, text: `Added ${name.trim() || e}. They can sign in with that Google account to open the board.` });
    setEmail('');
    setName('');
    setRoleIds([]);
  };

  return (
    <form onSubmit={(ev) => { ev.preventDefault(); submit(); }} className="mt-5 rounded-2xl border border-dashed border-line-2 p-4">
      <p className="font-medium">Add a member</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="k-m-email" className="text-xs text-mute">Google email</label>
          <input id="k-m-email" type="email" required value={email} maxLength={160} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" autoComplete="off" spellCheck={false} className={`${kfield} mt-1`} />
        </div>
        <div>
          <label htmlFor="k-m-name" className="text-xs text-mute">Name (optional)</label>
          <input id="k-m-name" value={name} maxLength={LIMITS.memberName} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sachini" className={`${kfield} mt-1`} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className="mb-1.5 text-xs text-mute">Access</p>
          <AccessSwitch value={access} onChange={setAccess} name="the new member" />
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 text-xs text-mute">Roles (tick all that apply)</p>
          <RoleTicks roles={roles} value={roleIds} onChange={setRoleIds} name="the new member" />
        </div>
        <button type="submit" disabled={!email.trim()} className="ml-auto h-10 rounded-full bg-bone px-5 text-sm font-medium text-ink transition-colors hover:bg-ember disabled:opacity-40">
          Add member
        </button>
      </div>
      {note && <p role="status" className={`mt-3 text-sm ${note.ok ? 'text-bone-2' : 'text-red-300'}`}>{note.text}</p>}
    </form>
  );
}
