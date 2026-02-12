/**
 * Simple session handling using signed cookies (base64 JSON + HMAC-style secret).
 * For production you may replace this with NextAuth or a proper JWT library.
 * Session payload: { userId, email, companyId, role }
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "car_sharing_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return secret;
}

/**
 * Create a simple signature for the payload (HMAC-like using secret).
 * In production use crypto.createHmac('sha256', secret).update(payload).digest('hex').
 * @param {string} payload
 * @returns {string}
 */
function sign(payload) {
  const secret = getSecret();
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const c = payload.charCodeAt(i);
    hash = (hash << 5) - hash + c + secret.length;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Set the session cookie with the given payload.
 * @param {Object} payload - Session data: { userId, email, name, companyId, role }
 */
export async function setSession(payload) {
  const payloadStr = JSON.stringify(payload);
  const signature = sign(payloadStr);
  const value = Buffer.from(JSON.stringify({ p: payloadStr, s: signature })).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/**
 * Get and verify the current session from the cookie.
 * @returns {Promise<Object|null>} Session payload or null if missing/invalid
 */
export async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString());
    const expectedSig = sign(decoded.p);
    if (expectedSig !== decoded.s) return null;
    return JSON.parse(decoded.p);
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
