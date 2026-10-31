import "server-only";

import { createHmac, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

/** True when both env vars are present, so the dashboard can be used. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && sessionSecret());
}

/** Hash format: `<salt hex>:<scrypt key hex>`, as printed by `npm run hash-password`. */
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function createSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp: expires })).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Verifies the session cookie. Every admin page and Server Action calls this itself. */
export async function isAuthenticated(): Promise<boolean> {
  const secret = sessionSecret();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Login throttling: 5 failed attempts per client per 15 minutes. In memory is
// enough for a single-process portfolio server.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(client: string): boolean {
  const entry = attempts.get(client);
  return Boolean(entry && entry.resetAt > Date.now() && entry.count >= MAX_ATTEMPTS);
}

export function recordFailedLogin(client: string) {
  const now = Date.now();
  const entry = attempts.get(client);
  if (!entry || entry.resetAt <= now) {
    attempts.set(client, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  if (attempts.size > 1000) {
    for (const [key, value] of attempts) if (value.resetAt <= now) attempts.delete(key);
  }
}

export function clearFailedLogins(client: string) {
  attempts.delete(client);
}
