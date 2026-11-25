'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { canTickCard, COLORS, type KCard, type KMember, type KRole, type Perm } from '@/lib/krama/model';

type Team = {
  perm: Perm;
  roles: KRole[];
  members: KMember[];
  canTick: (card: Pick<KCard, 'roleId'>) => boolean;
  roleOf: (id: string | null) => KRole | undefined;
};

const Ctx = createContext<Team | null>(null);

/** Permissions and roles for the open board, available to every Krama component below it. */
export function TeamProvider({ perm, roles, members, children }: { perm: Perm; roles: KRole[]; members: KMember[]; children: ReactNode }) {
  const value = useMemo<Team>(
    () => ({ perm, roles, members, canTick: (card) => canTickCard(perm, card, roles), roleOf: (id) => (id ? roles.find((r) => r.id === id) : undefined) }),
    [perm, roles, members],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTeam() {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTeam outside TeamProvider');
  return t;
}

/** "FE" in the role's colour. */
export function RoleBadge({ role, size = 'sm', title }: { role: KRole; size?: 'sm' | 'md'; title?: string }) {
  const c = COLORS[role.color];
  return (
    <span
      title={title ?? `${role.code}: ${role.name}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold tracking-wide ${size === 'md' ? 'h-7 min-w-10 px-2 text-xs' : 'h-5 min-w-8 px-1.5 text-[0.65rem]'}`}
      style={{ background: c.bg, color: c.fg }}
    >
      {role.code}
    </span>
  );
}
