const ZWSP = "\u200b";

/**
 * Schemes, www hosts, bare domains, and email addresses.
 * Used to keep comment text from becoming a clickable link in mail clients.
 */
const URL_OR_EMAIL =
  /\b(?:(?:https?|ftp):\/\/|www\.)[^\s<>"']+|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi;

/** Insert invisible breaks so mail clients do not auto-link the token. */
function breakToken(token: string): string {
  return token.replace(/[.:/@]/g, (ch) => `${ch}${ZWSP}`);
}

/**
 * Keep commenter-supplied text from being turned into links.
 * The characters still read as the original URL; they are not wrapped in anchors.
 */
export function defangAutoLinks(text: string): string {
  const broken = text.replace(URL_OR_EMAIL, (match) => breakToken(match));
  return broken.replace(/:\/\//g, `:${ZWSP}//`);
}

/** Escape text for an HTML text node or attribute. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Commenter name or body, safe to drop into an HTML email. */
export function htmlCommentText(value: string): string {
  return escapeHtml(defangAutoLinks(value));
}

/** Same breaking rules for the plain-text part of the email. */
export function plainCommentText(value: string): string {
  return defangAutoLinks(value);
}

/** Collapse header-injection characters and extra whitespace. */
export function singleLine(value: string, max = 180): string {
  return value
    .replace(/[\r\n\u0000]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
