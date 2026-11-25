/**
 * Sri Lanka Standard Time helpers. Krama stores due dates as plain SLST calendar dates ("YYYY-MM-DD") and times
 * ("HH:MM"), so a date never moves when someone opens the app from another time zone. Date maths below works on
 * those strings through UTC Date objects, which have no daylight-saving jumps.
 */
export const SL_TZ = 'Asia/Colombo';
export const SL_LABEL = 'SLST · GMT+5:30';

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: SL_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: SL_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Today's date in Sri Lanka, "YYYY-MM-DD". */
export const todaySL = (now = new Date()) => dayFmt.format(now);
/** Current time in Sri Lanka, "HH:MM". */
export const nowTimeSL = (now = new Date()) => timeFmt.format(now);

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (date: string, n: number) => {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
/** 0 = Monday … 6 = Sunday (Sri Lankan work weeks start on Monday). */
export const weekdayMon0 = (date: string) => (utc(date).getUTCDay() + 6) % 7;
export const isWeekend = (date: string) => weekdayMon0(date) >= 5;
export const daysBetween = (a: string, b: string) => Math.round((utc(b).getTime() - utc(a).getTime()) / 86_400_000);
export const ymd = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export const parts = (date: string) => ({ year: +date.slice(0, 4), month: +date.slice(5, 7), day: +date.slice(8, 10) });

/** The 6 x 7 grid (Monday first) that shows a month, as dates. */
export function monthGrid(year: number, month: number): string[] {
  const first = ymd(year, month, 1);
  const start = addDays(first, -weekdayMon0(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const shiftMonth = (year: number, month: number, by: number) => {
  const m = year * 12 + (month - 1) + by;
  return { year: Math.floor(m / 12), month: (m % 12) + 1 };
};

const f = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts });
const fmtShort = f({ day: 'numeric', month: 'short' });
const fmtShortY = f({ day: 'numeric', month: 'short', year: 'numeric' });
const fmtLong = f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtMonth = f({ month: 'long', year: 'numeric' });
const fmtWeekday = f({ weekday: 'short' });

export const formatMonth = (year: number, month: number) => fmtMonth.format(utc(ymd(year, month, 1)));
export const formatLong = (date: string) => fmtLong.format(utc(date));
export const formatWeekday = (date: string) => fmtWeekday.format(utc(date));
/** "12 Dec", or "12 Dec 2027" outside the current year. */
export const formatShort = (date: string, today = todaySL()) => (date.slice(0, 4) === today.slice(0, 4) ? fmtShort : fmtShortY).format(utc(date));

/** "Today", "Tomorrow", "Yesterday", or a short date. */
export function relativeDay(date: string, today = todaySL()) {
  const d = daysBetween(today, date);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  return formatShort(date, today);
}

/** 12-hour label for "HH:MM". */
export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
