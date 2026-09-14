import type { APIContext } from "astro";
import { checkOrigin } from "./origin";
import {
  createSessionToken,
  passwordsMatch,
  readSessionCookie,
  sessionCookieHeader,
  verifySessionToken,
} from "./session";

export function isAdminAuthenticated(request: Request): boolean {
  const token = readSessionCookie(request.headers.get("cookie"));
  return verifySessionToken(token);
}

export function requireAdminHtml(context: APIContext): Response | null {
  if (isAdminAuthenticated(context.request)) return null;
  return context.redirect("/admin/login", 302);
}

export function requireAdminApi(request: Request): Response | null {
  if (!checkOrigin(request)) {
    return new Response(JSON.stringify({ error: "Invalid origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!isAdminAuthenticated(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/** Form POSTs use Origin or Referer against the request's own origin. */
export function requireAdminForm(request: Request): Response | null {
  if (!isAdminAuthenticated(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!checkOrigin(request)) {
    const referer = request.headers.get("referer");
    try {
      const allowed = new URL(request.url).origin;
      if (!referer || new URL(referer).origin !== allowed) {
        return new Response("Invalid origin", { status: 403 });
      }
    } catch {
      return new Response("Invalid origin", { status: 403 });
    }
  }
  return null;
}

export function loginWithPassword(password: string): Headers | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !passwordsMatch(password, expected)) return null;
  const headers = new Headers();
  headers.set("Set-Cookie", sessionCookieHeader(createSessionToken()));
  return headers;
}
