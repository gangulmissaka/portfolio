import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';
import { db, dbReady, schema } from './db';
import { env } from './env';

const secret =
  process.env.BETTER_AUTH_SECRET ??
  (process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-change-me-dev-only-secret-change-me');

export const auth = betterAuth({
  appName: 'Gangul Missaka',
  baseURL: env.siteUrl,
  secret,
  database: drizzleAdapter(db, { provider: 'pg', schema: schema.authSchema }),
  socialProviders: {
    ...(env.google && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        prompt: 'select_account' as const,
      },
    }),
    ...(env.github && {
      github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! },
    }),
  },
  // Local testing only: lets you sign in without Google/GitHub keys. Never enabled in production builds.
  emailAndPassword: { enabled: process.env.NODE_ENV !== 'production' && process.env.DEV_PASSWORD_LOGIN === '1' },
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  rateLimit: { enabled: true, window: 60, max: 60 },
  plugins: [nextCookies()],
});

export type SessionUser = { id: string; name: string; email: string; image: string | null; isAdmin: boolean; banned: boolean };

/** Reads the session for the current request. Call only inside a <Suspense> boundary (request-time data). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  await connection(); // session checks compare against the current time → always request-time
  const h = await headers();
  try {
    await dbReady;
    const s = await auth.api.getSession({ headers: h });
    if (!s) return null;
    const [ban] = await db.select({ userId: schema.userBan.userId }).from(schema.userBan).where(eq(schema.userBan.userId, s.user.id));
    return {
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      image: s.user.image ?? null,
      isAdmin: env.adminEmails.includes(s.user.email.toLowerCase()),
      banned: !!ban,
    };
  } catch (e) {
    unstable_rethrow(e);
    console.error('[auth] getSession failed', e);
    return null;
  }
}
