# gangulmissaka — portfolio v3

An editorial, motion-led portfolio with a real backend: Google sign-in with a members area, a guestbook,
project reactions, a contact inbox and an admin dashboard.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + Lenis ·
Better Auth · Drizzle ORM · Postgres (Neon) · Resend

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

## Go live (about 30 minutes, all free)

1. **Push to GitHub.** Create a new repo (e.g. `portfolio`) and push this folder.
2. **Neon** (neon.com) → new project → copy the connection string. Tables are created automatically on first run.
3. **Google sign-in** (console.cloud.google.com) → APIs & Services:
   - *OAuth consent screen*: app name, your email, logo; add the privacy URL `https://<your-domain>/privacy`.
     Only the basic `openid email profile` scopes are used, so no Google review is needed.
   - *Credentials → Create OAuth client → Web application*. Authorised redirect URIs:
     `https://<your-domain>/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`.
4. **GitHub sign-in (optional)** → github.com/settings/developers → New OAuth App, callback
   `https://<your-domain>/api/auth/callback/github`.
5. **Vercel** (vercel.com, sign in with GitHub) → *Add New Project* → import the repo → add the environment
   variables below → Deploy.
6. **Domain (recommended)**: buy `gangulmissaka.dev` (or similar) and add it in Vercel → Settings → Domains.
   Then update `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and the Google/GitHub redirect URIs to that domain.
7. **Old site**: replace the `gangulmissaka.github.io` repo's `index.html` with a redirect to the new domain
   (`<meta http-equiv="refresh" content="0; url=https://your-domain">` plus a `<link rel="canonical">`).

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` | ✅ | `https://your-domain` (no trailing slash) |
| `BETTER_AUTH_SECRET` | ✅ | Random 32 bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `DATABASE_URL` | ✅ | Neon connection string |
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
src/components/home/      Hero (+ WebGL HeroShader), FeaturedWork card stack, ProcessScroller, NowStrip
src/components/motion/    SmoothScroll, reveals, RollText, ScrollProgress, SectionGuide, CountUp, Spotlight
src/components/ui/        Header, Footer, Cursor, Preloader, CommandPalette (⌘K), Marquee …
src/app/signin, account/  Google sign-in page and the members area
src/lib/                  auth (Better Auth), db (Drizzle + Neon / PGlite), server actions, rate limiting
```
