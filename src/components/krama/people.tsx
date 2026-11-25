'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Avatar } from '@/components/auth/AccountMenu';
import { searchPeople, type PersonHit } from '@/lib/actions/krama';
import { labsKey } from '@/lib/labs-key';
import { ACCESS, COLORS, type Access, type KMember, type KRole } from '@/lib/krama/model';
import { CopyInvite } from './invite';
import type { BoardApi } from './store';
import { Icon } from './ui';

type Chosen = { email: string; name: string; image: string | null; account: boolean };
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/**
 * "Add members": search the people who have signed in (by name or Gmail), pick one or more, choose their access
 * and roles, add. Anyone else can be added by typing their full email; they get access once they sign in.
 */
export function AddMembers({
  boardId,
  boardTitle,
  roles,
  members,
  ownerEmail,
  api,
}: {
  boardId: string;
  boardTitle: string;
  roles: KRole[];
  members: KMember[];
  ownerEmail: string;
  api: BoardApi;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<PersonHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Chosen[]>([]);
  const [access, setAccess] = useState<Access>('tick');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [added, setAdded] = useState<Chosen[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const seq = useRef(0);

  // search as you type (debounced); the server decides whose accounts this person may see
  useEffect(() => {
    if (!open) return;
    const n = ++seq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchPeople(boardId, query).catch(() => ({ ok: false as const, error: 'Search failed. Try again.' }));
      if (n !== seq.current) return;
      setLoading(false);
      if (r.ok) { setHits(r.people); setError(null); setActive(0); }
      else setError(r.error);
    }, query ? 200 : 0);
    return () => clearTimeout(t);
  }, [query, open, boardId]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const memberKeys = new Set([...members.map((m) => labsKey(m.email)), labsKey(ownerEmail)]);
  const pickedKeys = new Set(picked.map((p) => labsKey(p.email)));
  const typedEmail = isEmail(query) && !hits.some((h) => labsKey(h.email) === labsKey(query)) ? query.trim().toLowerCase() : null;
  type Option = { kind: 'account'; hit: PersonHit } | { kind: 'email'; email: string };
  const options: Option[] = [...hits.map((hit) => ({ kind: 'account' as const, hit })), ...(typedEmail ? [{ kind: 'email' as const, email: typedEmail }] : [])];
  const disabledOpt = (o: Option) => {
    const key = labsKey(o.kind === 'account' ? o.hit.email : o.email);
    return memberKeys.has(key) || pickedKeys.has(key);
  };

  const choose = (o: Option) => {
    if (disabledOpt(o)) return;
    setPicked((p) => [...p, o.kind === 'account' ? { email: o.hit.email.toLowerCase(), name: o.hit.name, image: o.hit.image, account: true } : { email: o.email, name: '', image: null, account: false }]);
    setQuery('');
    setAdded(null);
  };

  const submit = () => {
    for (const p of picked) api.addMember({ email: p.email, name: p.name, access, roleIds });
    setAdded(picked);
    setPicked([]);
    setRoleIds([]);
  };

  return (
    <div className="rounded-2xl border border-line bg-ink-2/70 p-4 md:p-5">
      <p className="flex items-center gap-2 font-medium"><Icon name="users" /> Add members</p>
      <p className="mt-1 text-sm text-mute">Search people who have signed in with Google, pick one or more, then choose what they can do.</p>

      {/* picker */}
      <div ref={box} className="relative mt-4">
        <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line-2 bg-ink px-2 py-1.5 focus-within:border-ember/70">
          {picked.map((p) => (
            <span key={p.email} className="flex items-center gap-1.5 rounded-full bg-ink-3 py-0.5 pl-0.5 pr-1 text-xs">
              <Avatar user={{ name: p.name || p.email, image: p.image }} size={22} />
              <span className="max-w-40 truncate">{p.name || p.email}</span>
              <button type="button" onClick={() => setPicked((x) => x.filter((y) => y.email !== p.email))} className="grid size-5 place-items-center rounded-full text-mute hover:bg-ink hover:text-bone" aria-label={`Remove ${p.name || p.email}`}>
                <Icon name="x" className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (options[active]) choose(options[active]); }
              else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); }
              else if (e.key === 'Backspace' && !query && picked.length) setPicked((p) => p.slice(0, -1));
            }}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label="Search people by name or Gmail"
            placeholder={picked.length ? 'Add another…' : 'Search by name or Gmail…'}
            autoComplete="off"
            spellCheck={false}
            className="h-8 min-w-40 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-mute"
          />
        </div>
        {open && (
          <ul id={listId} role="listbox" data-lenis-prevent className="k-pop k-scroll absolute inset-x-0 top-[calc(100%+0.4rem)] z-[60] max-h-72 overflow-y-auto rounded-2xl border border-line-2 bg-ink-2/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {loading && !options.length && <li className="px-3 py-2.5 text-sm text-mute">Searching…</li>}
            {error && <li className="px-3 py-2.5 text-sm text-red-300">{error}</li>}
            {!loading && !error && !options.length && (
              <li className="px-3 py-2.5 text-sm text-mute">{query ? 'No one found. Type their full Gmail address to add them anyway.' : 'No one to show yet. Type a Gmail address to add someone.'}</li>
            )}
            {options.map((o, i) => {
              const off = disabledOpt(o);
              const key = o.kind === 'account' ? o.hit.id : `email:${o.email}`;
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={off}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm ${i === active && !off ? 'bg-ink-3' : ''} ${off ? 'cursor-default opacity-45' : ''}`}
                >
                  {o.kind === 'account' ? (
                    <>
                      <Avatar user={{ name: o.hit.name, image: o.hit.image }} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{o.hit.name}</span>
                        <span className="block truncate text-xs text-mute">{o.hit.email}</span>
                      </span>
                      <span className="shrink-0 text-xs text-mute">{memberKeys.has(labsKey(o.hit.email)) ? 'Already on this project' : pickedKeys.has(labsKey(o.hit.email)) ? 'Selected' : ''}</span>
                    </>
                  ) : (
                    <>
                      <span className="grid size-[30px] shrink-0 place-items-center rounded-full border border-dashed border-line-2 text-mute"><Icon name="plus" className="size-3.5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">Add {o.email}</span>
                        <span className="block text-xs text-mute">Hasn’t signed in yet; they get access when they do</span>
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* access + roles */}
      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="mb-1.5 text-xs text-mute">Access</p>
          <div className="flex rounded-full border border-line-2 bg-ink p-0.5" role="radiogroup" aria-label="Access for new members">
            {(['full', 'tick'] as Access[]).map((a) => (
              <button key={a} type="button" role="radio" aria-checked={access === a} onClick={() => setAccess(a)} title={ACCESS[a].body} className={`h-8 whitespace-nowrap rounded-full px-3 text-xs transition-colors ${access === a ? (a === 'full' ? 'bg-ember text-ink' : 'bg-[#5fd0e6] text-[#04232a]') : 'text-mute hover:text-bone'}`}>
                {ACCESS[a].short}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-1.5 text-xs text-mute">Roles (tick all that apply)</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Roles for new members">
            {roles.map((r) => {
              const on = roleIds.includes(r.id);
              return (
                <button key={r.id} type="button" aria-pressed={on} title={`${r.code}: ${r.name}`} onClick={() => setRoleIds(on ? roleIds.filter((x) => x !== r.id) : [...roleIds, r.id])} className={`flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-[0.7rem] font-semibold transition-colors ${on ? 'border-transparent' : 'border-line-2 text-mute hover:border-bone hover:text-bone'}`} style={on ? { background: COLORS[r.color].bg, color: COLORS[r.color].fg } : undefined}>
                  {on && <Icon name="check" className="size-3" strokeWidth={3} />}
                  {r.code}
                </button>
              );
            })}
          </div>
        </div>
        <button type="button" onClick={submit} disabled={!picked.length} className="ml-auto h-10 rounded-full bg-bone px-5 text-sm font-medium text-ink transition-colors hover:bg-ember disabled:opacity-40">
          {picked.length > 1 ? `Add ${picked.length} members` : 'Add member'}
        </button>
      </div>

      {added && added.length > 0 && (
        <div role="status" className="mt-4 rounded-xl border border-[#4fbf7a]/30 bg-[#4fbf7a]/[0.06] p-3 text-sm text-bone-2">
          <p>
            Added {added.map((p) => p.name || p.email).join(', ')}. They’ll see “{boardTitle}” under <b className="font-medium text-bone">Shared with you</b> in Labs → Krama.
          </p>
          {added.some((p) => !p.account) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-mute">Not signed in yet:</span>
              {added.filter((p) => !p.account).map((p) => (
                <span key={p.email} className="flex items-center gap-2 text-xs">
                  {p.email} <CopyInvite boardId={boardId} boardTitle={boardTitle} email={p.email} compact />
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
