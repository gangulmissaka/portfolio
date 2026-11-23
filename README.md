# gangulmissaka — portfolio v3

An editorial, motion-led portfolio with a real backend: Google sign-in with a members area, a guestbook,
project reactions, a contact inbox and an admin dashboard.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + Lenis ·
Better Auth · Drizzle ORM · Postgres (Neon) · Resend

## Live

| Address | What it is |
|---|---|
| **https://gangulmissaka.github.io** | The public address. Forwards to the main site (old deep links forward too). |
| **https://gangulmissaka.vercel.app** | This site, hosted on Vercel (project `missaka/gangulmissaka`) |
| **https://gangulmissaka.github.io/valley/** | The previous 3D portfolio (repo `gangulmissaka.github.io`), linked from here |

Status (2026-11-24): live and working, including Google sign-in, the members area, guestbook, reactions,
contact form and the admin panel.

---

## Run it locally

```powershell
cd F:\MyPortfolio\site
npm install
npm run dev          # http://localhost:3000
```

No accounts are needed to run it. Without a `DATABASE_URL`, an embedded Postgres runs **in memory**, so the
guestbook, reactions and inbox work but reset when you restart. Features without keys hide themselves: sign-in
explains it is almost ready, and contact messages are saved without sending email.

To try sign-in, the guestbook and `/admin` locally without Google keys, uncomment `DEV_PASSWORD_LOGIN=1` in
`.env.local`, set `ADMIN_EMAILS` to a test email, and create a user through the API:

```js
// in the browser console on http://localhost:3000
await fetch('/api/auth/sign-up/email', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'you@example.com', password: 'a-long-password', name: 'Your Name' }) });
```

This dev login is **never enabled in production builds**.

Checks: `npx tsc --noEmit` · `npx eslint src` · `npx next build`

---

## How it's deployed

- **Code:** this folder is the repo `gangulmissaka/portfolio`.
- **Hosting:** Vercel project `missaka/gangulmissaka` (free Hobby plan). `vercel.json` marks it as a Next.js app.
- **Database:** Neon Postgres `portfolio-db`, added through the Vercel Marketplace, which set `DATABASE_URL` and the
  other `POSTGRES_*` / `PG*` variables. Tables are created automatically on first use.
- **Google sign-in:** OAuth client in Google Cloud with these authorised origins/redirects:
  `https://gangulmissaka.vercel.app` + `/api/auth/callback/google`, and `http://localhost:3000` + the same path.
- **github.io forwarding:** the `gangulmissaka.github.io` repo publishes the 3D site under `/valley/` and a root
  `index.html` / `404.html` that forward here. The target is the repository variable `MAIN_SITE_URL`.

**Deploying an update** (run in PowerShell from this folder; Git Bash's `npx` can't find Node on this PC):

```powershell
git push                                  # keep GitHub up to date
npx vercel@latest deploy --prod --yes     # build and publish on Vercel
```

To deploy automatically on every `git push` instead, connect the repo in Vercel → Project → Settings → Git
(it needs the Vercel GitHub app to be allowed once).

**Changing the address** (e.g. a custom domain like `gangulmissaka.dev`): add the domain in Vercel → Settings →
Domains, then update together: `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` on Vercel, the Google OAuth origins and
redirect URIs, and the `MAIN_SITE_URL` variable of the `gangulmissaka.github.io` repo (then re-run its workflow).
Redeploy afterwards.

### Environment variables (Vercel → Settings → Environment Variables)

Set for Production and Preview. Secret values live only on Vercel and in your local `.env.local` (never in git).

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` | ✅ | `https://gangulmissaka.vercel.app` (no trailing slash) |
| `BETTER_AUTH_SECRET` | ✅ | Random 32 bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `DATABASE_URL` | ✅ | Neon connection string (set by the Neon integration) |
| `NEXT_PUBLIC_VALLEY_URL` | optional | Where "3D world" links go; defaults to `https://gangulmissaka.github.io/valley/` |
| `ADMIN_EMAILS` | ✅ | `missakabro@gmail.com`: the only account that gets the Admin button and `/admin` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ | Google sign-in |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | optional | GitHub sign-in |
| `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` | optional | Email me when someone uses the contact form (verify your domain in Resend) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optional | Cloudflare Turnstile bot check on the contact form |
| `GUESTBOOK_MODERATION` | optional | Starting value for "approve notes first"; after that, use the switch in Admin → Guestbook |

---

## Admin panel

Sign in with the admin email and an **Admin** button appears in the header (nobody else sees it; `/admin` is a 404
for them). Tabs:

- **Overview**: members, notes, unread messages, page views, newest members, latest notes, service status.
- **Users**: search and filter everyone who signed up; **Block** (signs them out, stops posting, hides their notes and
  reactions), **Unblock**, **Sign out** of all devices, **Delete** (removes the account and everything they posted).
  Admin accounts can't be blocked or deleted from here.
- **Guestbook**: filter by Waiting / Published / Hidden, search, select several notes, then Publish, Hide or Delete.
  The **Approve notes before they go public** switch takes effect immediately.
- **Messages**: contact-form inbox with reply by email, read/unread, archive and delete.

## Editing content

All text lives in **`src/content/site.ts`**: profile, projects (case studies), process, capabilities, education,
interests, LinkedIn posts and `MEMBER_FEATURES` (what signing in unlocks; add new member features there).
Photos are in `src/assets/me`, project images in `src/assets/work`; project covers are drawn in code in
`src/components/work/ProjectCover.tsx`.

## Where things are

```
src/app/                  pages (home, work, work/[slug], about, contact, guestbook, cv, privacy, admin) + API routes
src/components/home/      Hero (+ WebGL HeroShader), FeaturedWork card stack, ProcessScroller, NowStrip, ValleyInvite (3D link)
src/components/admin/     Admin panel tabs, user/guestbook/message actions
src/components/motion/    SmoothScroll, reveals, RollText, ScrollProgress, SectionGuide, CountUp, Spotlight
src/components/ui/        Header, Footer, Cursor, Preloader, CommandPalette (⌘K), Marquee …
src/app/signin, account/  Google sign-in page and the members area
src/lib/                  auth (Better Auth), db (Drizzle + Neon / PGlite), server actions, rate limiting
```
