import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from './auth';

/**
 * Gate for every admin page: signed-out visitors go to sign-in, signed-in non-admins get a plain 404
 * (the admin area doesn't advertise itself). Only emails in ADMIN_EMAILS pass.
 */
export async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?next=/admin');
  if (!user.isAdmin) notFound();
  return user;
}
