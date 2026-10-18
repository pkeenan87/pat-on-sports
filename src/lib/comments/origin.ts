/** Same-origin CSRF check — compares Origin to the request URL's origin. */
export function checkOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Form posts from older clients sometimes omit Origin and send Referer.
 * A missing Origin is accepted only when Referer is the request's own origin.
 */
export function checkOriginOrReferer(request: Request): boolean {
  if (checkOrigin(request)) return true;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
