/**
 * Email MFA: 6-digit codes hashed with AUTH_SECRET (HMAC), short TTL.
 */

import crypto from "crypto";

export const MFA_OTP_TTL_MS = 10 * 60 * 1000;
export const MFA_MAX_ATTEMPTS = 5;

function hmacSecret() {
  const s = process.env.AUTH_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return `${s}:mfa-email-otp`;
}

export function generateSixDigitCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashMfaOtp(userId, code) {
  const norm = String(code).trim();
  return crypto.createHmac("sha256", hmacSecret()).update(`${userId}:${norm}`).digest("hex");
}

export function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(String(a), "hex");
    const bb = Buffer.from(String(b), "hex");
    if (ba.length !== bb.length || ba.length === 0) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
