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
contact form and the admin panel. The Work page lists 21 projects (university and personal work).

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
- **Labs**: add or remove the Google addresses allowed into the private **Labs** section. Approved people (and the
  admin) see a "Labs" link after "Contact" in the menu; for everyone else, signed in or not, the link isn't there
  and `/labs` is the normal "page not found". Changes apply on the person's next page load.

## Labs: Krama

**Krama** (`/labs/krama`) is a task planner for people with Labs access: boards with themes, lists and cards
with drag and drop, card details (description, labels, checklists, due date and time, priority, cover colour,
comments, archive), search and filters, and a month calendar in Sri Lanka time (GMT+5:30) that highlights Poya
days, public and bank holidays, and mercantile holidays. Each person only sees their own boards.

**Teams.** Each board has an **Admin** tab for the person who created it (and the Krama admin): **Add members**
searches people who have signed in with Google (search and select, several at once) or takes a typed email.
Each board also has a **Members & Roles** tab. The board's owner (and the Krama admin, `ADMIN_EMAILS`, on
every board) adds people by Google email,
gives them **Full access** (edit everything) or **Read and tick** (see the board, tick their own cards), and ticks
their roles (PM, BA, FE, BE, QA, ALL, or custom ones). Cards get a role; only people with that role can tick the
card done (ALL = whole team). Invited people can open Labs → Krama with that Google account and can create
projects of their own. **Copy invite** gives a message with a link that signs them in and opens the project. The admin's
**Admin** tab (`/labs/krama/admin`) shows every board, everyone's access, work by role, overdue cards and an
activity log.

**Revision and Progress.** Anyone with full access can press the red **Revision** button on a ticked card, give a
reason, and send it back: it unticks and glows red until it is ticked again. The **Progress** tab ranks the team:
early finishes earn more points, late finishes lose 1 point per 10 minutes, overdue cards cost their role holders
points, and each revision costs 15. Only people with at least one role are scored (the creator can give
themselves roles on their own row). Top scorers get a podium, confetti and a cheer; the lowest scorer gets a gloomy
line and a hint on hover. Rules are in `src/lib/krama/score.ts` and on the page (How scoring works).

Holiday data is in `src/lib/krama/holidays.ts`: official gazetted lists for 2026 and 2027, estimates for 2025 and
2028 (marked as such in the app). When the government publishes a new year's list, add it to `OFFICIAL` there.

## Editing content

All text lives in **`src/content/site.ts`**: profile, projects (case studies), process, capabilities, education,
interests, LinkedIn posts and `MEMBER_FEATURES` (what signing in unlocks; add new member features there).
Photos are in `src/assets/me`, project images in `src/assets/work`; project covers are drawn in code in
`src/components/work/ProjectCover.tsx` (one `case` per project slug), and real screenshots shown on a case study are
listed in `src/components/work/gallery.ts`. The filter chips on /work come from `CATEGORIES` in `site.ts`.

**Adding a project:** add an entry to `PROJECTS` in `site.ts` (its position sets the order and the "Next project"
link; `featured: true` puts it on the home page), add a `case` for its slug in `ProjectCover.tsx`, and optionally
screenshots in `gallery.ts`. University work is described in our own words with our own visuals: never publish
assignment briefs, marking guides, reports, or code and data supplied by a unit.

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
