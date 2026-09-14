import { createHash } from "node:crypto";

function requireSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error("IP_HASH_SALT is not set");
  }
  return salt;
}

export function hashEmail(email: string, salt = process.env.IP_HASH_SALT): string {
  const resolved = salt ?? requireSalt();
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(`${resolved}:${normalized}`).digest("hex");
}

export function hashIp(ip: string, salt = process.env.IP_HASH_SALT): string {
  const resolved = salt ?? requireSalt();
  return createHash("sha256").update(`${resolved}:${ip.trim()}`).digest("hex");
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "0.0.0.0";
}
