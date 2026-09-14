import { timingSafeEqual } from "node:crypto";

/** Constant-time Bearer comparison (same pattern as /api/cron/prune). */
export function bearerMatches(authHeader: string, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}
