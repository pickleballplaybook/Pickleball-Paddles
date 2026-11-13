import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const _scrypt = promisify(scrypt as Parameters<typeof promisify>[0]);
const COOKIE = "bundle_session";
const SEP = ".";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.BUNDLE_SESSION_SECRET;
  if (!s) throw new Error("BUNDLE_SESSION_SECRET env var not set");
  return s;
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await _scrypt(pw, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const buf = Buffer.from(hash, "hex");
    const derived = (await _scrypt(pw, salt, 64)) as Buffer;
    if (buf.length !== derived.length) return false;
    return timingSafeEqual(buf, derived);
  } catch {
    return false;
  }
}

export function signSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + TTL_MS })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}${SEP}${sig}`;
}

export function verifySession(token: string): { email: string } | null {
  const idx = token.lastIndexOf(SEP);
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  try {
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!email || Date.now() > exp) return null;
    return { email };
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export const SESSION_COOKIE = COOKIE;
export const SESSION_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TTL_MS / 1000,
};
