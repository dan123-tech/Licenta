/**
 * Simple session handling using signed cookies (base64 JSON + HMAC-style secret).
 * Session payload: { userId, email, companyId, role }
 *
 * HTTPS production: __Host- prefix, Secure, SameSite=strict.
 * HTTP (e.g. LAN IP) or development: legacy name, no Secure, SameSite=lax — otherwise the browser drops the cookie and login appears to do nothing.
 */

import { cookies } from "next/headers";

const LEGACY_COOKIE_NAME = "car_sharing_session";
const HOST_COOKIE_NAME = "__Host-car_sharing_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * Whether the incoming request is served over HTTPS (or forwarded as such).
 * @param {Request} [request]
 */
export function isRequestHttps(request) {
  if (!request) return false;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded === "https") return true;
  if (forwarded === "http") return false;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Cookie name + flags for this request. __Host- requires Secure; never use it on plain HTTP.
 * @param {Request} [request]
 */
function resolveCookieBinding(request) {
  const dev = !isProduction();
  if (dev) {
    return { name: LEGACY_COOKIE_NAME, secure: false, sameSite: "lax" };
  }
  const https = isRequestHttps(request);
  if (https) {
    return { name: HOST_COOKIE_NAME, secure: true, sameSite: "strict" };
  }
  return { name: LEGACY_COOKIE_NAME, secure: false, sameSite: "lax" };
}

/** Primary cookie name for tooling (HTTPS prod → __Host-, else legacy). */
export function getSessionCookieName(request) {
  return resolveCookieBinding(request).name;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters");
  }
  return secret;
}

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
 * @param {Request} [request] - Pass from Route Handlers so HTTP vs HTTPS (LAN vs Vercel) is correct.
 */
export async function setSession(payload, request) {
  const payloadStr = JSON.stringify(payload);
  const signature = sign(payloadStr);
  const value = Buffer.from(JSON.stringify({ p: payloadStr, s: signature })).toString("base64");
  const cookieStore = await cookies();
  const { name, secure, sameSite } = resolveCookieBinding(request);
  cookieStore.set(name, value, {
    httpOnly: true,
    secure,
    sameSite,
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
  const names = isProduction() ? [HOST_COOKIE_NAME, LEGACY_COOKIE_NAME] : [LEGACY_COOKIE_NAME];
  for (const name of names) {
    const raw = cookieStore.get(name)?.value;
    if (!raw) continue;
    try {
      const decoded = JSON.parse(Buffer.from(raw, "base64").toString());
      const expectedSig = sign(decoded.p);
      if (expectedSig !== decoded.s) continue;
      return JSON.parse(decoded.p);
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(HOST_COOKIE_NAME);
  cookieStore.delete(LEGACY_COOKIE_NAME);
}
