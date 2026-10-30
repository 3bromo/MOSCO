import "server-only";
import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

/** scrypt hash → "scrypt$<saltHex>$<hashHex>" */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, saltHex, hashHex] = (stored || "").split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
    const key = await scrypt(password, Buffer.from(saltHex, "hex"), KEYLEN);
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== key.length) return false;
    return timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}
