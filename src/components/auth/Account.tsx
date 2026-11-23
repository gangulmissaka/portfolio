import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { providers } from '@/lib/env';
import { AccountMenu } from './AccountMenu';

/** Server island: reads the session at request time (wrap in <Suspense>). Admins get an extra "Admin" button. */
export async function Account() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-2">
      {user?.isAdmin && (
        <Link
          href="/admin"
          className="flex h-10 items-center gap-2 rounded-full border border-ember/50 bg-ember/10 px-4 text-xs font-medium text-ember backdrop-blur-xl transition-colors hover:bg-ember hover:text-ink"
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden /> Admin
        </Link>
      )}
      <AccountMenu user={user} providers={[...providers()]} />
    </div>
  );
}

export function AccountSkeleton() {
  return <span className="block h-10 w-10 rounded-full border border-line bg-ink/55 sm:w-28" aria-hidden />;
}
