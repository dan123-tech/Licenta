/**
 * Simple AES-256-GCM encrypt/decrypt for sensitive config (e.g. data source credentials).
 * Uses AUTH_SECRET; key derived with SHA-256 to 32 bytes.
 */

import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET must be at least 16 characters");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(plainText) {
  if (plainText == null || typeof plainText !== "string") {
    throw new Error("Encrypt requires a string");
  }
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const enc = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(cipherText) {
  const key = getKey();
  const buf = Buffer.from(cipherText, "base64");
  if (buf.length < IV_LEN + TAG_LEN) throw new Error("Invalid encrypted payload");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}
