import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { SITE } from '@/content/site';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { Header } from '@/components/ui/Header';
import { LabsNav } from '@/components/labs/LabsNav';
import { Footer } from '@/components/ui/Footer';
import { Cursor } from '@/components/ui/Cursor';
import { Preloader } from '@/components/ui/Preloader';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Account, AccountSkeleton } from '@/components/auth/Account';
import { PageViewBeacon } from '@/components/ui/PageViewBeacon';
import { ScrollProgress } from '@/components/motion/ScrollProgress';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'], display: 'swap' });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });
const instrument = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin'], weight: '400', style: ['normal', 'italic'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.role}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.fullName, url: SITE.url }],
  keywords: ['Gangul Missaka', 'software engineer', 'portfolio', 'Edith Cowan University', 'Unity', 'Next.js', 'Sri Lanka'],
  openGraph: { type: 'website', siteName: SITE.name, title: `${SITE.name} | ${SITE.role}`, description: SITE.description, url: '/' },
  twitter: { card: 'summary_large_image', title: `${SITE.name} | ${SITE.role}`, description: SITE.description },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { themeColor: '#0c0a08', colorScheme: 'dark' };

// Runs before paint: enables reveal states only when JS is on, and skips the preloader on repeat visits.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('gm:intro')==='1')d.classList.add('intro-seen')}catch(e){}})();`;

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: SITE.fullName,
  alternateName: SITE.name,
  jobTitle: SITE.roleLong,
  url: SITE.url,
  email: `mailto:${SITE.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Colombo', addressCountry: 'LK' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: SITE.university },
  sameAs: SITE.socials.map((s) => s.url),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-bone focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Preloader />
        <SmoothScroll />
        <Header
          account={
            <Suspense fallback={<AccountSkeleton />}>
              <Account />
            </Suspense>
          }
          labs={{
            desktop: (
              <Suspense fallback={null}>
                <LabsNav variant="desktop" />
              </Suspense>
            ),
            mobile: (
              <Suspense fallback={null}>
                <LabsNav variant="mobile" />
              </Suspense>
            ),
          }}
        />
        <main id="main">{children}</main>
        <Footer />
        <CommandPalette />
        <ScrollProgress />
        <Cursor />
        <PageViewBeacon />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
