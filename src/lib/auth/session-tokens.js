/**
 * Per-channel session ids on User: one active browser (web) + one active app (mobile).
 * Cookie carries { sid, client }; login rotates that channel’s token so other tabs/devices for that channel lose access.
 */

import crypto from "crypto";
import { prisma } from "@/lib/db";

/** @param {unknown} v */
export function normalizeClientType(v) {
  return v === "mobile" ? "mobile" : "web";
}

/**
 * Issue a new session id for this user + channel (invalidates previous cookie for that channel only).
 * @param {string} userId
 * @param {string} client "web" | "mobile"
 */
export async function rotateUserSessionToken(userId, client) {
  const sid = crypto.randomBytes(24).toString("hex");
  const c = normalizeClientType(client);
  if (c === "mobile") {
    await prisma.user.update({
      where: { id: userId },
      data: { activeMobileSessionToken: sid },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { activeWebSessionToken: sid },
    });
  }
  return sid;
}

/**
 * @param {string} userId
 * @param {string} client
 */
export async function clearUserSessionToken(userId, client) {
  const c = normalizeClientType(client);
  if (c === "mobile") {
    await prisma.user.update({
      where: { id: userId },
      data: { activeMobileSessionToken: null },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { activeWebSessionToken: null },
    });
  }
}

/**
 * @param {string} userId
 * @param {string} client
 * @param {string} sid
 */
export async function validateUserSessionToken(userId, client, sid) {
  if (!sid || !userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeWebSessionToken: true, activeMobileSessionToken: true },
  });
  if (!user) return false;
  const c = normalizeClientType(client);
  const expected = c === "mobile" ? user.activeMobileSessionToken : user.activeWebSessionToken;
  return expected != null && expected === sid;
}

/** True if this user has migrated to token-based sessions (legacy cookies without sid should be rejected). */
export async function userHasAnySessionToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeWebSessionToken: true, activeMobileSessionToken: true },
  });
  return Boolean(user?.activeWebSessionToken || user?.activeMobileSessionToken);
}
