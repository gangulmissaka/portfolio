/**
 * Sri Lankan holidays for Krama's calendar and due-date picker.
 *
 * Every day listed is a public holiday and a bank holiday. `mercantile` marks the statutory mercantile holidays
 * (Shop and Office Employees Act) that private-sector offices also close for.
 *
 * Data quality (shown to users):
 * - 2026 and 2027 are OFFICIAL gazetted lists:
 *   2026: Government Printing Department list (Gazette 2404/22 of 27 May 2025); mercantile list from the Commissioner
 *         General of Labour (Newswire, 10 Apr 2026); the day after Vesak moved from 2 May to 31 May by a later
 *         extraordinary gazette (Ada Derana, 23 Apr 2026).
 *   2027: Central Bank of Sri Lanka 2027 bank holidays + Gazette 2493/05 (Daily Mirror, 6 Jul 2026). Eid-ul-Fitr,
 *         Eid al-Adha and Milad-un-Nabi are tentative (moon sighting).
 * - 2025 and 2028 are ESTIMATES: Poya days from moon-phase astronomy (the method matched all 25 official Poya days of
 *   2026-27), fixed dates and Good Friday exact, Islamic holidays can be a day off, and gazette changes can't be
 *   predicted. Generated with the "srilanka" calendar tool in MCP Control.
 */

export type HolidayStatus = 'official' | 'tentative' | 'estimated';
export type Holiday = { date: string; name: string; poya: boolean; mercantile: boolean; status: HolidayStatus };

// [date, name, flags] where flags: M = mercantile, T = tentative
type Row = [string, string, string?];

const OFFICIAL: Record<number, Row[]> = {
  2026: [
    ['2026-01-03', 'Duruthu Full Moon Poya Day'],
    ['2026-01-15', 'Tamil Thai Pongal Day', 'M'],
    ['2026-02-01', 'Navam Full Moon Poya Day'],
    ['2026-02-04', 'Independence Day', 'M'],
    ['2026-02-15', 'Maha Shivaratri Day'],
    ['2026-03-02', 'Medin Full Moon Poya Day'],
    ['2026-03-21', 'Eid-ul-Fitr (Ramazan Festival Day)'],
    ['2026-04-01', 'Bak Full Moon Poya Day'],
    ['2026-04-03', 'Good Friday'],
    ['2026-04-13', 'Day before Sinhala and Tamil New Year', 'M'],
    ['2026-04-14', 'Sinhala and Tamil New Year Day', 'M'],
    ['2026-05-01', 'Vesak Full Moon Poya Day', 'M'],
    ['2026-05-01', "May Day (International Workers' Day)", 'M'],
    ['2026-05-28', 'Eid al-Adha (Hadji Festival Day)'],
    ['2026-05-30', 'Adhi Poson Full Moon Poya Day'],
    ['2026-05-31', 'Day after Vesak (State Vesak Festival)', 'M'],
    ['2026-06-29', 'Poson Full Moon Poya Day'],
    ['2026-07-29', 'Esala Full Moon Poya Day'],
    ['2026-08-26', "Milad-un-Nabi (Holy Prophet's Birthday)", 'M'],
    ['2026-08-27', 'Nikini Full Moon Poya Day'],
    ['2026-09-26', 'Binara Full Moon Poya Day'],
    ['2026-10-25', 'Vap Full Moon Poya Day'],
    ['2026-11-08', 'Deepavali Festival Day'],
    ['2026-11-24', 'Ill Full Moon Poya Day'],
    ['2026-12-23', 'Unduvap Full Moon Poya Day'],
    ['2026-12-25', 'Christmas Day', 'M'],
  ],
  2027: [
    ['2027-01-15', 'Tamil Thai Pongal Day', 'M'],
    ['2027-01-22', 'Duruthu Full Moon Poya Day'],
    ['2027-02-04', 'Independence Day', 'M'],
    ['2027-02-20', 'Navam Full Moon Poya Day'],
    ['2027-03-06', 'Maha Shivaratri Day'],
    ['2027-03-10', 'Eid-ul-Fitr (Ramazan Festival Day)', 'T'],
    ['2027-03-22', 'Medin Full Moon Poya Day'],
    ['2027-03-26', 'Good Friday'],
    ['2027-04-13', 'Day before Sinhala and Tamil New Year', 'M'],
    ['2027-04-14', 'Sinhala and Tamil New Year Day', 'M'],
    ['2027-04-20', 'Bak Full Moon Poya Day'],
    ['2027-05-01', "May Day (International Workers' Day)", 'M'],
    ['2027-05-17', 'Eid al-Adha (Hadji Festival Day)', 'T'],
    ['2027-05-19', 'Vesak Full Moon Poya Day'],
    ['2027-05-20', 'Day after Vesak Full Moon Poya Day', 'M'],
    ['2027-06-18', 'Poson Full Moon Poya Day'],
    ['2027-07-18', 'Esala Full Moon Poya Day'],
    ['2027-08-15', "Milad-un-Nabi (Holy Prophet's Birthday)", 'MT'],
    ['2027-08-16', 'Nikini Full Moon Poya Day'],
    ['2027-09-15', 'Binara Full Moon Poya Day'],
    ['2027-10-15', 'Vap Full Moon Poya Day'],
    ['2027-10-28', 'Deepavali Festival Day'],
    ['2027-11-13', 'Ill Full Moon Poya Day'],
    ['2027-12-13', 'Unduvap Full Moon Poya Day'],
    ['2027-12-25', 'Christmas Day', 'M'],
  ],
};

const ESTIMATED: Record<number, Row[]> = {
  2025: [
    ['2025-01-13', 'Duruthu Full Moon Poya Day'],
    ['2025-01-15', 'Tamil Thai Pongal Day', 'M'],
    ['2025-02-04', 'Independence Day', 'M'],
    ['2025-02-12', 'Navam Full Moon Poya Day'],
    ['2025-02-26', 'Maha Shivaratri Day'],
    ['2025-03-13', 'Medin Full Moon Poya Day'],
    ['2025-04-01', 'Eid-ul-Fitr (Ramazan Festival Day)'],
    ['2025-04-12', 'Bak Full Moon Poya Day'],
    ['2025-04-13', 'Day before Sinhala and Tamil New Year', 'M'],
    ['2025-04-14', 'Sinhala and Tamil New Year Day', 'M'],
    ['2025-04-18', 'Good Friday'],
    ['2025-05-01', "May Day (International Workers' Day)", 'M'],
    ['2025-05-12', 'Vesak Full Moon Poya Day'],
    ['2025-05-13', 'Day after Vesak Full Moon Poya Day', 'M'],
    ['2025-06-08', 'Eid al-Adha (Hadji Festival Day)'],
    ['2025-06-10', 'Poson Full Moon Poya Day'],
    ['2025-07-10', 'Esala Full Moon Poya Day'],
    ['2025-08-08', 'Nikini Full Moon Poya Day'],
    ['2025-09-06', "Milad-un-Nabi (Holy Prophet's Birthday)", 'M'],
    ['2025-09-07', 'Binara Full Moon Poya Day'],
    ['2025-10-06', 'Vap Full Moon Poya Day'],
    ['2025-10-20', 'Deepavali Festival Day'],
    ['2025-11-05', 'Ill Full Moon Poya Day'],
    ['2025-12-04', 'Unduvap Full Moon Poya Day'],
    ['2025-12-25', 'Christmas Day', 'M'],
  ],
  2028: [
    ['2028-01-11', 'Duruthu Full Moon Poya Day'],
    ['2028-01-15', 'Tamil Thai Pongal Day', 'M'],
    ['2028-02-04', 'Independence Day', 'M'],
    ['2028-02-10', 'Navam Full Moon Poya Day'],
    ['2028-02-23', 'Maha Shivaratri Day'],
    ['2028-02-28', 'Eid-ul-Fitr (Ramazan Festival Day)'],
    ['2028-03-10', 'Medin Full Moon Poya Day'],
    ['2028-04-09', 'Bak Full Moon Poya Day'],
    ['2028-04-13', 'Day before Sinhala and Tamil New Year', 'M'],
    ['2028-04-14', 'Good Friday'],
    ['2028-04-14', 'Sinhala and Tamil New Year Day', 'M'],
    ['2028-05-01', "May Day (International Workers' Day)", 'M'],
    ['2028-05-06', 'Eid al-Adha (Hadji Festival Day)'],
    ['2028-05-08', 'Vesak Full Moon Poya Day'],
    ['2028-05-09', 'Day after Vesak Full Moon Poya Day', 'M'],
    ['2028-06-06', 'Poson Full Moon Poya Day'],
    ['2028-07-06', 'Esala Full Moon Poya Day'],
    ['2028-08-04', "Milad-un-Nabi (Holy Prophet's Birthday)", 'M'],
    ['2028-08-04', 'Nikini Full Moon Poya Day'],
    ['2028-09-03', 'Binara Full Moon Poya Day'],
    ['2028-10-03', 'Vap Full Moon Poya Day'],
    ['2028-10-17', 'Deepavali Festival Day'],
    ['2028-11-01', 'Ill Full Moon Poya Day'],
    ['2028-12-01', 'Unduvap Full Moon Poya Day'],
    ['2028-12-25', 'Christmas Day', 'M'],
    ['2028-12-31', 'Duruthu Full Moon Poya Day'],
  ],
};

const toHoliday = (status: HolidayStatus) => ([date, name, f = '']: Row): Holiday => ({
  date,
  name,
  poya: name.includes('Full Moon Poya') && !name.startsWith('Day after'),
  mercantile: f.includes('M'),
  status: f.includes('T') ? 'tentative' : status,
});

export const HOLIDAYS: Holiday[] = [
  ...Object.values(OFFICIAL).flat().map(toHoliday('official')),
  ...Object.values(ESTIMATED).flat().map(toHoliday('estimated')),
].sort((a, b) => a.date.localeCompare(b.date));

export const HOLIDAY_YEARS = { official: [2026, 2027], estimated: [2025, 2028] };

const BY_DATE = new Map<string, Holiday[]>();
for (const h of HOLIDAYS) BY_DATE.set(h.date, [...(BY_DATE.get(h.date) ?? []), h]);

/** All holidays on a date ("YYYY-MM-DD"), usually zero or one; two when e.g. Vesak falls on May Day. */
export const holidaysOn = (date: string): Holiday[] => BY_DATE.get(date) ?? [];

/** The kind used for colouring a day: Poya wins over other public holidays. */
export function dayKind(date: string): 'poya' | 'public' | null {
  const hs = holidaysOn(date);
  if (!hs.length) return null;
  return hs.some((h) => h.poya) ? 'poya' : 'public';
}

export const isMercantile = (date: string) => holidaysOn(date).some((h) => h.mercantile);

/** Holidays from `from` (inclusive), soonest first. */
export const upcomingHolidays = (from: string, count = 5) => HOLIDAYS.filter((h) => h.date >= from).slice(0, count);

export const holidaysInMonth = (year: number, month: number) => {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  return HOLIDAYS.filter((h) => h.date.startsWith(prefix));
};

/** One line describing a date's holidays, e.g. "Christmas Day · public, bank and mercantile holiday". */
export function describeHolidays(date: string): string | null {
  const hs = holidaysOn(date);
  if (!hs.length) return null;
  const kinds = hs.some((h) => h.mercantile) ? 'public, bank and mercantile holiday' : 'public and bank holiday';
  const flag = hs.some((h) => h.status === 'tentative') ? ' (tentative)' : hs.some((h) => h.status === 'estimated') ? ' (estimated)' : '';
  return `${hs.map((h) => h.name).join(' / ')} · ${kinds}${flag}`;
}
