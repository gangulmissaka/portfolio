import { daysBetween, nowTimeSL, todaySL } from './time';

// ── Shapes shared by the server loaders, server actions and the client app ──
export type ChecklistItem = { id: string; text: string; done: boolean };
export type Checklist = { id: string; title: string; items: ChecklistItem[] };
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type KBoard = { id: string; title: string; theme: ThemeId; starred: boolean };
export type KLabel = { id: string; name: string; color: LabelColor };
export type KList = { id: string; title: string };
export type KCard = {
  id: string;
  listId: string;
  title: string;
  description: string;
  dueDate: string | null;
  dueTime: string | null;
  dueDone: boolean;
  priority: Priority;
  cover: CoverColor | null;
  labelIds: string[];
  checklists: Checklist[];
  archived: boolean;
  roleId: string | null;
  doneBy: string | null;
  doneAt: string | null;
  /** Sent back for revision and not ticked again yet. */
  revision: { reason: string; by: string | null; at: string } | null;
  createdAt: string;
};
export type KRevision = { id: string; cardId: string; byId: string | null; targetId: string | null; reason: string; createdAt: string; resolvedAt: string | null };
export type KRole = { id: string; code: string; name: string; color: LabelColor };
export type Access = 'full' | 'tick';
export type KMember = {
  id: string;
  email: string;
  name: string;
  access: Access;
  roleIds: string[];
  /** The account behind the email, once that person has signed in. */
  account: { id: string; name: string; image: string | null } | null;
};
/**
 * What the current person may do on a board. `all` = owner or Krama admin: can tick any card.
 * `canManage` = the board owner and the Krama admin (site admin) edit members and roles.
 */
export type Perm = { canEdit: boolean; canManage: boolean; isOwner: boolean; isAdmin: boolean; all: boolean; roleIds: string[]; access: Access | 'owner' };
export type KComment = { id: string; cardId: string; body: string; createdAt: string; authorId: string; author: { name: string; image: string | null } };

/** Everything the board screen needs, loaded in one go. Lists are in order; `order` holds each list's active cards. */
export type BoardData = {
  board: KBoard;
  boards: { id: string; title: string; theme: ThemeId }[];
  lists: KList[];
  order: Record<string, string[]>;
  cards: Record<string, KCard>;
  labels: KLabel[];
  comments: Record<string, KComment[]>;
  roles: KRole[];
  members: KMember[];
  owner: { id: string; name: string; email: string; image: string | null };
  /** Names for doneBy ids (people who ticked cards). */
  people: Record<string, { name: string; image: string | null }>;
  /** Every revision request on this board (for the Progress scoreboard). */
  revisions: KRevision[];
  /** Latest activity on this board; only loaded for people who manage it (owner, Krama admin). */
  activity: { id: string; action: string; cardId: string | null; createdAt: string; user: { name: string; image: string | null } | null }[];
  perm: Perm;
  me: { id: string; name: string; image: string | null };
};

// ── Team roles ──
export const DEFAULT_ROLES: { code: string; name: string; color: LabelColor }[] = [
  { code: 'PM', name: 'Project manager', color: 'purple' },
  { code: 'BA', name: 'Business analyst and documentation', color: 'sky' },
  { code: 'FE', name: 'Frontend developer and UI designer', color: 'pink' },
  { code: 'BE', name: 'Backend developer', color: 'blue' },
  { code: 'QA', name: 'Tester and security', color: 'green' },
  { code: 'ALL', name: 'Whole team', color: 'orange' },
];
export const ACCESS: Record<Access, { name: string; short: string; body: string }> = {
  full: { name: 'Full access', short: 'Full', body: 'Can add, edit, move and delete lists and cards, and set the role on cards.' },
  tick: { name: 'Read and tick', short: 'Read & tick', body: 'Can see the board and tick cards (and their checklist items) for their own roles. Cannot change anything else.' },
};

/**
 * Who may tick a card done:
 * - the board owner and the Krama admin: any card;
 * - a card with no role: anyone with full access;
 * - a card for ALL: everyone on the board;
 * - otherwise: people holding that role (a member holding ALL counts as every role).
 */
export function canTickCard(perm: Pick<Perm, 'all' | 'canEdit' | 'roleIds'>, card: Pick<KCard, 'roleId'>, roles: Pick<KRole, 'id' | 'code'>[]) {
  if (perm.all) return true;
  if (!card.roleId) return perm.canEdit;
  const role = roles.find((r) => r.id === card.roleId);
  if (!role) return perm.canEdit;
  if (role.code === 'ALL') return true;
  const allId = roles.find((r) => r.code === 'ALL')?.id;
  return perm.roleIds.includes(role.id) || (!!allId && perm.roleIds.includes(allId));
}

// ── Look ──
export const THEMES = {
  ember: { name: 'Ember', swatch: '#f08a3c', bg: 'radial-gradient(120% 90% at 0% 0%, #4a2511 0%, #1c120b 48%, #0f0b08 100%)' },
  ocean: { name: 'Ocean', swatch: '#3aa0c8', bg: 'radial-gradient(120% 90% at 0% 0%, #0f3a4d 0%, #0b1c26 50%, #080e13 100%)' },
  forest: { name: 'Forest', swatch: '#4fae6e', bg: 'radial-gradient(120% 90% at 0% 0%, #163d26 0%, #0e1f15 50%, #090f0b 100%)' },
  plum: { name: 'Plum', swatch: '#a875e0', bg: 'radial-gradient(120% 90% at 0% 0%, #36214f 0%, #1a1226 50%, #0e0a14 100%)' },
  rose: { name: 'Rose', swatch: '#e56b8b', bg: 'radial-gradient(120% 90% at 0% 0%, #4a1a2a 0%, #211017 50%, #120a0d 100%)' },
  gold: { name: 'Saffron', swatch: '#e0b23c', bg: 'radial-gradient(120% 90% at 0% 0%, #47360f 0%, #1f190b 50%, #100d07 100%)' },
  slate: { name: 'Slate', swatch: '#8b93a3', bg: 'radial-gradient(120% 90% at 0% 0%, #2a2f38 0%, #16181d 50%, #0d0e11 100%)' },
  night: { name: 'Night', swatch: '#5b6cf0', bg: 'radial-gradient(120% 90% at 100% 0%, #1d2156 0%, #10122b 50%, #090a16 100%)' },
} as const;
export type ThemeId = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** Label and cover colours: `bg` for chips (readable with dark text), `dot` for small marks. */
export const COLORS = {
  green: { name: 'Green', bg: '#4fbf7a', fg: '#06200f' },
  lime: { name: 'Lime', bg: '#a8d14f', fg: '#1a2306' },
  yellow: { name: 'Yellow', bg: '#f2c94c', fg: '#2b2104' },
  orange: { name: 'Orange', bg: '#f08a3c', fg: '#2b1405' },
  red: { name: 'Red', bg: '#ef5d5d', fg: '#2d0707' },
  pink: { name: 'Pink', bg: '#f27fb2', fg: '#2d0a1b' },
  purple: { name: 'Purple', bg: '#a98bf0', fg: '#170b33' },
  blue: { name: 'Blue', bg: '#5b9cf2', fg: '#06172e' },
  sky: { name: 'Sky', bg: '#5fd0e6', fg: '#04232a' },
  gray: { name: 'Gray', bg: '#a3a3a3', fg: '#151515' },
} as const;
export type LabelColor = keyof typeof COLORS;
export type CoverColor = LabelColor;
export const COLOR_IDS = Object.keys(COLORS) as LabelColor[];

export const DEFAULT_LABELS: { name: string; color: LabelColor }[] = [
  { name: 'Work', color: 'blue' },
  { name: 'Personal', color: 'green' },
  { name: 'Idea', color: 'yellow' },
  { name: 'Waiting', color: 'purple' },
  { name: 'Bug', color: 'red' },
  { name: 'Errand', color: 'sky' },
];

export const PRIORITIES: Record<Priority, { name: string; color: string; rank: number }> = {
  none: { name: 'No priority', color: '#7f766a', rank: 0 },
  low: { name: 'Low', color: '#5fd0e6', rank: 1 },
  medium: { name: 'Medium', color: '#f2c94c', rank: 2 },
  high: { name: 'High', color: '#f08a3c', rank: 3 },
  urgent: { name: 'Urgent', color: '#ef5d5d', rank: 4 },
};
export const PRIORITY_IDS = Object.keys(PRIORITIES) as Priority[];

// ── Limits (enforced on the server, mirrored in the inputs) ──
export const LIMITS = { revision: 500, roleCode: 6, roleName: 60, memberName: 60, title: 200, listTitle: 80, boardTitle: 80, description: 8000, comment: 2000, label: 30, checklistTitle: 80, item: 300, checklists: 10, items: 100 };

// ── Due status ──
export type DueState = 'done' | 'overdue' | 'today' | 'soon' | 'later';
export function dueState(card: Pick<KCard, 'dueDate' | 'dueTime' | 'dueDone'>, today = todaySL(), now = nowTimeSL()): DueState | null {
  if (!card.dueDate) return null;
  if (card.dueDone) return 'done';
  const d = daysBetween(today, card.dueDate);
  if (d < 0 || (d === 0 && card.dueTime && card.dueTime < now)) return 'overdue';
  if (d === 0) return 'today';
  if (d <= 2) return 'soon';
  return 'later';
}
export const DUE_STYLE: Record<DueState, { bg: string; fg: string; label: string }> = {
  done: { bg: '#4fbf7a', fg: '#06200f', label: 'Complete' },
  overdue: { bg: '#ef5d5d', fg: '#2d0707', label: 'Overdue' },
  today: { bg: '#f08a3c', fg: '#2b1405', label: 'Due today' },
  soon: { bg: '#f2c94c', fg: '#2b2104', label: 'Due soon' },
  later: { bg: 'transparent', fg: '#ddd5c8', label: '' },
};

export const checklistProgress = (lists: Checklist[]) => {
  const items = lists.flatMap((l) => l.items);
  return { done: items.filter((i) => i.done).length, total: items.length };
};

export const uid = () => crypto.randomUUID();
