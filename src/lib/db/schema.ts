import { pgTable, text, boolean, timestamp, integer, bigint, date, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';

// ── Better Auth tables (column names match Better Auth's default field names) ──
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// ── Site tables ──
export const guestbook = pgTable(
  'guestbook',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    status: text('status').notNull().default('approved'), // approved | pending | hidden
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [index('guestbook_created_idx').on(t.createdAt)],
);

export const message = pgTable('message', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  topic: text('topic').notNull().default('general'),
  body: text('body').notNull(),
  status: text('status').notNull().default('new'), // new | read | archived
  ipHash: text('ipHash'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const reaction = pgTable(
  'reaction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    kind: text('kind').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('reaction_unique').on(t.userId, t.slug, t.kind)],
);

export const pageView = pgTable('page_view', { path: text('path').notNull(), day: date('day').notNull(), count: integer('count').notNull().default(0) }, (t) => [
  primaryKey({ columns: [t.path, t.day] }),
]);

export const rateLimit = pgTable('rate_limit', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: bigint('windowStart', { mode: 'number' }).notNull(),
});

/** Users the admin has blocked: they can't post, and their notes/reactions are hidden from the public. */
export const userBan = pgTable('user_ban', {
  userId: text('userId').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

/** Small key/value store for settings the admin can change live (e.g. guestbook moderation). */
export const siteSetting = pgTable('site_setting', { key: text('key').primaryKey(), value: text('value').notNull() });

export const authSchema = { user, session, account, verification };

/** Idempotent DDL: run on first use (and by `npm run db:setup`). Mirrors the tables above. */
export const DDL = `
create table if not exists "user" (
  "id" text primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null default false,
  "image" text, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());
create table if not exists "session" (
  "id" text primary key, "expiresAt" timestamp not null, "token" text not null unique, "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(), "ipAddress" text, "userAgent" text,
  "userId" text not null references "user"("id") on delete cascade);
create index if not exists session_user_idx on "session"("userId");
create table if not exists "account" (
  "id" text primary key, "accountId" text not null, "providerId" text not null,
  "userId" text not null references "user"("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text,
  "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, "scope" text, "password" text,
  "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());
create index if not exists account_user_idx on "account"("userId");
create table if not exists "verification" (
  "id" text primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamp not null,
  "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());
create index if not exists verification_identifier_idx on "verification"("identifier");
create table if not exists "guestbook" (
  "id" text primary key, "userId" text not null references "user"("id") on delete cascade, "body" text not null,
  "status" text not null default 'approved', "createdAt" timestamp not null default now());
create index if not exists guestbook_created_idx on "guestbook"("createdAt");
create table if not exists "message" (
  "id" text primary key, "name" text not null, "email" text not null, "topic" text not null default 'general', "body" text not null,
  "status" text not null default 'new', "ipHash" text, "createdAt" timestamp not null default now());
create table if not exists "reaction" (
  "id" text primary key, "userId" text not null references "user"("id") on delete cascade, "slug" text not null,
  "kind" text not null, "createdAt" timestamp not null default now());
create unique index if not exists reaction_unique on "reaction"("userId", "slug", "kind");
create table if not exists "page_view" ("path" text not null, "day" date not null, "count" integer not null default 0, primary key ("path", "day"));
create table if not exists "user_ban" ("userId" text primary key references "user"("id") on delete cascade, "reason" text, "createdAt" timestamp not null default now());
create table if not exists "site_setting" ("key" text primary key, "value" text not null);
create table if not exists "rate_limit" ("key" text primary key, "count" integer not null, "windowStart" bigint not null);
`;
