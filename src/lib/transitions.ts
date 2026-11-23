// Shared <ViewTransition> props for page content: a quick fade-down out, a gentle rise in.
export const pageTransition = {
  enter: { 'nav-forward': 'page-in', 'nav-back': 'page-in', default: 'none' },
  exit: { 'nav-forward': 'page-out', 'nav-back': 'page-out', default: 'none' },
  default: 'none',
} as const;
