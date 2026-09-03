/** Shared client-side form validation — catches empty required fields and malformed emails with
 *  an on-brand inline message before hitting the network, instead of the browser's native
 *  validation bubble (inconsistent styling/wording across browsers) or a generic failure once
 *  the request comes back. Forms using this should also set `noValidate` so the native bubble
 *  never fires ahead of this check. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
