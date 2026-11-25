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
- **Projects (22 live)**: entries in `PROJECTS` (site.ts; order = list order and "Next project", `featured` = home
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
- **Editing on Windows**: never round-trip files through PowerShell `Get-Content`/`Set-Content` (it reads UTF-8 as
  ANSI and garbles emoji, curly quotes and `·`). Keep LF line endings (the repo is LF; Python on Windows writes CRLF
  unless given `newline='\n'`). Long bash heredocs can fail here; write scripts to the scratchpad with the Write tool.
- **Screenshots**: Chrome's `--screenshot` fires before `next/image` finishes, so image covers look blank. Start
  Chrome with `--remote-debugging-port` and use a CDP script that waits until every `img` is complete, then
  `Page.captureScreenshot`.
- **3D link**: the 3D site is only reached through plain links to `SITE.valleyUrl`. Never import or prefetch
  anything 3D in this app; the point is that low-end PCs never download it unless they click.
