import 'server-only';
import { eq } from 'drizzle-orm';
import { db, dbReady, schema } from './db';

/** Whether new guestbook notes wait for approval. Set live from /admin; falls back to the GUESTBOOK_MODERATION env var. */
export async function getModeration(): Promise<boolean> {
  await dbReady;
  const [row] = await db.select({ value: schema.siteSetting.value }).from(schema.siteSetting).where(eq(schema.siteSetting.key, 'guestbook_moderation'));
  return row ? row.value === '1' : process.env.GUESTBOOK_MODERATION === '1';
}

export async function setModeration(on: boolean) {
  await dbReady;
  await db
    .insert(schema.siteSetting)
    .values({ key: 'guestbook_moderation', value: on ? '1' : '0' })
    .onConflictDoUpdate({ target: schema.siteSetting.key, set: { value: on ? '1' : '0' } });
}
