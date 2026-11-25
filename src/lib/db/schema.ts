import { pgTable, text, boolean, timestamp, integer, bigint, date, jsonb, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';

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

/**
 * Who may open /labs besides the admin. Keyed by email, not user id, so access can be granted before the person
 * has ever signed in. `key` is the normalised address (see lib/labs.ts); `email` is what the admin typed.
 */
export const labsAccess = pgTable('labs_access', {
  key: text('key').primaryKey(),
  email: text('email').notNull(),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// ── Krama (Labs task planner). Every row hangs off a board, and every board belongs to one user. ──
export const kramaBoard = pgTable(
  'krama_board',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    theme: text('theme').notNull().default('ember'),
    starred: boolean('starred').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [index('krama_board_user_idx').on(t.userId)],
);

export const kramaLabel = pgTable(
  'krama_label',
  {
    id: text('id').primaryKey(),
    boardId: text('boardId').notNull().references(() => kramaBoard.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    color: text('color').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('krama_label_board_idx').on(t.boardId)],
);

export const kramaList = pgTable(
  'krama_list',
  {
    id: text('id').primaryKey(),
    boardId: text('boardId').notNull().references(() => kramaBoard.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [index('krama_list_board_idx').on(t.boardId)],
);

/** Due dates are Sri Lanka local date/time strings ("2026-12-25", "17:30"), so they never shift with time zones. */
export const kramaCard = pgTable(
  'krama_card',
  {
    id: text('id').primaryKey(),
    boardId: text('boardId').notNull().references(() => kramaBoard.id, { onDelete: 'cascade' }),
    listId: text('listId').notNull().references(() => kramaList.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    position: integer('position').notNull().default(0),
    dueDate: text('dueDate'),
    dueTime: text('dueTime'),
    dueDone: boolean('dueDone').notNull().default(false),
    priority: text('priority').notNull().default('none'),
    cover: text('cover'),
    labelIds: jsonb('labelIds').$type<string[]>().notNull().default([]),
    checklists: jsonb('checklists').$type<{ id: string; title: string; items: { id: string; text: string; done: boolean }[] }[]>().notNull().default([]),
    archived: boolean('archived').notNull().default(false),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [index('krama_card_board_idx').on(t.boardId), index('krama_card_list_idx').on(t.listId)],
);

export const kramaComment = pgTable(
  'krama_comment',
  {
    id: text('id').primaryKey(),
    cardId: text('cardId').notNull().references(() => kramaCard.id, { onDelete: 'cascade' }),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [index('krama_comment_card_idx').on(t.cardId)],
);

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
create table if not exists "labs_access" ("key" text primary key, "email" text not null, "note" text, "createdAt" timestamp not null default now());
create table if not exists "krama_board" (
  "id" text primary key, "userId" text not null references "user"("id") on delete cascade, "title" text not null,
  "theme" text not null default 'ember', "starred" boolean not null default false,
  "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());
create index if not exists krama_board_user_idx on "krama_board"("userId");
create table if not exists "krama_label" (
  "id" text primary key, "boardId" text not null references "krama_board"("id") on delete cascade,
  "name" text not null default '', "color" text not null, "position" integer not null default 0);
create index if not exists krama_label_board_idx on "krama_label"("boardId");
create table if not exists "krama_list" (
  "id" text primary key, "boardId" text not null references "krama_board"("id") on delete cascade, "title" text not null,
  "position" integer not null default 0, "createdAt" timestamp not null default now());
create index if not exists krama_list_board_idx on "krama_list"("boardId");
create table if not exists "krama_card" (
  "id" text primary key, "boardId" text not null references "krama_board"("id") on delete cascade,
  "listId" text not null references "krama_list"("id") on delete cascade, "title" text not null,
  "description" text not null default '', "position" integer not null default 0, "dueDate" text, "dueTime" text,
  "dueDone" boolean not null default false, "priority" text not null default 'none', "cover" text,
  "labelIds" jsonb not null default '[]'::jsonb, "checklists" jsonb not null default '[]'::jsonb,
  "archived" boolean not null default false, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());
create index if not exists krama_card_board_idx on "krama_card"("boardId");
create index if not exists krama_card_list_idx on "krama_card"("listId");
create table if not exists "krama_comment" (
  "id" text primary key, "cardId" text not null references "krama_card"("id") on delete cascade,
  "userId" text not null references "user"("id") on delete cascade, "body" text not null, "createdAt" timestamp not null default now());
create index if not exists krama_comment_card_idx on "krama_comment"("cardId");
`;
