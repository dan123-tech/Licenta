/**
 * FCM data messages for reservation reminders (server → device).
 * Requires the same Firebase Admin credentials as Firebase Auth connector.
 */

import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/connectors/firebase-users";

/**
 * @param {string} token
 * @param {{ title: string, body: string }} notification
 * @param {Record<string, string>} [data]
 * @returns {Promise<boolean>} true if send attempted and succeeded
 */
export async function sendFcmToToken(token, notification, data = {}) {
  if (!token?.trim() || !isFirebaseConfigured()) return false;
  try {
    const messaging = getMessaging(getFirebaseApp());
    await messaging.send({
      token: token.trim(),
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")])),
      android: { priority: "high" },
    });
    return true;
  } catch (e) {
    console.error("FCM send failed:", e?.message || e);
    return false;
  }
}

/** Skip synthetic "until released" end dates (long span). */
export function isLikelySyntheticLongBooking(startDate, endDate) {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const maxSpanMs = 14 * 24 * 60 * 60 * 1000;
  return end.getTime() - start.getTime() > maxSpanMs;
}
