# CLAUDE.md

@AGENTS.md

Portfolio v3 for Gangul Missaka: editorial dark design, GSAP + Lenis motion, full-stack Next.js 16. Replaces the 3D
driving site in `../portfolio` (kept for reference). The plan behind it is `../NEW_SITE_PLAN.md`; setup and deploy
steps are in `README.md`.

## Commands
`npm run dev` (port 3000) · `npx tsc --noEmit -p .` · `npx eslint src` · `npx next build` (dev uses `.next/dev`, so
building while the dev server runs is fine).

## Things that matter
- **Content** is only in `src/content/site.ts` (incl. `MEMBER_FEATURES` for the members area). The user asked
  for no em dashes (—) anywhere in site text and no AI assistant. Never invent facts (dates, employers, metrics) — the user's real details come from `../Gangul_Missaka_Details.docx`.
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
