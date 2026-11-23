import 'server-only';

/** Feature switches derived from environment variables. Anything not configured is hidden gracefully. */
export const env = {
  siteUrl: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  resend: !!process.env.RESEND_API_KEY,
  turnstile: !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};

export const providers = () => [...(env.google ? (['google'] as const) : []), ...(env.github ? (['github'] as const) : [])];
export type Provider = 'google' | 'github';
