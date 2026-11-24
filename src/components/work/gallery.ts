import type { StaticImageData } from 'next/image';
import comingSoon2 from '@/assets/work/comingsoon-2.jpg';
import comingSoon3 from '@/assets/work/comingsoon-3.jpg';
import comingSoonMenu from '@/assets/work/comingsoon-menu.jpg';
import manimInstaller from '@/assets/work/manimdesk-installer.png';

export type Shot = { src: StaticImageData; alt: string; caption: string };

/** Real screenshots shown under "Key decisions & features" on a case study. Only the project's own work goes here. */
export const GALLERY: Record<string, Shot[]> = {
  'coming-soon': [
    { src: comingSoon2, alt: 'ComingSoon gameplay: the warrior near an enemy, crates and a well', caption: 'Combat, crates and coins along the main route.' },
    { src: comingSoon3, alt: 'ComingSoon gameplay: a vertical climbing section', caption: 'A climbing section with several routes up.' },
    { src: comingSoonMenu, alt: 'ComingSoon main menu', caption: 'Main menu with level selector, settings and scores.' },
  ],
  manimdesk: [{ src: manimInstaller, alt: 'ManimDesk’s Install Requirements window', caption: 'The one-click installer: a private Python, Manim and LaTeX in a folder you choose.' }],
};
