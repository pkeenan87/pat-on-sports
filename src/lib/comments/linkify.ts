const URL_RE = /https?:\/\/[^\s<]+/gi;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape HTML, preserve newlines as <br>, and autolink http(s) URLs
 * with rel="nofollow ugc noopener".
 */
export function linkifyPlainText(text: string): string {
  const escaped = escapeHtml(text);
  const withLinks = escaped.replace(URL_RE, (raw) => {
    // Trim trailing punctuation commonly stuck to URLs.
    let url = raw;
    let trailing = "";
    while (/[.,);:!?]/.test(url.at(-1) ?? "")) {
      trailing = url.at(-1)! + trailing;
      url = url.slice(0, -1);
    }
    if (!url) return raw;
    return `<a href="${url}" rel="nofollow ugc noopener" target="_blank">${url}</a>${trailing}`;
  });
  return withLinks.replace(/\r\n|\r|\n/g, "<br>");
}
