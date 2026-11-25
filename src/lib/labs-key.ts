/** Email normalisation shared by Labs access and Krama members (no server imports, safe anywhere). */

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

/**
 * The form used to compare addresses. Gmail ignores dots and anything after "+" in the name part, and
 * googlemail.com is the same mailbox, so "John.Doe+x@googlemail.com" and "johndoe@gmail.com" are one account.
 * Other domains (incl. Google Workspace) are only lowercased, because their dots can be significant.
 */
export function labsKey(email: string) {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (!GMAIL.has(domain)) return e;
  return `${local.split('+')[0].replaceAll('.', '')}@gmail.com`;
}
