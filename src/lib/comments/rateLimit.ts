import { sql } from "drizzle-orm";
import { getDb } from "../../db";

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 5;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Fixed-window rate limit keyed in Postgres.
 * Upsert + SQL arithmetic so concurrent first hits cannot collide on the PK.
 */
export async function rateLimit(
  key: string,
  limit = DEFAULT_LIMIT
): Promise<RateLimitResult> {
  const db = getDb();
  const now = new Date();
  const cutoff = new Date(now.getTime() - WINDOW_MS);

  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO rate_limits ("key", window_start, count)
    VALUES (${key}, ${now}, 1)
    ON CONFLICT ("key") DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < ${cutoff} THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < ${cutoff} THEN ${now}
        ELSE rate_limits.window_start
      END
    RETURNING count
  `);

  const row = result.rows[0];
  const count = Number(row?.count ?? limit + 1);
  if (count > limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - count };
}
