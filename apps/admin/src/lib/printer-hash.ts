import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function getPepper(): string {
  const p = process.env.APP_PEPPER;
  if (!p) throw new Error("APP_PEPPER env missing");
  return p;
}

export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHmac("sha256", getPepper()).update(raw).digest("hex");
}

export function verifyToken(raw: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  return verifyHashConstantTime(hashToken(raw), storedHash);
}

export function verifyHashConstantTime(
  candidateHash: string,
  storedHash: string | null,
): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
