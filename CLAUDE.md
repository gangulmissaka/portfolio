# CLAUDE.md

@AGENTS.md

Portfolio v3 for Gangul Missaka: editorial dark design, GSAP + Lenis motion, full-stack Next.js 16. Replaces the 3D
driving site, which still lives at gangulmissaka.github.io/valley/ (repo clone `../github-io`). The plan behind it is
`../NEW_SITE_PLAN.md`; hosting and deploy steps are in `README.md`.

**Live (2026-11-24, working):** https://gangulmissaka.vercel.app (Vercel project `missaka/gangulmissaka`, Neon DB
`portfolio-db`). https://gangulmissaka.github.io forwards here. Repo: `gangulmissaka/portfolio`. Deploy with
`npx vercel@latest deploy --prod --yes` from PowerShell (Git Bash npx can't find node). Ask before deploying.

## Commands
`npm run dev` (port 3000) · `npx tsc --noEmit -p .` · `npx eslint src` · `npx next build` (dev uses `.next/dev`, so
building while the dev server runs is fine).

## Things that matter
- **Content** is only in `src/content/site.ts` (incl. `MEMBER_FEATURES` for the members area). The user asked
  for no em dashes anywhere in site text and no AI assistant. Never invent facts (dates, employers, metrics); the
  user's real details come from `../Gangul_Missaka_Details.docx`.
- **Hero is final**: the user wants it exactly as in `../issue1.png` (huge "Gangul" / "Missaka" over the portrait,
  scroll cue on the right). A viewport-height resize was reverted at their request; don't change hero sizing or
  spacing unless asked.
- **Projects (21 live)**: entries in `PROJECTS` (site.ts; order = list order and "Next project", `featured` = home
  page), covers built in code in `components/work/ProjectCover.tsx` (one `case` per slug, shared `Window` helper and
  `mono` class), real screenshots in `components/work/gallery.ts`, filter chips from `CATEGORIES`.
  University work is described, never published (no briefs, marking guides, reports, unit code or data). The user was
  project manager / team lead in every group project; say so in `role`. Don't invent results on covers: decorative
  data must be generic or come from the user's own documents.
  - **Never add GrowWithMe** (`D:\Website_Demo`): the user's current ECU Applied Project, still in progress.
  - Left out on purpose: NewsApp (a disguised app with a hidden launcher; private), HumanLikeCoder, and
    tutorial/workshop code (Flutter dice_dungeons, Unity learning projects, unit starter/solution code).
  - Sources: ECU work in `D:\OneDrive_Folders\OneDrive - Edith Cowan University` and the C: copy
    `C:\Users\User\OneDrive - Edith Cowan University` (only it has the C++ Assignment 2 code); older units in
    `D:\MOVED\SEM 2 UNIVERSITY ECU` and `E:\MOVED_2`; personal apps in `C:\Users\User\Desktop` (MYAPPS,
    Medical_website, app for dad) and `C:\Users\User\Downloads\Hornet_finder_Riyasewana`.
- **Cache Components is on.** Anything reading cookies/headers/the session must sit inside `<Suspense>`.
  `getCurrentUser()` calls `connection()` first because Better Auth reads the clock. In `catch` blocks around
  request-time work, call `unstable_rethrow(e)` first or Next's prerender signals get swallowed.
- **Motion**: `src/lib/gsap.ts` registers plugins; use `useGSAP` + the primitives in `components/motion/Reveal.tsx`.
  Elements with `data-reveal` are hidden by CSS until GSAP shows them (`.js` class set by the boot script).
  Everything must work with `prefers-reduced-motion: reduce` (headless Chrome reports *reduce* by default —
  emulate `no-preference` to test animations).
- **CSS layers**: base/component styles in `globals.css` are inside `@layer base` / `@layer components`; unlayered
  rules would override Tailwind utilities (that bug happened once: `a { color: inherit }` beat `text-ink`).
- **HeroShader**: never call `loseContext()` in cleanup — effects re-run on the same canvas (strict mode,
  `<Activity>` keeping routes alive) and a lost context renders white.
- **DB**: `DATABASE_URL` → Neon; otherwise in-memory PGlite (set `PGLITE_DIR` to persist; killing the dev server
  while it writes can corrupt that folder). DDL in `src/lib/db/schema.ts` runs idempotently on first use.
- **Auth origin**: Better Auth rejects requests whose origin isn't `BETTER_AUTH_URL`, so test on that port (3000).
- **Testing headlessly**: drive Chrome over CDP (see `../portfolio` memory notes); `DEV_PASSWORD_LOGIN=1` allows
  `/api/auth/sign-up/email` in dev to test the guestbook, reactions and `/admin`.
- **Admin**: only `ADMIN_EMAILS` (missakabro@gmail.com) passes `requireAdminPage()`; everyone else gets a 404.
  Every admin server action re-checks the session. Blocked users live in `user_ban`; live settings in `site_setting`.
- **Labs** (`/labs`, private): only the admin + emails in `labs_access` (managed in Admin → Labs) may see it. Gate
  is `src/lib/labs.ts`: `requireLabsPage()` gives everyone else the plain 404 (signed out too), `requireLabsAction()`
  for any future Labs server action. The nav link is a server island (`components/labs/LabsNav.tsx`) passed into
  the header's `labs` slot, so people without access never get it in their HTML. Emails match via `labsKey()`
  (Gmail dots/`+tags`/googlemail ignored). Keep Labs out of NAV, the sitemap, footer and command palette.
  Page views under `/labs` are not counted.
- **Krama** (`/labs/krama`, Trello-style planner inside Labs): tables `krama_board/list/card/label/comment`, every
  row owned through `krama_board.userId`. Server actions in `lib/actions/krama.ts` (Labs check → board ownership →
  zod; all writes filtered by boardId); loaders in `lib/krama/data.ts`; client state in `components/krama/store.ts`
  (optimistic: update locally, persist with an action, toast + `router.refresh()` on failure; ids are client UUIDs).
  Drag and drop is `@dnd-kit` (`BoardView.tsx`, calendar in `calendar.tsx`). Gotchas: DragOverlay must be
  portalled to `<body>` (a `backdrop-filter` ancestor offsets fixed elements); give `DndContext` a `useId()` id
  (hydration); in single-table selects Drizzle renders `${table.col}` as a bare column, so correlated subqueries
  need the column written out (`sql.raw('"krama_board"."id"')`). Due dates are stored as SLST strings
  ("YYYY-MM-DD", "HH:MM"); time helpers in `lib/krama/time.ts`. Sri Lankan holidays live in
  `lib/krama/holidays.ts`: 2026-27 official (gazette sources in the file), 2025/2028 estimated, from the user's
  "srilanka" MCP tool (`C:\Users\User\Desktop\MYAPPS\MCP control\servers\lk_calendar\holidays.json`). Add a year
  there when a new gazette is out. Board pages set `data-krama-app`, which hides the footer and locks page scroll.
- **Krama teams**: boards can have members (`krama_member`, by normalised Google email via `lib/labs-key.ts`) with
  access `full` (edit) or `tick` (read + tick), and per-board roles (`krama_role`, default PM/BA/FE/BE/QA/ALL).
  Cards have `roleId`; `canTickCard()` in `lib/krama/model.ts` is THE tick rule, used by both server and UI:
  owner/Krama admin tick anything, no-role cards need full access, ALL cards anyone, else members holding that
  role (a member with ALL counts as every role). The board owner and the site admin (`canManage`) edit members
  and roles; members never do.
  Rights come from `boardAccess()` in `lib/krama/access.ts`; every action in `lib/actions/krama.ts` goes through
  `access(boardId, 'view'|'edit'|'own'|'manage')`. Ticking uses `setCardDone`/`setChecklistItem` (not updateCard).
  Being a member of any board, or owning one, also grants Labs access (`isKramaUser` in `hasLabsAccess`), so
  invited people can start their own projects and keep them. Invite links are `/signin?next=/labs/krama/b/<id>`
  (`components/krama/invite.tsx`); sign-in redirects signed-in visitors to a safe same-site `next`.
  Each board has an **Admin** tab for its creator and the site admin (`BoardAdmin.tsx`): Add members uses the
  people picker (`people.tsx` → `searchPeople` action). Privacy rule in `searchPeople`: the site admin may search
  every account; other owners only accounts already in Labs/Krama; anyone else is added by typing a full email.
- **Krama revisions & Progress**: full-access people can send a ticked card back (`requestRevision`, reason
  required): it unticks, gets `revision*` columns (red `.k-revision` glow) and a `krama_revision` row; ticking it
  again clears it. The Progress tab (`ProgressView.tsx`) scores everyone from `lib/krama/score.ts` (pure; rules in
  its header comment: early tiers +5..+30, -1 per 10 min late capped -100, live overdue penalty for role holders,
  -15 per revision). Only people holding at least one role are scored (`team()`; `unscored()` lists the rest),
  the creator and Krama admin included; the creator's own roles are a member row for their own email
  (`setOwnerRoles`), hidden from member lists and counts. Scores are computed in the browser only (server renders a placeholder) to avoid hydration
  mismatches from `Date.now()`. Chart colours: dark steps of the dataviz reference palette, validated on #14110e,
  assigned by team order (colour follows the person). E2E: `run-all.ps1` runs each suite on a fresh dev server. Never export helpers like `seedRoles`
  from the `'use server'` file: every export there is callable from the browser. Activity is logged to
  `krama_activity` for the admin panel (`/labs/krama/admin`, admin only). Boards refresh in the background every
  20 s when idle (BoardApp). Multi-user E2E: four dev accounts; Better Auth rate-limits sign-ups (retry on 429);
  server action ids are in the dev chunks as `{"<id>":{"name":"<action>"}}` for direct-call permission tests.
- **Editing on Windows**: never round-trip files through PowerShell `Get-Content`/`Set-Content` (it reads UTF-8 as
  ANSI and garbles emoji, curly quotes and `·`). Keep LF line endings (the repo is LF; Python on Windows writes CRLF
  unless given `newline='\n'`). Long bash heredocs can fail here; write scripts to the scratchpad with the Write tool.
- **Screenshots**: Chrome's `--screenshot` fires before `next/image` finishes, so image covers look blank. Start
  Chrome with `--remote-debugging-port` and use a CDP script that waits until every `img` is complete, then
  `Page.captureScreenshot`.
- **3D link**: the 3D site is only reached through plain links to `SITE.valleyUrl`. Never import or prefetch
  anything 3D in this app; the point is that low-end PCs never download it unless they click.
