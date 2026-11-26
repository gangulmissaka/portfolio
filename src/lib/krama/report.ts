import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';
import { ACCESS, DUE_STYLE, PRIORITIES, dueState, type BoardData, type KCard } from './model';
import { completionPoints, scoreBoard } from './score';
import { todaySL } from './time';

/**
 * Krama progress report as a PDF, built in the browser from the board data already on screen (so it matches the
 * board and the Progress tab exactly). pdf-lib is loaded only when someone asks for a report.
 *
 * Sections: summary, team (names, first names, roles, access, done/open, points), roles, finished cards, and
 * what is still to do grouped by list. Text uses the PDF standard Helvetica font, which covers Latin text;
 * characters outside it (for example Sinhala or emoji) print as "?". Names fall back to a version that prints
 * (first name, board name, Google account name, email) before that happens.
 */

type Rgb = RGB;
type Ctx = { doc: PDFDocument; font: PDFFont; bold: PDFFont; page: PDFPage; y: number; rgb: (r: number, g: number, b: number) => Rgb };

const A4 = { w: 595.28, h: 841.89 };
const M = 44; // page margin
const W = A4.w - M * 2;
const FOOT = 40;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255] as const;

const fmtDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' }).format(new Date(iso));
const fmtDateTime = (d: Date) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Colombo' }).format(d);
const fmtDue = (c: Pick<KCard, 'dueDate' | 'dueTime'>) => (c.dueDate ? `${fmtDate(`${c.dueDate}T12:00:00+05:30`)}${c.dueTime ? `, ${c.dueTime}` : ''}` : '-');

export function reportFileName(title: string) {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'project';
  return `${slug}-progress-${todaySL()}.pdf`;
}

export async function buildReport(data: BoardData, now = new Date()): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(`${data.board.title}: progress report`);
  doc.setSubject('Krama progress report');
  doc.setCreator('Krama');
  doc.setCreationDate(now);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const C = {
    ink: rgb(...hex('#1d1916')),
    mute: rgb(...hex('#6f665c')),
    line: rgb(...hex('#e4ddd3')),
    soft: rgb(...hex('#f6f2ec')),
    ember: rgb(...hex('#e07a2c')),
    head: rgb(...hex('#14110e')),
    white: rgb(1, 1, 1),
    green: rgb(...hex('#2f9a5a')),
    red: rgb(...hex('#d64545')),
  };

  // ── text helpers (Helvetica covers WinAnsi only: anything else becomes "?") ──
  const okChar = new Map<string, boolean>();
  const safe = (s: string) =>
    [...s.replace(/\s+/g, ' ')]
      .map((ch) => {
        if (!okChar.has(ch)) {
          try { font.encodeText(ch); okChar.set(ch, true); } catch { okChar.set(ch, false); }
        }
        return okChar.get(ch) ? ch : '?';
      })
      .join('');
  const printable = (s: string) => [...s].every((ch) => safe(ch) === ch);
  /** First candidate that prints cleanly (e.g. a Sinhala board name falls back to the English account name). */
  const pick = (...cands: (string | null | undefined)[]) => {
    const c = cands.map((x) => (x ?? '').trim()).filter(Boolean);
    return c.find(printable) ?? c[0] ?? '';
  };
  const width = (s: string, size: number, f = font) => f.widthOfTextAtSize(s, size);
  const wrap = (raw: string, size: number, max: number, f = font): string[] => {
    const words = safe(raw).split(' ');
    const out: string[] = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (width(next, size, f) <= max) { line = next; continue; }
      if (line) out.push(line);
      // a single word longer than the cell: cut it
      let word = w;
      while (width(word, size, f) > max && word.length > 1) {
        let i = word.length;
        while (i > 1 && width(word.slice(0, i), size, f) > max) i--;
        out.push(word.slice(0, i));
        word = word.slice(i);
      }
      line = word;
    }
    if (line || !out.length) out.push(line);
    return out;
  };

  const ctx: Ctx = { doc, font, bold, page: doc.addPage([A4.w, A4.h]), y: A4.h - M, rgb };
  const newPage = () => { ctx.page = doc.addPage([A4.w, A4.h]); ctx.y = A4.h - M; };
  const ensure = (h: number) => { if (ctx.y - h < FOOT + 12) newPage(); };
  const text = (s: string, x: number, y: number, size: number, f = font, color = C.ink) => ctx.page.drawText(safe(s), { x, y, size, font: f, color });

  // ── names: real first name first, then the board name, then the account name ──
  const { board, owner, members, roles, lists, cards, order } = data;
  const nameOfUser = (id: string | null) => {
    if (!id) return '-';
    if (id === owner.id) return pick(owner.firstName, owner.name);
    const m = members.find((x) => x.account?.id === id);
    if (m) return pick(m.firstName, m.name, m.account!.name, m.email.split('@')[0]);
    return data.people[id]?.name ?? 'Former member';
  };
  const roleCode = (id: string | null) => (id ? roles.find((r) => r.id === id)?.code ?? '-' : '-');
  const listName = (id: string) => lists.find((l) => l.id === id)?.title ?? '';

  const active = Object.values(cards).filter((c) => !c.archived && lists.some((l) => l.id === c.listId));
  const done = active.filter((c) => c.dueDone).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const open = active.filter((c) => !c.dueDone);
  const overdue = open.filter((c) => dueState(c) === 'overdue');
  const pct = active.length ? Math.round((done.length / active.length) * 100) : 0;
  const { scores } = scoreBoard(data, now.getTime());

  // ── header band ──
  const titleLines = wrap(board.title, 22, W, bold).slice(0, 3);
  const subY = A4.h - 62 - (titleLines.length - 1) * 25 - 22;
  const headH = A4.h - subY + 18;
  ctx.page.drawRectangle({ x: 0, y: A4.h - headH, width: A4.w, height: headH, color: C.head });
  ctx.page.drawRectangle({ x: 0, y: A4.h - headH, width: A4.w, height: 3, color: C.ember });
  text('KRAMA  ·  PROGRESS REPORT', M, A4.h - 36, 8.5, bold, C.ember);
  titleLines.forEach((l, i) => text(l, M, A4.h - 62 - i * 25, 22, bold, C.white));
  const ownerFirst = pick(owner.firstName);
  const ownerName = pick(owner.name);
  text(`Created by ${ownerFirst && ownerFirst !== ownerName ? `${ownerFirst} (${ownerName})` : ownerName}   ·   Generated ${fmtDateTime(now)} (Sri Lanka time)`, M, subY, 8.5, font, rgb(...hex('#c9bfb2')));
  ctx.y = A4.h - headH - 26;

  // ── summary tiles + bar ──
  const tiles: [string, string, Rgb][] = [
    ['Cards', String(active.length), C.ink],
    ['Done', String(done.length), C.green],
    ['Still to do', String(open.length), C.ink],
    ['Overdue', String(overdue.length), overdue.length ? C.red : C.ink],
    ['Complete', `${pct}%`, C.ember],
  ];
  const gap = 8;
  const tw = (W - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([label, value, color], i) => {
    const x = M + i * (tw + gap);
    ctx.page.drawRectangle({ x, y: ctx.y - 52, width: tw, height: 52, color: C.soft, borderColor: C.line, borderWidth: 0.6 });
    text(value, x + 10, ctx.y - 30, 20, bold, color);
    text(label.toUpperCase(), x + 10, ctx.y - 44, 7, bold, C.mute);
  });
  ctx.y -= 68;
  ctx.page.drawRectangle({ x: M, y: ctx.y, width: W, height: 6, color: C.line });
  if (pct) ctx.page.drawRectangle({ x: M, y: ctx.y, width: (W * pct) / 100, height: 6, color: C.green });
  ctx.y -= 14;
  text(`${done.length} of ${active.length} cards done across ${lists.length} ${lists.length === 1 ? 'list' : 'lists'}.${data.revisions.some((r) => !r.resolvedAt) ? ` ${data.revisions.filter((r) => !r.resolvedAt).length} sent back for revision.` : ''}`, M, ctx.y, 8.5, font, C.mute);
  ctx.y -= 26;

  // ── generic table ──
  type Col = { title: string; w: number; align?: 'right' };
  const table = (heading: string, note: string | null, cols: Col[], rows: { cells: string[]; colors?: (Rgb | undefined)[]; boldFirst?: boolean }[], empty: string) => {
    const size = 8.5;
    const lh = 11;
    const pad = 6;
    const totalW = cols.reduce((a, c) => a + c.w, 0);
    const ws = cols.map((c) => (c.w / totalW) * W);
    const drawHead = () => {
      ctx.page.drawRectangle({ x: M, y: ctx.y - 18, width: W, height: 18, color: C.head });
      let x = M;
      cols.forEach((c, i) => {
        const t = c.title.toUpperCase();
        text(t, c.align === 'right' ? x + ws[i] - pad - width(t, 7, bold) : x + pad, ctx.y - 12, 7, bold, C.white);
        x += ws[i];
      });
      ctx.y -= 18;
    };
    ensure(60);
    text(heading, M, ctx.y - 12, 13, bold);
    if (note) text(note, M + width(heading, 13, bold) + 10, ctx.y - 12, 8, font, C.mute);
    ctx.y -= 22;
    drawHead();
    if (!rows.length) {
      text(empty, M + pad, ctx.y - 14, size, font, C.mute);
      ctx.y -= 22;
    }
    rows.forEach((r, ri) => {
      const lines = r.cells.map((cell, i) => wrap(cell || '-', size, ws[i] - pad * 2, i === 0 && r.boldFirst ? bold : font));
      const h = Math.max(...lines.map((l) => l.length)) * lh + 8;
      if (ctx.y - h < FOOT + 12) { newPage(); drawHead(); }
      if (ri % 2 === 1) ctx.page.drawRectangle({ x: M, y: ctx.y - h, width: W, height: h, color: C.soft });
      let x = M;
      lines.forEach((ls, i) => {
        const f = i === 0 && r.boldFirst ? bold : font;
        ls.forEach((l, li) => {
          const lx = cols[i].align === 'right' ? x + ws[i] - pad - width(l, size, f) : x + pad;
          text(l, lx, ctx.y - 12 - li * lh, size, f, r.colors?.[i] ?? C.ink);
        });
        x += ws[i];
      });
      ctx.y -= h;
      ctx.page.drawLine({ start: { x: M, y: ctx.y }, end: { x: M + W, y: ctx.y }, thickness: 0.4, color: C.line });
    });
    ctx.y -= 24;
  };

  // ── team ──
  const allId = roles.find((r) => r.code === 'ALL')?.id;
  const openFor = (roleIds: string[]) => open.filter((c) => c.roleId && (roleIds.includes(c.roleId) || (allId && roleIds.includes(allId) && c.roleId === allId))).length;
  const doneBy = (userId: string | null) => (userId ? done.filter((c) => c.doneBy === userId).length : 0);
  const pointsOf = (userId: string | null) => {
    const s = userId ? scores.find((x) => x.id === userId) : undefined;
    return s ? String(s.points) : 'not scored';
  };
  const codes = (ids: string[]) => ids.map(roleCode).filter((c) => c !== '-').join(', ') || 'no role';
  const teamRows = [
    { cells: [pick(owner.name), owner.firstName, codes(owner.roleIds), 'Owner', String(doneBy(owner.id)), String(openFor(owner.roleIds)), pointsOf(owner.id)], boldFirst: true },
    ...members.map((m) => ({
      cells: [pick(m.name, m.account?.name, m.email.split('@')[0]), m.firstName, codes(m.roleIds), ACCESS[m.access].name + (m.account ? '' : ' (not signed in yet)'), String(doneBy(m.account?.id ?? null)), String(openFor(m.roleIds)), pointsOf(m.account?.id ?? null)],
      boldFirst: true,
    })),
  ];
  table('Team', `${members.length + 1} ${members.length ? 'people' : 'person'}`, [
    { title: 'Name', w: 22 }, { title: 'First name', w: 14 }, { title: 'Roles', w: 14 }, { title: 'Access', w: 20 },
    { title: 'Done', w: 8, align: 'right' }, { title: 'Open', w: 8, align: 'right' }, { title: 'Points', w: 12, align: 'right' },
  ], teamRows, '');

  // ── roles ──
  const holders = (roleId: string) => [
    ...(owner.roleIds.includes(roleId) ? [pick(owner.firstName, owner.name)] : []),
    ...members.filter((m) => m.roleIds.includes(roleId)).map((m) => pick(m.firstName, m.name, m.account?.name, m.email.split('@')[0])),
  ];
  table('Roles', null, [
    { title: 'Role', w: 10 }, { title: 'What it does', w: 34 }, { title: 'People', w: 36 }, { title: 'Done', w: 10, align: 'right' }, { title: 'Open', w: 10, align: 'right' },
  ], roles.map((r) => ({
    cells: [r.code, r.name, holders(r.id).join(', ') || (r.code === 'ALL' ? 'Everyone on the board' : 'No one yet'), String(done.filter((c) => c.roleId === r.id).length), String(open.filter((c) => c.roleId === r.id).length)],
    boldFirst: true,
  })), 'No roles on this board.');

  // ── finished ──
  const TIMING: Record<string, string> = { early3d: '3+ days early', early1d: '1+ day early', early3h: 'Early', onTime: 'On time', noDate: 'No due date', late: 'Late' };
  table('Finished', `${done.length} ${done.length === 1 ? 'card' : 'cards'}`, [
    { title: 'Card', w: 34 }, { title: 'List', w: 14 }, { title: 'Role', w: 8 }, { title: 'Done by', w: 16 }, { title: 'Done on', w: 14 }, { title: 'Timing', w: 14 },
  ], done.map((c) => {
    const t = c.doneAt ? completionPoints(Date.parse(c.doneAt), c.dueDate, c.dueTime).kind : null;
    return {
      cells: [c.title, listName(c.listId), roleCode(c.roleId), nameOfUser(c.doneBy), c.doneAt ? fmtDate(c.doneAt) : '-', t ? TIMING[t] : '-'],
      colors: [undefined, undefined, undefined, undefined, undefined, t === 'late' ? C.red : t && t !== 'noDate' ? C.green : C.mute],
    };
  }), 'Nothing finished yet.');

  // ── still to do, list by list ──
  const status = (c: KCard) => {
    if (c.revision) return { s: 'Revision requested', color: C.red };
    const d = dueState(c);
    if (d === 'overdue') return { s: 'Overdue', color: C.red };
    if (d === 'today') return { s: DUE_STYLE.today.label, color: C.ember };
    if (d === 'soon') return { s: 'Due soon', color: C.ember };
    return { s: 'Open', color: C.mute };
  };
  const todoRows = lists.flatMap((l) =>
    (order[l.id] ?? []).map((id) => cards[id]).filter((c): c is KCard => !!c && !c.archived && !c.dueDone).map((c) => {
      const st = status(c);
      const checks = c.checklists.flatMap((x) => x.items);
      return {
        cells: [c.title + (checks.length ? `  (${checks.filter((i) => i.done).length}/${checks.length} checklist)` : ''), l.title, roleCode(c.roleId), fmtDue(c), c.priority === 'none' ? '-' : PRIORITIES[c.priority].name, st.s],
        colors: [undefined, undefined, undefined, undefined, undefined, st.color],
      };
    }),
  );
  table('Still to do', `${open.length} ${open.length === 1 ? 'card' : 'cards'}`, [
    { title: 'Card', w: 34 }, { title: 'List', w: 14 }, { title: 'Role', w: 8 }, { title: 'Due', w: 16 }, { title: 'Priority', w: 12 }, { title: 'Status', w: 16 },
  ], todoRows, 'No open cards.');

  // ── footers ──
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: FOOT - 8 }, end: { x: A4.w - M, y: FOOT - 8 }, thickness: 0.4, color: C.line });
    const left = safe(`Krama  ·  ${board.title}`);
    p.drawText(left.length > 80 ? `${left.slice(0, 79)}...` : left, { x: M, y: FOOT - 22, size: 7.5, font, color: C.mute });
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(right, { x: A4.w - M - width(right, 7.5), y: FOOT - 22, size: 7.5, font, color: C.mute });
  });

  return doc.save();
}

/** Builds the report and hands it to the browser as a file download. */
export async function downloadReport(data: BoardData) {
  const bytes = await buildReport(data);
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = reportFileName(data.board.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
