// Every word of the site lives here. Sources: Gangul_Missaka_Details.docx, the GitHub READMEs, the old portfolio data.

export const SITE = {
  name: 'Gangul Missaka',
  fullName: 'Gangul Missaka Hinguralaarachchi',
  initials: 'GM',
  role: 'Software Engineer',
  roleLong: 'Software Engineering student & builder',
  university: 'Edith Cowan University',
  degree: 'BSc Computer Science (Software Engineering)',
  location: 'Colombo, Sri Lanka',
  timeZone: 'Asia/Colombo',
  available: true,
  availability: 'Open to internships & graduate roles',
  email: 'missakabro@gmail.com',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  /** The previous 3D portfolio, hosted separately on GitHub Pages so it only loads when someone opens it. */
  valleyUrl: process.env.NEXT_PUBLIC_VALLEY_URL ?? 'https://gangulmissaka.github.io/valley/',
  description:
    'Gangul Missaka is a software engineering student at Edith Cowan University. I build games that listen, desktop apps that tidy your life, and tools that turn maths into motion.',
  socials: [
    { label: 'GitHub', handle: '@gangulmissaka', url: 'https://github.com/gangulmissaka' },
    { label: 'LinkedIn', handle: 'Missaka Hinguralaarachchi', url: 'https://www.linkedin.com/in/missaka-hinguralaarachchi-4b12a1396/' },
    { label: 'YouTube', handle: 'APPARITION trailer', url: 'https://www.youtube.com/watch?v=GJBbG5MLQfE' },
  ],
};

export const NAV = [
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/guestbook', label: 'Guestbook' },
  { href: '/contact', label: 'Contact' },
] as const;

export const STATEMENT =
  'I build software that feels considered: a horror game you finish with your own voice, a photo organiser that never loses a file, and a tool that turns equations into film. Thoughtful engineering, carefully finished.';

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  category: 'Game' | 'Desktop app' | 'Web' | 'Networking';
  year: string;
  role: string;
  platform: string;
  status: string;
  tint: string; // cover accent
  overview: string[];
  challenge?: string;
  highlights: { title: string; body: string }[];
  stack: string[];
  links: { label: string; url: string }[];
  video?: string; // YouTube id
  featured: boolean;
};

export const PROJECTS: Project[] = [
  {
    slug: 'apparition',
    title: 'APPARITION',
    kicker: 'A horror game you finish with your voice',
    summary:
      'A psychological horror game in Unity 6. To escape, the player has to speak an incantation out loud, recognised by on-device AI.',
    category: 'Game',
    year: '2026',
    role: 'Solo developer: design, programming, AI',
    platform: 'Unity 6 · PC',
    status: 'Playable build · trailer on YouTube',
    tint: '#c2412d',
    overview: [
      'APPARITION is a psychological horror game built in Unity 6. Its ending is not a button or a boss fight: the player must say an incantation aloud, and the game listens.',
      'Speech is recognised on the device, so the moment works offline and nothing the player says leaves their machine. Around it sits a stalking AI enemy and an event system that paces the fear.',
    ],
    challenge:
      'Making voice input feel like part of the horror rather than a gimmick: it has to be reliable under pressure, respond instantly, and never break immersion with a loading spinner or a network call.',
    highlights: [
      { title: 'On-device speech recognition', body: 'The final incantation is spoken out loud and recognised locally. No cloud service, no latency, no privacy trade-off.' },
      { title: 'Custom AI enemy', body: 'An enemy with pathfinding that hunts the player through the level instead of following a fixed script.' },
      { title: 'Event-driven pacing', body: 'Event systems trigger scares, audio and state changes, keeping gameplay code decoupled and easy to tune.' },
    ],
    stack: ['Unity 6', 'C#', 'On-device speech recognition', 'AI pathfinding', 'Event systems'],
    links: [{ label: 'Watch the trailer', url: 'https://www.youtube.com/watch?v=GJBbG5MLQfE' }],
    video: 'GJBbG5MLQfE',
    featured: true,
  },
  {
    slug: 'nimbo',
    title: 'Nimbo',
    kicker: 'An entire drive of photos, filed by date, safely',
    summary:
      'A Windows app that sorts a whole drive of photos into a clean dated structure. It plans first, moves only when you approve, and every run can be undone.',
    category: 'Desktop app',
    year: '2026',
    role: 'Solo developer: product, engineering, release',
    platform: 'Windows · single .exe',
    status: 'v1.0.0 released',
    tint: '#4f7dff',
    overview: [
      'Nimbo turns years of messy camera rolls, downloads and screenshots into a tidy year / month folder tree. It reads capture dates straight from EXIF and XMP headers, falls back to filenames and timestamps, and recognises screenshots and numbered dataset sequences so nothing is misfiled.',
      'It is designed around trust: a scan builds a plan you can review, applying it writes an undo journal, and the app never makes a network call.',
    ],
    challenge:
      'Moving someone’s entire photo history is scary. The engineering goal was to make a destructive operation feel completely safe: predictable, reviewable and reversible.',
    highlights: [
      { title: 'Plan → approve → apply', body: 'A two-phase workflow: nothing on disk changes until you have seen and approved the plan.' },
      { title: 'Reversible by design', body: 'Every run writes a journal, so “Undo last run” restores files exactly where they were.' },
      { title: 'Smart detection', body: 'EXIF/XMP parsing, screenshot and sequence detection, exact duplicates by content hash and optional GPU near-duplicate detection.' },
      { title: 'Private by default', body: 'No telemetry, no update checks, no network calls of any kind. Ships as one .exe with no setup.' },
    ],
    stack: ['Python', 'Tkinter GUI + CLI', 'EXIF / XMP parsing', 'Content & perceptual hashing', 'PyTorch / CUDA (optional)'],
    links: [
      { label: 'Download for Windows', url: 'https://github.com/gangulmissaka/nimbo_image_organizer/releases/latest' },
      { label: 'GitHub', url: 'https://github.com/gangulmissaka/nimbo_image_organizer' },
    ],
    featured: true,
  },
  {
    slug: 'manimdesk',
    title: 'ManimDesk',
    kicker: 'Maths animations without the command line',
    summary:
      'A cross-platform desktop app that turns Manim scripts into videos. Paste a script, pick quality and aspect ratio, press Render.',
    category: 'Desktop app',
    year: '2026',
    role: 'Solo developer, open source',
    platform: 'Windows · macOS · Linux',
    status: 'v0.2.0 released · open source',
    tint: '#d9468f',
    overview: [
      'Manim makes beautiful maths and physics animations, but it lives in the terminal and needs Python, LaTeX and a pile of packages. ManimDesk wraps all of that in a friendly desktop app.',
      'It finds every Scene in your script, renders at 480p, 720p or 1080p60, and outputs 16:9 for YouTube or 9:16 for Shorts, Reels and TikTok. A one-click installer sets up a private Python, Manim and LaTeX in a folder you choose.',
    ],
    challenge:
      'The hard part was not rendering. It was setup. Getting Python, Manim and LaTeX working is where most beginners give up, so the installer had to be one click, repairable and never touch the user’s own Python.',
    highlights: [
      { title: 'Scene picker', body: 'Detects every Scene class automatically, with an option to render them all in one go.' },
      { title: 'Made for every screen', body: '16:9 landscape or 9:16 portrait output at 480p, 720p or 1080p60.' },
      { title: 'One-click requirements', body: 'Downloads a private Python, Manim, NumPy, SciPy and TinyTeX; running it again repairs the install.' },
      { title: 'Live render log', body: 'Errors are highlighted as they happen, with buttons to open the video or its folder.' },
    ],
    stack: ['Python', 'Manim', 'LaTeX (TinyTeX)', 'Desktop GUI', 'uv / pip packaging'],
    links: [
      { label: 'GitHub', url: 'https://github.com/gangulmissaka/ManimDesk' },
      { label: 'Latest release', url: 'https://github.com/gangulmissaka/ManimDesk/releases/latest' },
    ],
    featured: true,
  },
  {
    slug: 'this-website',
    title: 'This website',
    kicker: 'A portfolio engineered like a product',
    summary:
      'The site you are on: an editorial, motion-led portfolio with Google sign-in, a guestbook, project reactions, a contact inbox and a private admin dashboard.',
    category: 'Web',
    year: '2026',
    role: 'Design & full-stack development',
    platform: 'Web · Vercel',
    status: 'Live',
    tint: '#f08a3c',
    overview: [
      'My third portfolio. The first was an animated single page; the second was a 3D open world you drove a car around. It was fun, but it made recruiters learn to drive before they could read a single project. This version puts the work first and spends the craft on typography, motion and speed.',
      'Under the hood it is a full-stack Next.js 16 app: server components, streamed authenticated UI, server actions, a Postgres database and Google sign-in.',
    ],
    challenge: 'Make it feel expensive without making it heavy: every animation runs on transforms, the first load stays tiny, and everything degrades gracefully for reduced motion and slow phones.',
    highlights: [
      { title: 'Motion system', body: 'GSAP + Lenis smooth scrolling with one easing family, masked text reveals and native view transitions between pages.' },
      { title: 'Real backend', body: 'Better Auth (Google & GitHub), Postgres via Drizzle, server actions with validation and rate limiting.' },
      { title: 'Member accounts', body: 'Visitors sign in with Google to sign the guestbook, react to projects and use member features as they launch.' },
      { title: 'Admin dashboard', body: 'Inbox, guestbook moderation and stats, only for me.' },
    ],
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'GSAP', 'Lenis', 'Better Auth', 'Drizzle', 'Postgres'],
    links: [
      { label: 'Source on GitHub', url: 'https://github.com/gangulmissaka' },
      { label: 'Drive the previous 3D version', url: SITE.valleyUrl },
    ],
    featured: true,
  },
  {
    slug: 'network-design',
    title: 'Network Design',
    kicker: 'A segmented, routed campus network',
    summary: 'A network designed in Cisco Packet Tracer for the Applied Communications unit at Edith Cowan University.',
    category: 'Networking',
    year: '2026',
    role: 'Network design, university assignment',
    platform: 'Cisco Packet Tracer',
    status: 'Completed · ECU',
    tint: '#3fae74',
    overview: [
      'Designed and configured a multi-segment network in Cisco Packet Tracer for the Applied Communications unit at Edith Cowan University.',
      'The design separates traffic with VLANs and connects the segments with dynamic EIGRP routing across routers and switches.',
    ],
    highlights: [
      { title: 'Segmentation', body: 'VLANs to separate departments and keep broadcast domains small.' },
      { title: 'Dynamic routing', body: 'EIGRP configured between routers so the network adapts when links change.' },
    ],
    stack: ['Cisco Packet Tracer', 'Routers & switches', 'VLANs', 'EIGRP'],
    links: [],
    featured: false,
  },
  {
    slug: 'roll-a-ball',
    title: 'Roll-a-Ball',
    kicker: 'Where the game development started',
    summary: 'My first Unity game, built through Unity’s Roll-a-Ball beginner course. The first step towards APPARITION.',
    category: 'Game',
    year: '2026',
    role: 'Learning project',
    platform: 'Unity',
    status: 'Completed',
    tint: '#e0a530',
    overview: [
      'Completed Unity’s Roll-a-Ball course and built a first 3D mini-game: physics-driven movement, collectibles, a score and a win state.',
      'Small, but it is where the path to APPARITION began.',
    ],
    highlights: [{ title: 'First steps in Unity', body: 'Physics, input, prefabs, scripting and UI: the foundations everything later was built on.' }],
    stack: ['Unity', 'C#'],
    links: [],
    featured: false,
  },
];

export const getProject = (slug: string) => PROJECTS.find((p) => p.slug === slug);

export const PROCESS = [
  { n: '01', title: 'Analyse', line: 'Requirements & constraints', body: 'Understand the people, the problem and the limits before writing a line. Most bad software is a good answer to the wrong question.' },
  { n: '02', title: 'Design', line: 'System architecture', body: 'Shape data, boundaries and flows. Choose the simplest architecture that will still be right in a year.' },
  { n: '03', title: 'Implement', line: 'Performant development', body: 'Build in small, tested steps. Readable code first, clever code only where it earns its place.' },
  { n: '04', title: 'Optimise', line: 'Refinement & scale', body: 'Measure, then polish: speed, accessibility, edge cases and the last 10% that makes it feel finished.' },
];

export const CAPABILITIES = [
  { title: 'Software engineering', items: ['Programming & OOP', 'Object-oriented design', 'Data structures & algorithms', 'Systems analysis', 'Git & version control'] },
  { title: 'Product & web', items: ['Next.js & React', 'TypeScript', 'Tailwind CSS', 'Motion & interaction design', 'Desktop apps in Python'] },
  { title: 'Games & AI', items: ['Unity 6 & C#', 'AI pathfinding', 'Event systems', 'On-device speech recognition', 'AI agents & MCP'] },
  { title: 'Data, networks & security', items: ['SQL & database design', 'Networking: VLANs, EIGRP', 'Cybersecurity fundamentals', 'Operating systems', 'Technical support'] },
];

export const EDUCATION = [
  { when: 'Current', where: 'Edith Cowan University', what: 'BSc Computer Science (Software Engineering)' },
  { when: 'Alumni', where: 'Royal College, Colombo 7', what: 'Secondary education' },
];

export const INTERESTS = [
  'AI agents & the Model Context Protocol',
  'Machine learning & deep learning',
  'Data management, quality & governance',
  'Multi-tier & cloud architecture',
];

export const WRITING = [
  { when: 'Oct 2026', title: 'APPARITION: a horror game finished with your voice' },
  { when: 'Apr 2026', title: 'MCP and how it lets AI agents run real business operations' },
  { when: 'Apr 2026', title: 'Five takeaways from the leaked Claude Code codebase' },
  { when: 'Apr 2026', title: 'Essential Git commands every beginner should know' },
  { when: 'Mar 2026', title: 'AI vs. machine learning vs. deep learning: the glowing sphere' },
  { when: 'Mar 2026', title: 'Data management vs. data quality vs. data governance' },
  { when: 'Mar 2026', title: 'Multi-tier architecture and the shift to SaaS, PaaS & IaaS' },
];

/**
 * What signing in unlocks. Add new member features here: `live` ones link to their page,
 * `soon` ones show as "coming soon" on the account and sign-in pages.
 */
export const MEMBER_FEATURES: { title: string; body: string; href?: string; status: 'live' | 'soon' }[] = [
  { title: 'Guestbook', body: 'Leave a note on the wall for everyone to see.', href: '/guestbook', status: 'live' },
  { title: 'Project reactions', body: 'React to the projects you like with 🔥 👏 💡.', href: '/work', status: 'live' },
  { title: 'More on the way', body: 'New member features will appear here as I build them.', status: 'soon' },
];
