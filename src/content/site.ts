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

/** Order here is the order of the filter chips on /work. */
export const CATEGORIES = ['Web', 'Mobile app', 'Desktop app', 'Game', 'Architecture & QA', 'Project leadership', 'Networking'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Project = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  category: Category;
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
    slug: 'medfinder',
    title: 'MedFinder LK',
    kicker: 'Upload a prescription, find the pharmacy that has it',
    summary:
      'A web app where customers upload a prescription, the medicines are read from the photo automatically, and nearby pharmacies reply with what they have in stock.',
    category: 'Web',
    year: '2026',
    role: 'Solo developer',
    platform: 'Node.js + Leaflet',
    status: 'Working prototype',
    tint: '#14a37f',
    overview: [
      'Finding a medicine often means calling pharmacy after pharmacy. MedFinder LK turns that around: a customer uploads a photo of the prescription, the app reads the medicines from it, and nearby pharmacies mark which ones they have.',
      'There are three roles. Customers post requests and see the replies on a map, pharmacies answer the requests around them, and admins approve new pharmacies and manage users. It runs on a completely free stack with no paid APIs.',
    ],
    challenge:
      'Reading handwriting. Doctors’ prescriptions defeat ordinary OCR, so the app first asks a local vision model to read the image, falls back to Tesseract when that is not available, and then cleans the result against a list of known medicine names.',
    highlights: [
      { title: 'AI prescription reading', body: 'A local vision model through Ollama reads the prescription, with Tesseract OCR as the fallback. Customers can correct the list or rescan.' },
      { title: 'Forgiving medicine matching', body: 'Fuzzy matching against a medicine list turns small reading mistakes into the right medicine name.' },
      { title: 'Pharmacies near you', body: 'Haversine distance finds pharmacies around the customer, shown on an OpenStreetMap map with Leaflet.' },
      { title: 'Role-based access', body: 'JWT sign-in with hashed passwords and three roles. New pharmacies only go live after an admin approves them.' },
    ],
    stack: ['Node.js', 'Express', 'SQLite', 'Ollama vision model', 'Tesseract.js', 'Leaflet + OpenStreetMap', 'JWT'],
    links: [],
    featured: false,
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
    slug: 'dads-assistant',
    title: 'Dad’s Assistant',
    kicker: 'One app for his medicines, bills, car and documents',
    summary:
      'An Android app I built for my dad: health, bills, expenses, his vehicle and his documents in one place, with reminders that arrive on time and an AI helper that works offline.',
    category: 'Mobile app',
    year: '2026',
    role: 'Solo developer: design, build, support',
    platform: 'Android · Capacitor',
    status: 'Personal project · APK',
    tint: '#e2683c',
    overview: [
      'My dad keeps track of medicines, doctor visits, bills, renewals and a vehicle. I built him one app for all of it, tuned for his Samsung phone.',
      'It has five sections (Health, Bills & Renewals, Expenses, Vehicle and Documents) plus emergency information and an offline AI helper. Everything stays on the phone and works without internet, with an optional PIN lock and backup.',
    ],
    challenge:
      'Designing for one real person who is not a tech user: large clear screens, reminders that actually arrive on a Samsung phone, and nothing that needs an account or a connection.',
    highlights: [
      { title: 'Health', body: 'Medicine reminders with a ✓ Taken button, a tablet count with low-stock alerts, BP, sugar and weight charts, appointments and a summary to send to the doctor.' },
      { title: 'Bills that roll over', body: 'Reminders 7 days before, a day before and on the day. Repeating bills move to the next date when he marks them as paid.' },
      { title: 'Offline AI helper', body: 'Corin runs Google’s Gemma 3 1B model on the phone through MediaPipe, with no internet at all.' },
      { title: 'Companion app: Speed Boost', body: 'A small Kotlin app that keeps his phone responsive while he drives for a ride-hailing app, then restores his settings afterwards.' },
    ],
    stack: ['JavaScript', 'Capacitor', 'Android', 'Local notifications', 'MediaPipe + Gemma 3 1B', 'Kotlin'],
    links: [],
    featured: false,
  },
  {
    slug: 'fraud-detection-architecture',
    title: 'Fraud Detection Architecture',
    kicker: 'Designing a crypto fraud detection system, decision by decision',
    summary:
      'The software architecture for a cryptocurrency fraud detection system, from requirements and quality attributes to component, module, deployment and sequence views.',
    category: 'Architecture & QA',
    year: '2026',
    role: 'Project manager & team lead (requirements) · solo (architecture)',
    platform: 'UML · draw.io · Visio',
    status: 'Completed · ECU Software Architecture',
    tint: '#7c5cff',
    overview: [
      'A fintech company needs to catch fraudulent cryptocurrency transactions quickly enough to stop them. This project designed that system’s architecture in two stages.',
      'First, leading the team as project manager, we defined 35 functional requirements across seven modules, 25 measurable quality targets and eight quality attribute scenarios, and I drew the use case model. Then I designed the architecture myself with Attribute-Driven Design (ADD 3.0): a base component-and-connector view that serves every use case, refined in an iteration focused on performance.',
    ],
    challenge:
      'Fraud checks sit in the path of every transaction, so they have to be fast without letting anything through. Every design decision had to trace back to a measurable quality scenario, not a hunch.',
    highlights: [
      { title: 'Requirements you can test', body: '35 functional requirements and 25 quality targets, each written so it can be measured, plus 11 constraints and 11 architectural concerns.' },
      { title: 'Use case model', body: 'A UML use case diagram covering all 35 use cases, refined over several versions with the team.' },
      { title: 'Attribute-Driven Design', body: 'Iterations that pick drivers, choose tactics from established tactic trees and record every new element and interface.' },
      { title: 'Four views', body: 'Component-and-connector, module, deployment and sequence views, with a Kanban board tracking design progress.' },
    ],
    stack: ['ADD 3.0', 'UML', 'Quality attribute scenarios', 'Utility trees', 'draw.io', 'Visio'],
    links: [],
    featured: false,
  },
  {
    slug: 'mcp-control',
    title: 'MCP Control',
    kicker: 'A switchboard for the tools an AI agent can use',
    summary:
      'A Windows app that switches MCP servers on and off for Claude Code, including my own servers that let an AI agent work in Microsoft Project and draw UML diagrams in draw.io.',
    category: 'Desktop app',
    year: '2026',
    role: 'Solo developer',
    platform: 'Windows · Python',
    status: 'In use',
    tint: '#d4a017',
    overview: [
      'The Model Context Protocol lets AI agents use real tools. MCP Control is a small local app with one card per server: switch it on and Claude Code can use that tool, switch it off and it is gone.',
      'It ships with three servers I wrote: one that automates desktop Microsoft Project, one for Sri Lankan calendars and holidays, and one that builds UML diagrams in draw.io.',
    ],
    highlights: [
      { title: 'One switch per server', body: 'Registers or removes each server with Claude Code, backing up the config first and keeping the last ten backups.' },
      { title: 'Read-only mode', body: 'Hides every write tool, so the agent can look at a schedule but never change it.' },
      { title: 'Test connection', body: 'Starts the server exactly as Claude Code would and lists the tools it offers.' },
      { title: 'UML in draw.io', body: '19 tools for use case, class, sequence, deployment and other UML diagrams, laid out automatically.' },
    ],
    stack: ['Python', 'Model Context Protocol', 'COM automation', 'Microsoft Project', 'draw.io', 'Claude Code'],
    links: [],
    featured: false,
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
    platform: 'Next.js · Vercel',
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
    slug: 'tic-tac-tactics',
    title: 'Tic Tac Tactics',
    kicker: 'Noughts and crosses against an AI that never loses',
    summary: 'A Flutter game with three AI difficulty levels, a move timer, player stats, coins, board skins and a lucky spin.',
    category: 'Mobile app',
    year: '2025',
    role: 'Solo developer',
    platform: 'Flutter · Android',
    status: 'APK built',
    tint: '#3d7cf0',
    overview: [
      'A polished take on the oldest game there is. Pick a difficulty and play the phone: on hard it uses the minimax algorithm, so the best you can manage is a draw.',
      'Wins earn coins that unlock board skins or a lucky spin, and stats follow your record over time. The app uses an MVVM structure with Provider for state and keeps progress on the device.',
    ],
    highlights: [
      { title: 'Three levels of AI', body: 'Easy plays random moves, medium alternates random and perfect moves, and hard always plays the minimax best move.' },
      { title: 'MVVM architecture', body: 'Models, views and view models are kept apart, with Provider driving the UI from game state.' },
      { title: 'Reward loop', body: 'Coins, unlockable skins and a lucky spin give players a reason to come back.' },
      { title: 'Saved progress', body: 'Stats and unlocks persist on the device with SharedPreferences.' },
    ],
    stack: ['Flutter', 'Dart', 'Provider', 'SharedPreferences', 'Minimax'],
    links: [],
    featured: false,
  },
  {
    slug: 'myquote',
    title: 'MyQuote',
    kicker: 'A Ruby on Rails home for philosophers’ quotes',
    summary: 'A Rails web app for collecting and browsing quotes by philosopher and category, with user accounts, private or public quotes and an admin area.',
    category: 'Web',
    year: '2026',
    role: 'Solo developer',
    platform: 'Ruby on Rails',
    status: 'Completed · ECU Applications Development',
    tint: '#c0392b',
    overview: [
      'MyQuote lets people browse quotes by philosopher and category, sign up, add their own quotes and choose whether each one is public or private. Admins manage users and content from their own area.',
      'I designed the database first (users, philosophers, quotes, categories and the many-to-many link between quotes and categories), then built the app in Rails with seed data so it starts full of real quotes.',
    ],
    highlights: [
      { title: 'Database design', body: 'An ERD with a join table so one quote can sit in many categories, enforced with model validations.' },
      { title: 'Accounts from scratch', body: 'Registration, login and sessions built by hand with secure password hashing, plus user profiles.' },
      { title: 'Admin area', body: 'A separate admin dashboard for managing users and the site’s content.' },
      { title: 'Seeded content', body: 'Seed scripts load philosophers, categories and quotes in the right order for a ready-to-use app.' },
    ],
    stack: ['Ruby on Rails', 'Ruby', 'SQLite', 'ERB views', 'MVC'],
    links: [],
    featured: false,
  },
  {
    slug: 'power-hive',
    title: 'Power Hive',
    kicker: 'Community batteries to ease Colombo’s peak-hour grid',
    summary:
      'A smart-grid proposal for Colombo: shared community batteries and an app that nudges households to use power off-peak, planned as a public-private partnership.',
    category: 'Project leadership',
    year: '2026',
    role: 'Project manager & team lead · team of 4',
    platform: 'MS Project · research & pitch',
    status: 'Completed · ECU Project Methods',
    tint: '#f2b705',
    overview: [
      'Colombo’s electricity demand is rising fast, and rooftop solar only helps at peak time if it can be stored. Power Hive proposes eight community batteries (8 MWh in total) that store local solar, plus an AI-driven app that nudges households to run heavy appliances off-peak.',
      'As project manager I led the team through the full planning cycle: the project charter, stakeholder analysis, team contract, a Microsoft Project schedule, a research report on global best practice, and the final pitch.',
    ],
    challenge:
      'Making a big infrastructure idea credible. Every claim is backed by Ceylon Electricity Board figures and real community battery trials, and the partnership model spells out who is accountable for what.',
    highlights: [
      { title: 'Evidence first', body: 'Built on national data: Colombo’s electricity sales grew 10.7% in 2024, and the day peak is projected to reach 3,006 MW by 2027.' },
      { title: 'Partnership model', body: 'A government-sponsored, privately delivered pilot with clear roles for the ministry, the utility and the operator.' },
      { title: 'Planned in MS Project', body: 'Phases, milestones and dependencies scheduled and tracked as a real project plan.' },
      { title: 'The pitch', body: 'A 12-minute, 13-slide presentation shared across four speakers.' },
    ],
    stack: ['Microsoft Project', 'Project charter', 'Stakeholder analysis', 'Research report', 'PowerPoint'],
    links: [],
    featured: false,
  },
  {
    slug: 'hornet-finder',
    title: 'Hornet Finder',
    kicker: 'Reading hundreds of bike ads so I did not have to',
    summary:
      'A desktop tool that collects Honda Hornet ads from a Sri Lankan marketplace, removes the wrong models and uses a local Gemma model to read and rank the rest.',
    category: 'Desktop app',
    year: '2026',
    role: 'Solo developer',
    platform: 'Windows · Python',
    status: 'Personal tool',
    tint: '#e23b3b',
    overview: [
      'Hornet listings mix Japanese 250s with Indian CB Hornets, reposts and ads that hide problems in the description. This tool does the reading.',
      'It finds every Hornet ad, saves each page once, removes the wrong models and duplicates, and then a local Gemma model reads each description in English, Sinhala or Singlish for accidents, missing papers, repainting, modifications and other red flags before ranking the bikes.',
    ],
    highlights: [
      { title: 'A local LLM that reads Singlish', body: 'Gemma through Ollama analyses every description on the PC, with no cloud service.' },
      { title: 'Filters with reasons', body: 'Every skipped ad is listed with why it was removed, so nothing disappears silently.' },
      { title: 'Gentle on the website', body: 'One request at a time with a pause between ads, no page downloaded twice, and a full stop as soon as the site asks for one.' },
      { title: 'No guessed numbers', body: 'Missing prices stay “Negotiable”. The ranking only uses what the ad actually says.' },
    ],
    stack: ['Python', 'Tkinter', 'Ollama', 'Gemma', 'Web scraping', 'HTML parsing'],
    links: [],
    featured: false,
  },
  {
    slug: 'coming-soon',
    title: 'ComingSoon',
    kicker: 'A 2D platformer with combat and parkour',
    summary: 'A side-scrolling Unity game: a warrior fights skeletons and climbs through the level, scored on time, coins and health.',
    category: 'Game',
    year: '2026',
    role: 'Solo developer',
    platform: 'Unity 2022.3 · PC',
    status: 'Completed · ECU Game Development',
    tint: '#5aa86a',
    overview: [
      'Players guide a warrior through obstacles and enemies to the finish, earning a score from the time taken, coins collected and health left.',
      'Movement goes well beyond run and jump: grab and release ledges, crouch-slide, dash, and light or heavy attacks. Levels have more than one path, crates to push and parallax backgrounds, all wrapped in menus, a level selector, settings and a HUD. The art comes from third-party asset packs.',
    ],
    highlights: [
      { title: 'Parkour movement', body: 'Ledge grabs, crouch slides and dashes on top of smooth platformer physics.' },
      { title: 'Combat', body: 'Light and heavy attacks against enemies, with health and lives on the HUD.' },
      { title: 'Level design', body: 'Multiple routes, movable crates and collectible coins that reward exploring.' },
      { title: 'A complete game', body: 'Main menu, level selector, pause menu, settings, scores and sound.' },
    ],
    stack: ['Unity 2022.3', 'C#', '2D physics', 'Animator', 'Parallax'],
    links: [],
    featured: false,
  },
  {
    slug: 'scheduler-testing',
    title: 'Testing a Scheduler',
    kicker: 'Finding the bugs before users do',
    summary:
      'A structured test campaign on a Python meeting scheduler: black-box and white-box test design, automated pytest suites and a verdict on every reported defect.',
    category: 'Architecture & QA',
    year: '2026',
    role: 'Project manager & team lead',
    platform: 'Python · pytest',
    status: 'Completed · ECU Software Testing',
    tint: '#22a6b3',
    overview: [
      'Our team was handed a prototype meeting scheduler, with its source code and little documentation, and asked to test it the way a professional QA team would.',
      'Black-box tests drove the system through its menu using only the specification, with equivalence classes, boundary values and pairwise combinations. White-box tests used control-flow graphs, cyclomatic complexity and branch coverage of the calendar logic. Everything was automated in pytest, and each of the seven defects reported by the previous team was confirmed or ruled out.',
      'As project manager I split the work, ran the meetings and kept the minutes, and kept the plan on schedule.',
    ],
    highlights: [
      { title: 'Specification-based tests', body: 'Equivalence classes, boundary values and pairwise combinations for every menu option and input.' },
      { title: 'Code-based coverage', body: 'Control-flow graphs and cyclomatic complexity to choose paths, measured with branch coverage.' },
      { title: 'Automated in pytest', body: 'Repeatable suites that any developer can run after every change.' },
      { title: 'Defect verdicts', body: 'Each of the seven reported defects was reproduced and confirmed, or shown not to occur.' },
    ],
    stack: ['Python', 'pytest', 'Equivalence partitioning', 'Boundary value analysis', 'Control-flow graphs', 'Branch coverage'],
    links: [],
    featured: false,
  },
  {
    slug: 'perfume-explorer',
    title: 'Perfume Explorer',
    kicker: 'Searching thousands of fragrances from the command line',
    summary: 'A C++ console app that loads a large fragrance dataset and answers questions about it: search, oldest, top rated by gender and more.',
    category: 'Desktop app',
    year: '2026',
    role: 'Solo developer',
    platform: 'C++ · console',
    status: 'Completed · ECU OOP with C++',
    tint: '#b565d9',
    overview: [
      'The program reads a large semicolon-separated file of perfumes (brand, country, gender, year, ratings, notes, perfumers and main accords) into memory and turns it into a small interactive tool.',
      'From a menu you can search for a fragrance, find the oldest one, see the top five for men, women and unisex, find the longest name, and see the ten countries with the most fragrances. Real-world data needed care: decimal commas in ratings, missing values and inconsistent text.',
    ],
    highlights: [
      { title: 'Careful parsing', body: 'Handles decimal commas, blank fields and unknown values without crashing or skewing results.' },
      { title: 'Forgiving search', body: 'Input and data are normalised, so case and stray spaces never hide a match.' },
      { title: 'Rankings', body: 'Top five by rating for each gender and a country count with the top ten.' },
      { title: 'Clean structure', body: 'One struct per perfume, small single-purpose functions and a documented header for each.' },
    ],
    stack: ['C++', 'STL', 'File I/O', 'Structs', 'Visual Studio'],
    links: [],
    featured: false,
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
  { title: 'Software engineering', items: ['Programming & OOP (C++, C#, Python)', 'Software architecture (ADD, UML)', 'Requirements engineering', 'Software testing & pytest', 'Git & version control'] },
  { title: 'Product & web', items: ['Next.js & React', 'Node.js & Express', 'Ruby on Rails', 'TypeScript & Tailwind CSS', 'Desktop apps in Python'] },
  { title: 'Mobile, games & AI', items: ['Flutter & Kotlin (Android)', 'Unity & C#', 'Local LLMs (Ollama, Gemma)', 'On-device speech recognition', 'AI agents & MCP'] },
  { title: 'Leading & delivering', items: ['Project management (MS Project)', 'Team leadership', 'SQL & database design', 'Networking: VLANs, EIGRP', 'Cybersecurity fundamentals'] },
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
