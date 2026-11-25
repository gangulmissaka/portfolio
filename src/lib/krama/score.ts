import type { BoardData, KRole } from './model';
import { addDays, todaySL } from './time';

/**
 * Krama's Progress scoring. Pure and deterministic: every viewer computes the same scoreboard from the board data.
 *
 * Points go to the person who ticked a card done (the server stamps who and when, so it can't be faked):
 *   no due date ................. +5
 *   on time (under 3 h early) ... +10
 *   3 h or more early ........... +15
 *   a day or more early ......... +20
 *   3 days or more early ........ +30
 *   finished late ............... -1 for every 10 minutes late (started), at most -100 per card
 * Still open and past its deadline: everyone holding the card's role loses the same -1 per 10 minutes (at most
 * -100), live, until it is done. Cards for ALL or with no role have no single owner, so they carry no such penalty.
 * Sent back for revision: -15 for the person whose work it was.
 * Deadlines are Sri Lanka time; a due date without a time means 23:59 that day.
 */
export const SCORING = {
  noDate: 5,
  onTime: 10,
  early3h: 15,
  early1d: 20,
  early3d: 30,
  lateEvery10Min: 1,
  lateCap: 100,
  revision: 15,
} as const;

const HOUR = 3_600_000;
const TEN_MIN = 600_000;

export const deadlineOf = (dueDate: string, dueTime: string | null) => Date.parse(`${dueDate}T${dueTime ?? '23:59'}:00+05:30`);

export type ScoreKind = 'early3d' | 'early1d' | 'early3h' | 'onTime' | 'noDate' | 'late' | 'overdue' | 'revision';
export type ScoreEvent = { at: number; personId: string; points: number; kind: ScoreKind; cardId: string };

export type PersonScore = {
  id: string;
  name: string;
  image: string | null;
  roles: KRole[];
  isOwner: boolean;
  points: number;
  done: number;
  early: number;
  onTime: number;
  late: number;
  overdueOpen: number;
  revisions: number;
  /** Average hours finished before the deadline (negative = late), over cards with a due date. */
  avgMarginH: number | null;
};

const latePenalty = (ms: number) => -Math.min(SCORING.lateCap, Math.ceil(ms / TEN_MIN) * SCORING.lateEvery10Min);

export function completionPoints(doneAt: number, dueDate: string | null, dueTime: string | null): { points: number; kind: ScoreKind; marginMs: number | null } {
  if (!dueDate) return { points: SCORING.noDate, kind: 'noDate', marginMs: null };
  const margin = deadlineOf(dueDate, dueTime) - doneAt;
  if (margin < 0) return { points: latePenalty(-margin), kind: 'late', marginMs: margin };
  if (margin >= 72 * HOUR) return { points: SCORING.early3d, kind: 'early3d', marginMs: margin };
  if (margin >= 24 * HOUR) return { points: SCORING.early1d, kind: 'early1d', marginMs: margin };
  if (margin >= 3 * HOUR) return { points: SCORING.early3h, kind: 'early3h', marginMs: margin };
  return { points: SCORING.onTime, kind: 'onTime', marginMs: margin };
}

/** The team: the board's creator plus every member who has signed in (people are scored by account). */
export function team(data: Pick<BoardData, 'owner' | 'members' | 'roles'>) {
  const out = [{ id: data.owner.id, name: data.owner.name, image: data.owner.image, roleIds: [] as string[], isOwner: true }];
  for (const m of data.members) {
    if (!m.account || out.some((p) => p.id === m.account!.id)) continue;
    out.push({ id: m.account.id, name: m.name || m.account.name, image: m.account.image, roleIds: m.roleIds, isOwner: false });
  }
  return out;
}

export function scoreBoard(data: Pick<BoardData, 'cards' | 'roles' | 'members' | 'owner' | 'revisions'>, now = Date.now()) {
  const people = team(data);
  const ids = new Set(people.map((p) => p.id));
  const events: ScoreEvent[] = [];
  const margins = new Map<string, number[]>();

  for (const c of Object.values(data.cards)) {
    if (c.archived) continue;
    if (c.dueDone && c.doneBy && c.doneAt && ids.has(c.doneBy)) {
      const at = Date.parse(c.doneAt);
      const { points, kind, marginMs } = completionPoints(at, c.dueDate, c.dueTime);
      events.push({ at, personId: c.doneBy, points, kind, cardId: c.id });
      if (marginMs !== null) margins.set(c.doneBy, [...(margins.get(c.doneBy) ?? []), marginMs / HOUR]);
    } else if (!c.dueDone && c.dueDate && c.roleId) {
      const role = data.roles.find((r) => r.id === c.roleId);
      const late = now - deadlineOf(c.dueDate, c.dueTime);
      if (role && role.code !== 'ALL' && late > 0) {
        for (const p of people) if (p.roleIds.includes(role.id)) events.push({ at: now, personId: p.id, points: latePenalty(late), kind: 'overdue', cardId: c.id });
      }
    }
  }
  for (const r of data.revisions) {
    if (r.targetId && ids.has(r.targetId)) events.push({ at: Date.parse(r.createdAt), personId: r.targetId, points: -SCORING.revision, kind: 'revision', cardId: r.cardId });
  }

  const scores: PersonScore[] = people.map((p) => {
    const mine = events.filter((e) => e.personId === p.id);
    const m = margins.get(p.id) ?? [];
    return {
      id: p.id,
      name: p.name,
      image: p.image,
      roles: p.roleIds.map((id) => data.roles.find((r) => r.id === id)).filter(Boolean) as KRole[],
      isOwner: p.isOwner,
      points: mine.reduce((a, e) => a + e.points, 0),
      done: mine.filter((e) => !['overdue', 'revision'].includes(e.kind)).length,
      early: mine.filter((e) => e.kind.startsWith('early')).length,
      onTime: mine.filter((e) => e.kind === 'onTime').length,
      late: mine.filter((e) => e.kind === 'late').length,
      overdueOpen: mine.filter((e) => e.kind === 'overdue').length,
      revisions: mine.filter((e) => e.kind === 'revision').length,
      avgMarginH: m.length ? m.reduce((a, b) => a + b, 0) / m.length : null,
    };
  });
  scores.sort((a, b) => b.points - a.points || b.done - a.done || (b.avgMarginH ?? -1e9) - (a.avgMarginH ?? -1e9) || a.name.localeCompare(b.name));
  return { scores, events };
}

/** Cumulative points per person at the end of each Sri Lanka day, for the last `days` days (today included). */
export function pointsRace(events: ScoreEvent[], personIds: string[], days = 14, today = todaySL()) {
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i - days + 1));
  const endOf = (d: string) => Date.parse(`${d}T23:59:59.999+05:30`);
  return {
    dates,
    series: personIds.map((id) => ({
      id,
      values: dates.map((d) => events.filter((e) => e.personId === id && e.at <= endOf(d)).reduce((a, e) => a + e.points, 0)),
    })),
  };
}

// ── words for the scoreboard (original lines; a stable pick per person per day so everyone sees the same one) ──
export const CHEERS = [
  'Fastest hands on the board. Take a bow.',
  'Early, sharp and done. This is how it is done.',
  'Deadlines fear you. Keep it up.',
  'Top of the table and making it look easy.',
  'You set the pace today. Everyone else is chasing.',
  'Ticked early, ticked right. Champion work.',
];
export const RUNNER_UP = ['Right on the leader’s heels.', 'One good finish from the top spot.', 'Steady, quick and climbing.'];
export const GLOOMS = [
  'Even the Poya moon has its dim nights.',
  'The monsoon came early for this one.',
  'A quiet week at the bottom of the table.',
  'The deadlines got away this time.',
  'Some days the cards win.',
];
export const HINTS = [
  'Pick the card due soonest and tick it a day early: that is +20 straight away.',
  'Finishing 3 days ahead is worth +30. Small, early wins add up fast.',
  'Overdue cards for your role cost points every 10 minutes. Clear those first.',
  'Check the card before ticking it: a revision costs 15 points.',
  'Use the filter “Cards for my roles” to see exactly what is yours.',
];

export function pickLine(lines: readonly string[], seed: string) {
  let h = 0;
  for (const ch of `${seed}:${todaySL()}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}
