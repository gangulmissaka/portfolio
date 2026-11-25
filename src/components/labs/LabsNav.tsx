import { NAV } from '@/content/site';
import { getLabsUser } from '@/lib/labs';
import { MobileNavLink, NavLink } from '@/components/ui/NavLink';

export const LABS_NAV = { href: '/labs', label: 'Labs' } as const;
/** Its row number in the mobile menu, which lists Home, then NAV, then Labs. */
const MOBILE_INDEX = NAV.length + 1;

/**
 * Server island for the header: renders the Labs link only for the admin and approved accounts. Everyone else gets
 * nothing at all (not even hidden markup), so the link can't be found in the page source. Wrap in <Suspense>.
 */
export async function LabsNav({ variant }: { variant: 'desktop' | 'mobile' }) {
  if (!(await getLabsUser())) return null;
  return variant === 'desktop' ? <NavLink {...LABS_NAV} /> : <MobileNavLink {...LABS_NAV} index={MOBILE_INDEX} />;
}
