import type { APIRoute } from "astro";
import { clearSessionCookieHeader } from "../../lib/comments";

export const prerender = false;

/**
 * Sign out is a POST so that nothing can trigger it with a GET — including
 * Astro's site-wide link prefetch, which would otherwise fetch a
 * "?logout=1" link from the queue page and clear the session cookie.
 */
export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Set-Cookie": clearSessionCookieHeader(),
    },
  });
};
