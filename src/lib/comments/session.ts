import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "pos_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(
  now = Date.now(),
  secret = process.env.SESSION_SECRET
): string {
  const resolved = secret ?? requireSessionSecret();
  const exp = now + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url"
  );
  return `${payload}.${sign(payload, resolved)}`;
}

export function verifySessionToken(
  token: string | undefined | null,
  now = Date.now(),
  secret = process.env.SESSION_SECRET
): boolean {
  if (!token) return false;
  const resolved = secret ?? process.env.SESSION_SECRET;
  if (!resolved) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = sign(payload, resolved);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: number };
    return typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

export function sessionCookieHeader(token: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    if (name === SESSION_COOKIE) return part.slice(eq + 1);
  }
  return null;
}

export function passwordsMatch(
  provided: string,
  expected: string
): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still compare to keep timing roughly constant for length mismatches.
    timingSafeEqual(a.length < b.length ? Buffer.concat([a, Buffer.alloc(b.length - a.length)]) : a.subarray(0, b.length), b);
    return false;
  }
  return timingSafeEqual(a, b);
}
