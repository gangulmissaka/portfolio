'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getLenis } from '@/components/motion/SmoothScroll';
import { Avatar } from '@/components/auth/AccountMenu';
import { RelativeTime } from '@/components/ui/RelativeTime';
import { describeHolidays } from '@/lib/krama/holidays';
import { checklistProgress, COLOR_IDS, COLORS, LIMITS, PRIORITY_IDS, uid, type BoardData, type Checklist, type KCard, type KLabel, type LabelColor } from '@/lib/krama/model';
import { formatLong, formatTime, SL_LABEL } from '@/lib/krama/time';
import { DatePicker } from './calendar';
import type { BoardApi } from './store';
import { RoleBadge, useTeam } from './team';
import { AutoTextarea, DueBadge, Icon, InlineEdit, LabelChip, Popover, PopTitle, PriorityMark, ProgressBar, type IconName } from './ui';

type Panel = 'labels' | 'dates' | 'priority' | 'cover' | 'checklist' | 'move' | 'role' | null;

/**
 * Card details. Full access: everything is editable. Read and tick: everything is read-only except the Done
 * button and checklist ticks, and those only on cards for their roles (see canTickCard).
 */
export function CardModal({ cardId, data, api, onClose }: { cardId: string; data: BoardData; api: BoardApi; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const card = data.cards[cardId];
  const [panel, setPanel] = useState<Panel>(null);
  const { perm, roles, canTick, roleOf } = useTeam();
  const edit = perm.canEdit;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    getLenis()?.stop();
    return () => {
      getLenis()?.start();
    };
  }, []);

  // closed elsewhere (deleted, list removed): close the dialog
  useEffect(() => {
    if (!card) onClose();
  }, [card, onClose]);
  if (!card) return null;

  const list = data.lists.find((l) => l.id === card.listId);
  const patch = (p: Parameters<BoardApi['patchCard']>[1]) => api.patchCard(card.id, p);
  const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const cardLabels = card.labelIds.map((id) => data.labels.find((l) => l.id === id)).filter(Boolean) as KLabel[];
  const comments = data.comments[card.id] ?? [];
  const role = roleOf(card.roleId);
  const tickable = canTick(card);
  const itemsTickable = edit || tickable;
  const doneBy = card.doneBy ? (card.doneBy === data.me.id ? 'you' : data.people[card.doneBy]?.name ?? 'a teammate') : null;
  const whoCanTick = role ? (role.code === 'ALL' ? 'Everyone on the board' : `People with the ${role.code} role`) : 'People with full access';
  const notYours = role ? `Only people with the ${role.code} role can tick this card.` : 'Only people with full access can tick this card.';

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (panel) setPanel(null);
        else onClose();
      }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="k-card-title"
      className="k-dialog m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-transparent p-0 text-bone backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      data-lenis-prevent
    >
      <div className="flex min-h-full items-start justify-center px-3 py-6 md:py-14" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <article className="k-modal relative w-full max-w-[52rem] rounded-[1.4rem] border border-line-2 bg-ink-2 shadow-2xl shadow-black/70">
          {card.cover && <div className="h-24 rounded-t-[1.4rem]" style={{ background: COLORS[card.cover].bg }} aria-hidden />}
          <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-ink/70 text-bone-2 backdrop-blur hover:bg-ink hover:text-bone" aria-label="Close card">
            <Icon name="x" />
          </button>

          {card.archived && (
            <div className="flex items-center justify-between gap-3 bg-[#f2c94c]/10 px-6 py-3 text-sm text-[#f3dc8a]">
              <span className="flex items-center gap-2"><Icon name="archive" /> This card is archived.</span>
              {edit && <button type="button" onClick={() => patch({ archived: false })} className="rounded-full border border-current px-3 py-1 text-xs">Restore</button>}
            </div>
          )}

          <div className={`grid gap-8 p-5 md:p-7 ${edit ? 'md:grid-cols-[1fr_12.5rem]' : ''}`}>
            {/* ── main ── */}
            <div className="min-w-0">
              <div className="pr-10" id="k-card-title">
                {edit ? (
                  <InlineEdit value={card.title} label="Card title" maxLength={LIMITS.title} onSave={(t) => patch({ title: t })} className="w-full text-2xl font-medium leading-tight tracking-tight" inputClassName="text-2xl font-medium leading-tight" />
                ) : (
                  <h2 className="text-2xl font-medium leading-tight tracking-tight">{card.title}</h2>
                )}
              </div>
              <p className="mt-1.5 text-sm text-mute">
                in list{' '}
                {edit ? (
                  <button type="button" data-popover-trigger onClick={() => toggle('move')} className="text-bone-2 underline decoration-line-2 underline-offset-4 hover:text-bone">{list?.title}</button>
                ) : (
                  <span className="text-bone-2">{list?.title}</span>
                )}
              </p>

              {/* done */}
              <div className={`mt-5 flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${card.dueDone ? 'border-[#4fbf7a]/40 bg-[#4fbf7a]/[0.07]' : 'border-line bg-ink/40'}`}>
                <button
                  type="button"
                  disabled={!tickable}
                  onClick={() => api.setDone(card.id, !card.dueDone)}
                  aria-pressed={card.dueDone}
                  className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${card.dueDone ? 'bg-[#4fbf7a] text-[#06200f] hover:brightness-110' : 'bg-bone text-ink hover:bg-[#4fbf7a]'}`}
                >
                  <Icon name="check" strokeWidth={2.6} /> {card.dueDone ? 'Done' : 'Mark as done'}
                </button>
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-mute">
                  {card.dueDone && doneBy ? (
                    <>Ticked by <span className="text-bone-2">{doneBy}</span>{card.doneAt && <> · <RelativeTime iso={card.doneAt} /></>}. </>
                  ) : null}
                  {tickable ? (card.dueDone ? 'Click again to reopen it.' : `${whoCanTick} can tick this card.`) : notYours}
                </p>
              </div>

              {/* meta row */}
              <div className="mt-6 flex flex-wrap gap-x-7 gap-y-4">
                {role && (
                  <Meta title="Role">
                    <button type="button" data-popover-trigger disabled={!edit} onClick={() => toggle('role')} className="flex items-center gap-2 rounded-md text-sm text-bone-2 enabled:hover:text-bone">
                      <RoleBadge role={role} size="md" /> <span className="max-w-48 truncate">{role.name}</span>
                    </button>
                  </Meta>
                )}
                {cardLabels.length > 0 && (
                  <Meta title="Labels">
                    <div className="flex flex-wrap gap-1.5">
                      {cardLabels.map((l) =>
                        edit ? (
                          <button key={l.id} type="button" data-popover-trigger onClick={() => toggle('labels')}><LabelChip label={l} /></button>
                        ) : (
                          <LabelChip key={l.id} label={l} />
                        ),
                      )}
                      {edit && <button type="button" data-popover-trigger onClick={() => toggle('labels')} className="grid h-6 w-7 place-items-center rounded-md bg-ink-3 text-mute hover:text-bone" aria-label="Edit labels"><Icon name="plus" className="size-3.5" /></button>}
                    </div>
                  </Meta>
                )}
                {card.dueDate && (
                  <Meta title="Due date">
                    {edit ? (
                      <button type="button" data-popover-trigger onClick={() => toggle('dates')} className="rounded-md bg-ink-3 px-1 hover:bg-ink">
                        <DueBadge card={card} />
                      </button>
                    ) : (
                      <DueBadge card={card} />
                    )}
                  </Meta>
                )}
                {card.priority !== 'none' && (
                  <Meta title="Priority">
                    <button type="button" data-popover-trigger disabled={!edit} onClick={() => toggle('priority')} className="flex h-6 items-center rounded-md bg-ink-3 px-2 enabled:hover:bg-ink">
                      <PriorityMark priority={card.priority} withText />
                    </button>
                  </Meta>
                )}
              </div>
              {card.dueDate && (
                <p className="mt-3 text-xs text-mute">
                  Due {formatLong(card.dueDate)}{card.dueTime ? ` at ${formatTime(card.dueTime)}` : ''} ({SL_LABEL})
                  {describeHolidays(card.dueDate) && <span className="mt-1 block text-[#f3dc8a]">Heads up: {describeHolidays(card.dueDate)}</span>}
                </p>
              )}

              <Description value={card.description} onSave={(d) => patch({ description: d })} readOnly={!edit} />

              {card.checklists.map((cl) => (
                <ChecklistBlock
                  key={cl.id}
                  list={cl}
                  canEdit={edit}
                  canTick={itemsTickable}
                  onTick={(itemId, done) => api.setItem(card.id, cl.id, itemId, done)}
                  onChange={(next) => patch({ checklists: card.checklists.map((x) => (x.id === cl.id ? next : x)) })}
                  onDelete={() => confirm(`Delete the checklist "${cl.title || 'Checklist'}"?`) && patch({ checklists: card.checklists.filter((x) => x.id !== cl.id) })}
                />
              ))}

              <Comments
                comments={comments}
                canWrite={edit}
                canDeleteAll={perm.isOwner || perm.isAdmin}
                myId={data.me.id}
                onAdd={(b) => api.addComment(card.id, b)}
                onDelete={(id) => api.deleteComment(card.id, id)}
                me={data.me}
              />
              {!edit && <p className="mt-8 rounded-xl border border-line bg-ink/40 p-3 text-xs text-mute">You have read and tick access on this board. You can tick cards and checklist items for your roles; ask the project owner if you need to change anything else.</p>}
            </div>

            {/* ── sidebar (full access) ── */}
            {edit && (
              <aside className="relative flex flex-col gap-5">
                <SideGroup title="Add to card">
                  <SideBtn icon="flag" active={panel === 'role'} onClick={() => toggle('role')}>Role</SideBtn>
                  <SideBtn icon="tag" active={panel === 'labels'} onClick={() => toggle('labels')}>Labels</SideBtn>
                  <SideBtn icon="checklist" active={panel === 'checklist'} onClick={() => toggle('checklist')}>Checklist</SideBtn>
                  <SideBtn icon="calendar" active={panel === 'dates'} onClick={() => toggle('dates')}>Due date</SideBtn>
                  <SideBtn icon="sun" active={panel === 'priority'} onClick={() => toggle('priority')}>Priority</SideBtn>
                  <SideBtn icon="palette" active={panel === 'cover'} onClick={() => toggle('cover')}>Cover</SideBtn>
                </SideGroup>
                <SideGroup title="Actions">
                  <SideBtn icon="move" active={panel === 'move'} onClick={() => toggle('move')}>Move</SideBtn>
                  {card.archived ? (
                    <SideBtn icon="restore" onClick={() => patch({ archived: false })}>Restore</SideBtn>
                  ) : (
                    <SideBtn icon="archive" onClick={() => { patch({ archived: true }); onClose(); }}>Archive</SideBtn>
                  )}
                  <SideBtn icon="trash" danger onClick={() => { if (confirm(`Delete "${card.title}"? This can't be undone.`)) { api.deleteCard(card.id); onClose(); } }}>Delete</SideBtn>
                </SideGroup>

                <div className="absolute right-0 top-0 w-full">
                  <Popover open={panel === 'role'} onClose={() => setPanel(null)} label="Role" align="right" className="!top-0 w-80">
                    <PopTitle onClose={() => setPanel(null)}>Role responsible</PopTitle>
                    <p className="mb-2 px-1 text-xs text-mute">Only people with this role can tick the card done. ALL lets the whole team tick it.</p>
                    {roles.map((r) => (
                      <button key={r.id} type="button" onClick={() => { patch({ roleId: r.id }); setPanel(null); }} className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-ink-3 ${card.roleId === r.id ? 'bg-ink-3' : ''}`}>
                        <RoleBadge role={r} />
                        <span className="min-w-0 flex-1 truncate text-bone-2">{r.name}</span>
                        <span className="shrink-0 text-xs text-mute">{data.members.filter((m) => m.roleIds.includes(r.id)).length || ''}</span>
                        {card.roleId === r.id && <Icon name="check" className="size-4 shrink-0 text-ember" />}
                      </button>
                    ))}
                    {card.roleId && <button type="button" onClick={() => { patch({ roleId: null }); setPanel(null); }} className="mt-2 h-9 w-full rounded-full border border-line-2 text-sm text-bone-2 hover:border-bone hover:text-bone">No role</button>}
                    {roles.length === 0 && <p className="px-1 text-sm text-mute">This board has no roles yet.</p>}
                  </Popover>
                  <Popover open={panel === 'labels'} onClose={() => setPanel(null)} label="Labels" align="right" className="!top-0">
                    <LabelsPanel card={card} labels={data.labels} api={api} onClose={() => setPanel(null)} />
                  </Popover>
                  <Popover open={panel === 'dates'} onClose={() => setPanel(null)} label="Due date" align="right" className="!top-0 w-80">
                    <PopTitle onClose={() => setPanel(null)}>Due date</PopTitle>
                    <DatePicker
                      date={card.dueDate}
                      time={card.dueTime}
                      onSave={(d, t) => { patch({ dueDate: d, dueTime: t }); setPanel(null); }}
                      onRemove={() => { patch({ dueDate: null, dueTime: null }); setPanel(null); }}
                    />
                  </Popover>
                  <Popover open={panel === 'priority'} onClose={() => setPanel(null)} label="Priority" align="right" className="!top-0 w-60">
                    <PopTitle onClose={() => setPanel(null)}>Priority</PopTitle>
                    {PRIORITY_IDS.map((p) => (
                      <button key={p} type="button" onClick={() => { patch({ priority: p }); setPanel(null); }} className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm hover:bg-ink-3 ${card.priority === p ? 'bg-ink-3' : ''}`}>
                        <PriorityMark priority={p} withText />
                        {card.priority === p && <Icon name="check" className="size-4 text-ember" />}
                      </button>
                    ))}
                  </Popover>
                  <Popover open={panel === 'cover'} onClose={() => setPanel(null)} label="Cover" align="right" className="!top-0 w-64">
                    <PopTitle onClose={() => setPanel(null)}>Cover colour</PopTitle>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_IDS.map((c) => (
                        <button key={c} type="button" onClick={() => patch({ cover: c })} className={`h-10 rounded-lg transition-transform hover:scale-105 ${card.cover === c ? 'ring-2 ring-bone ring-offset-2 ring-offset-ink-2' : ''}`} style={{ background: COLORS[c].bg }} aria-label={`${COLORS[c].name} cover`} aria-pressed={card.cover === c} />
                      ))}
                    </div>
                    {card.cover && <button type="button" onClick={() => patch({ cover: null })} className="mt-3 h-9 w-full rounded-full border border-line-2 text-sm text-bone-2 hover:border-bone hover:text-bone">Remove cover</button>}
                  </Popover>
                  <Popover open={panel === 'checklist'} onClose={() => setPanel(null)} label="Add checklist" align="right" className="!top-0">
                    <PopTitle onClose={() => setPanel(null)}>Add checklist</PopTitle>
                    <NewChecklist
                      disabled={card.checklists.length >= LIMITS.checklists}
                      onAdd={(title) => { patch({ checklists: [...card.checklists, { id: uid(), title, items: [] }] }); setPanel(null); }}
                    />
                  </Popover>
                  <Popover open={panel === 'move'} onClose={() => setPanel(null)} label="Move card" align="right" className="!top-0">
                    <PopTitle onClose={() => setPanel(null)}>Move to list</PopTitle>
                    {data.lists.map((l) => (
                      <button key={l.id} type="button" disabled={l.id === card.listId} onClick={() => { api.placeCard(card.id, l.id); setPanel(null); }} className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm hover:bg-ink-3 disabled:opacity-50">
                        {l.title}
                        {l.id === card.listId ? <span className="text-xs text-mute">current</span> : <span className="text-xs text-mute">{(data.order[l.id] ?? []).length}</span>}
                      </button>
                    ))}
                    <div className="mt-2 flex gap-2 border-t border-line pt-2">
                      <button type="button" onClick={() => { api.placeCard(card.id, card.listId, 0); setPanel(null); }} className="h-8 flex-1 rounded-full border border-line-2 text-xs text-bone-2 hover:border-bone">To top</button>
                      <button type="button" onClick={() => { api.placeCard(card.id, card.listId); setPanel(null); }} className="h-8 flex-1 rounded-full border border-line-2 text-xs text-bone-2 hover:border-bone">To bottom</button>
                    </div>
                  </Popover>
                </div>
              </aside>
            )}
          </div>
        </article>
      </div>
    </dialog>
  );
}

function Meta({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-mute">{title}</p>
      {children}
    </div>
  );
}

function SideGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-mute">{title}</p>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">{children}</div>
    </div>
  );
}

function SideBtn({ icon, children, onClick, active = false, danger = false }: { icon: IconName; children: ReactNode; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      data-popover-trigger
      onClick={onClick}
      aria-expanded={active || undefined}
      className={`flex h-9 items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${active ? 'bg-bone text-ink' : danger ? 'bg-ink-3/70 text-red-300 hover:bg-red-500/15' : 'bg-ink-3/70 text-bone-2 hover:bg-ink-3 hover:text-bone'}`}
    >
      <Icon name={icon} /> {children}
    </button>
  );
}

function Section({ icon, title, right, children }: { icon: IconName; title: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-3">
        <Icon name={icon} className="size-5 shrink-0 text-mute" />
        <div className="min-w-0 flex-1 font-medium">{title}</div>
        {right}
      </div>
      <div className="md:pl-8">{children}</div>
    </section>
  );
}

function Description({ value, onSave, readOnly }: { value: string; onSave: (v: string) => void; readOnly: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const save = () => {
    setEditing(false);
    if (draft !== value) onSave(draft.slice(0, LIMITS.description));
  };
  if (readOnly) {
    if (!value) return null;
    return (
      <Section icon="text" title="Description">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-bone-2">{value}</p>
      </Section>
    );
  }
  return (
    <Section
      icon="text"
      title="Description"
      right={value && !editing ? <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className="h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-bone hover:text-bone">Edit</button> : null}
    >
      {editing ? (
        <div>
          <AutoTextarea
            autoFocus
            value={draft}
            maxLength={LIMITS.description}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setDraft(value); setEditing(false); }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
            }}
            placeholder="Add more detail. Ctrl + Enter saves."
            aria-label="Description"
            className="min-h-32 w-full rounded-xl border border-ember/50 bg-ink px-3 py-2.5 text-sm leading-relaxed outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={save} className="h-8 rounded-full bg-bone px-4 text-xs font-medium text-ink hover:bg-ember">Save</button>
            <button type="button" onClick={() => { setDraft(value); setEditing(false); }} className="h-8 rounded-full px-3 text-xs text-mute hover:text-bone">Cancel</button>
          </div>
        </div>
      ) : value ? (
        <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className="w-full whitespace-pre-wrap break-words text-left text-sm leading-relaxed text-bone-2">
          {value}
        </button>
      ) : (
        <button type="button" onClick={() => { setDraft(''); setEditing(true); }} className="min-h-16 w-full rounded-xl bg-ink-3/60 px-3 py-2.5 text-left text-sm text-mute transition-colors hover:bg-ink-3">
          Add a more detailed description…
        </button>
      )}
    </Section>
  );
}

function ChecklistBlock({
  list,
  canEdit,
  canTick,
  onTick,
  onChange,
  onDelete,
}: {
  list: Checklist;
  canEdit: boolean;
  canTick: boolean;
  onTick: (itemId: string, done: boolean) => void;
  onChange: (c: Checklist) => void;
  onDelete: () => void;
}) {
  const [hideDone, setHideDone] = useState(false);
  const [adding, setAdding] = useState(canEdit && list.items.length === 0);
  const [draft, setDraft] = useState('');
  const prog = checklistProgress([list]);
  const items = hideDone ? list.items.filter((i) => !i.done) : list.items;
  const add = () => {
    const t = draft.trim().slice(0, LIMITS.item);
    if (t && list.items.length < LIMITS.items) onChange({ ...list, items: [...list.items, { id: uid(), text: t, done: false }] });
    setDraft('');
  };
  return (
    <Section
      icon="checklist"
      title={canEdit ? <InlineEdit value={list.title || 'Checklist'} label="Checklist name" maxLength={LIMITS.checklistTitle} onSave={(t) => onChange({ ...list, title: t })} className="font-medium" /> : list.title || 'Checklist'}
      right={
        <div className="flex shrink-0 gap-1.5">
          {prog.done > 0 && <button type="button" onClick={() => setHideDone((v) => !v)} className="h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-bone">{hideDone ? `Show checked (${prog.done})` : 'Hide checked'}</button>}
          {canEdit && <button type="button" onClick={onDelete} className="h-8 rounded-full border border-line-2 px-3 text-xs text-bone-2 hover:border-red-400 hover:text-red-300">Delete</button>}
        </div>
      }
    >
      <ProgressBar done={prog.done} total={prog.total} />
      <ul className="mt-3 space-y-0.5">
        {items.map((it) => (
          <li key={it.id} className="group flex items-start gap-3 rounded-lg px-1.5 py-1 hover:bg-ink-3/60">
            <input
              type="checkbox"
              checked={it.done}
              disabled={!canTick}
              onChange={(e) => onTick(it.id, e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[#4fbf7a] disabled:cursor-not-allowed"
              aria-label={`Done: ${it.text}`}
            />
            {canEdit ? (
              <InlineEdit
                value={it.text}
                label="Checklist item"
                maxLength={LIMITS.item}
                onSave={(t) => onChange({ ...list, items: list.items.map((x) => (x.id === it.id ? { ...x, text: t } : x)) })}
                className={`flex-1 text-sm leading-relaxed ${it.done ? 'text-mute line-through' : ''}`}
                inputClassName="text-sm"
              />
            ) : (
              <span className={`flex-1 text-sm leading-relaxed ${it.done ? 'text-mute line-through' : ''}`}>{it.text}</span>
            )}
            {canEdit && (
              <button type="button" onClick={() => onChange({ ...list, items: list.items.filter((x) => x.id !== it.id) })} className="grid size-7 shrink-0 place-items-center rounded-full text-mute opacity-0 hover:bg-ink hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Delete item ${it.text}`}>
                <Icon name="x" className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit &&
        (adding ? (
          <div className="mt-2">
            <input
              autoFocus
              value={draft}
              maxLength={LIMITS.item}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); add(); }
                if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setAdding(false); setDraft(''); }
              }}
              placeholder="Add an item, then Enter"
              aria-label="New checklist item"
              className="h-10 w-full rounded-xl border border-ember/50 bg-ink px-3 text-sm outline-none placeholder:text-mute"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={add} className="h-8 rounded-full bg-bone px-4 text-xs font-medium text-ink hover:bg-ember">Add</button>
              <button type="button" onClick={() => { setAdding(false); setDraft(''); }} className="h-8 rounded-full px-3 text-xs text-mute hover:text-bone">Done</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="mt-2 h-8 rounded-full bg-ink-3/70 px-3.5 text-xs text-bone-2 hover:bg-ink-3 hover:text-bone">Add an item</button>
        ))}
    </Section>
  );
}

function NewChecklist({ onAdd, disabled }: { onAdd: (title: string) => void; disabled: boolean }) {
  const [t, setT] = useState('Checklist');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (t.trim()) onAdd(t.trim().slice(0, LIMITS.checklistTitle)); }}>
      <label className="text-xs text-mute" htmlFor="k-cl-title">Title</label>
      <input id="k-cl-title" autoFocus value={t} maxLength={LIMITS.checklistTitle} onChange={(e) => setT(e.target.value)} onFocus={(e) => e.currentTarget.select()} className="mt-1 h-10 w-full rounded-xl border border-line-2 bg-ink px-3 text-sm outline-none focus:border-ember/70" />
      <button type="submit" disabled={disabled} className="mt-3 h-9 w-full rounded-full bg-bone text-sm font-medium text-ink hover:bg-ember disabled:opacity-40">Add checklist</button>
      {disabled && <p className="mt-2 text-xs text-mute">A card can have up to {LIMITS.checklists} checklists.</p>}
    </form>
  );
}

function LabelsPanel({ card, labels, api, onClose }: { card: KCard; labels: KLabel[]; api: BoardApi; onClose: () => void }) {
  const [editing, setEditing] = useState<KLabel | null>(null);
  const toggleLabel = (id: string) =>
    api.patchCard(card.id, { labelIds: card.labelIds.includes(id) ? card.labelIds.filter((x) => x !== id) : [...card.labelIds, id] });

  if (editing) {
    const isNew = !labels.some((l) => l.id === editing.id);
    return (
      <div>
        <PopTitle onClose={() => setEditing(null)}>{isNew ? 'Create label' : 'Edit label'}</PopTitle>
        <div className="mb-3 rounded-xl bg-ink p-4"><LabelChip label={editing} /></div>
        <label className="text-xs text-mute" htmlFor="k-label-name">Name</label>
        <input id="k-label-name" autoFocus value={editing.name} maxLength={LIMITS.label} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-line-2 bg-ink px-3 text-sm outline-none focus:border-ember/70" />
        <p className="mt-3 text-xs text-mute">Colour</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {COLOR_IDS.map((c: LabelColor) => (
            <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })} className={`h-8 rounded-md ${editing.color === c ? 'ring-2 ring-bone ring-offset-2 ring-offset-ink-2' : ''}`} style={{ background: COLORS[c].bg }} aria-label={COLORS[c].name} aria-pressed={editing.color === c} />
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              const label = { ...editing, name: editing.name.trim() };
              api.saveLabel(label);
              if (isNew) api.patchCard(card.id, { labelIds: [...card.labelIds, label.id] });
              setEditing(null);
            }}
            className="h-9 flex-1 rounded-full bg-bone text-sm font-medium text-ink hover:bg-ember"
          >
            {isNew ? 'Create' : 'Save'}
          </button>
          {!isNew && (
            <button type="button" onClick={() => { if (confirm('Delete this label? It will be removed from every card on this board.')) { api.deleteLabel(editing.id); setEditing(null); } }} className="h-9 rounded-full border border-line-2 px-4 text-sm text-bone-2 hover:border-red-400 hover:text-red-300">Delete</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PopTitle onClose={onClose}>Labels</PopTitle>
      <ul className="space-y-1">
        {labels.map((l) => (
          <li key={l.id} className="flex items-center gap-2">
            <input type="checkbox" checked={card.labelIds.includes(l.id)} onChange={() => toggleLabel(l.id)} className="size-4 shrink-0 accent-[var(--color-ember)]" aria-label={`Label ${l.name || COLORS[l.color].name}`} />
            <button type="button" onClick={() => toggleLabel(l.id)} className="min-w-0 flex-1 text-left"><span className="block"><LabelChip label={l} /></span></button>
            <button type="button" onClick={() => setEditing(l)} className="grid size-8 shrink-0 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone" aria-label={`Edit label ${l.name}`}><Icon name="edit" className="size-3.5" /></button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setEditing({ id: uid(), name: '', color: 'blue' })} className="mt-3 h-9 w-full rounded-full border border-line-2 text-sm text-bone-2 hover:border-bone hover:text-bone">Create a new label</button>
    </div>
  );
}

function Comments({
  comments,
  canWrite,
  canDeleteAll,
  myId,
  onAdd,
  onDelete,
  me,
}: {
  comments: BoardData['comments'][string];
  canWrite: boolean;
  canDeleteAll: boolean;
  myId: string;
  onAdd: (b: string) => void;
  onDelete: (id: string) => void;
  me: BoardData['me'];
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const submit = () => {
    const b = draft.trim().slice(0, LIMITS.comment);
    if (b) onAdd(b);
    setDraft('');
  };
  if (!canWrite && comments.length === 0) return null;
  return (
    <Section icon="comment" title="Comments and notes">
      {canWrite && (
        <div className="flex gap-3">
          <span className="shrink-0"><Avatar user={me} size={32} /></span>
          <div className="flex-1">
            <AutoTextarea
              value={draft}
              maxLength={LIMITS.comment}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              placeholder="Write a comment or note…"
              aria-label="New comment"
              className="min-h-10 w-full rounded-xl border border-line-2 bg-ink px-3 py-2.5 text-sm outline-none placeholder:text-mute focus:border-ember/60"
            />
            {(focused || draft) && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={submit} disabled={!draft.trim()} className="mt-2 h-8 rounded-full bg-bone px-4 text-xs font-medium text-ink hover:bg-ember disabled:opacity-40">Save</button>
            )}
          </div>
        </div>
      )}
      <ul className="mt-5 space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="group flex gap-3">
            <span className="shrink-0"><Avatar user={c.author} size={32} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-mute"><span className="font-medium text-bone">{c.author.name}</span> · <RelativeTime iso={c.createdAt} /></p>
              <p className="mt-1 whitespace-pre-wrap break-words rounded-xl bg-ink-3/60 px-3 py-2 text-sm leading-relaxed text-bone-2">{c.body}</p>
              {(canDeleteAll || (canWrite && c.authorId === myId)) && (
                <button type="button" onClick={() => confirm('Delete this comment?') && onDelete(c.id)} className="mt-1 text-xs text-mute opacity-0 hover:text-red-300 focus-visible:opacity-100 group-hover:opacity-100">Delete</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
