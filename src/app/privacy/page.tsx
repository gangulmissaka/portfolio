import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SITE } from '@/content/site';
import { getCurrentUser } from '@/lib/auth';
import { DeleteAccountButton } from '@/components/auth/DeleteAccountButton';

export const metadata: Metadata = { title: 'Privacy', description: 'What this site collects and why.', alternates: { canonical: '/privacy' } };

export default function PrivacyPage() {
  return (
    <div className="container-x pb-32 pt-[calc(var(--header-h)+5rem)]">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow mb-6">Privacy</p>
        <h1 className="h-xl">Plain-English privacy</h1>
        <div className="mt-12 space-y-8 text-lg leading-relaxed text-bone-2 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-bone">
          <section>
            <h2>Signing in</h2>
            <p>If you sign in with Google or GitHub, this site receives your name, email address and profile photo. They’re used only to show your name and photo next to your guestbook notes and reactions, and to limit spam. Your email is never shown publicly, sold or shared.</p>
          </section>
          <section>
            <h2>Messages</h2>
            <p>Contact-form messages are stored so I can reply. Your IP address is never stored, only a salted, one-way hash used for rate limiting.</p>
          </section>
          <section>
            <h2>Analytics</h2>
            <p>There are no tracking cookies. A simple counter records how many times each page is viewed per day. Nothing identifies you.</p>
          </section>
          <section>
            <h2>Embedded video</h2>
            <p>YouTube videos load from youtube-nocookie.com, and only after you press play.</p>
          </section>
          <section>
            <h2>Your data</h2>
            <p>You can delete your account at any time; that removes your profile, guestbook notes and reactions. Questions? Email <a className="link-u text-bone" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
            <Suspense fallback={null}>
              <DeleteAccount />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}

async function DeleteAccount() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="mt-6 rounded-2xl border border-line p-5">
      <p className="text-base">Signed in as <span className="text-bone">{user.email}</span></p>
      <DeleteAccountButton />
    </div>
  );
}
