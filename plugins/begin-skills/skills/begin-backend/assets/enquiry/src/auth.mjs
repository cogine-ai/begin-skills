import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt-32768-8-1";
const HASH_PATTERN = /^scrypt-32768-8-1\$[0-9a-f]{32}\$[0-9a-f]{128}$/;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 256
  ) {
    throw new Error("Use a password between 12 and 256 characters.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, SCRYPT_OPTIONS);
  return `${HASH_PREFIX}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (
    !HASH_PATTERN.test(storedHash) ||
    typeof password !== "string" ||
    password.length > 256
  )
    return false;
  const [, salt, hash] = storedHash.split("$");
  const candidate = await scrypt(
    password,
    Buffer.from(salt, "hex"),
    64,
    SCRYPT_OPTIONS,
  );
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

export function validPasswordHash(value) {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function equalTokens(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left),
    b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readSessionCookie(header) {
  if (!header || typeof header !== "string") return null;
  const matches = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("begin_session="));
  if (matches.length !== 1) return null;
  const value = matches[0].slice("begin_session=".length);
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}

export function sessionCookie(token, maxAge = 3600) {
  // HTTP is allowed only on loopback in this teaching adapter. Use Secure on HTTPS in production.
  return `begin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
