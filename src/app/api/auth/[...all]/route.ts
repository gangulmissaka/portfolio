import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';
import { dbReady } from '@/lib/db';

const handlers = toNextJsHandler(auth);

export async function GET(req: Request) {
  await dbReady;
  return handlers.GET(req);
}
export async function POST(req: Request) {
  await dbReady;
  return handlers.POST(req);
}
