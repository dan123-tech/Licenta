/**
 * POST /api/cron/reservation-push-reminders
 * Send FCM notifications at booking start/end (catch-up window). Protected by CRON_SECRET.
 * Schedule every 5 minutes (e.g. Vercel Cron, GitHub Actions, or system cron).
 *
 * Header: Authorization: Bearer <CRON_SECRET>
 */

import { prisma } from "@/lib/db";
import { sendFcmToToken, isLikelySyntheticLongBooking } from "@/lib/push-notifications";
import { isFirebaseConfigured } from "@/lib/connectors/firebase-users";

const WINDOW_MS = 30 * 60 * 1000;

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : request.headers.get("x-cron-secret");
  if (token !== secret) return unauthorized();

  if (!isFirebaseConfigured()) {
    return Response.json({ ok: true, skipped: true, reason: "Firebase not configured" });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const candidates = await prisma.reservation.findMany({
    where: {
      status: "ACTIVE",
      user: { fcmToken: { not: null } },
      OR: [
        {
          pushReminderStartSentAt: null,
          startDate: { lte: now, gte: windowStart },
        },
        {
          pushReminderEndSentAt: null,
          endDate: { lte: now, gte: windowStart },
        },
      ],
    },
    include: {
      user: { select: { id: true, fcmToken: true } },
      car: { select: { brand: true, model: true, registrationNumber: true } },
    },
  });

  let startSent = 0;
  let endSent = 0;

  for (const r of candidates) {
    const tokenFcm = r.user?.fcmToken;
    if (!tokenFcm) continue;

    const carLabel = [r.car?.brand, r.car?.model, r.car?.registrationNumber].filter(Boolean).join(" ");

    if (!r.pushReminderStartSentAt && r.startDate <= now && r.startDate >= windowStart) {
      const ok = await sendFcmToToken(
        tokenFcm,
        { title: "Booking started", body: carLabel ? `Your booking for ${carLabel} has started.` : "Your car booking has started." },
        { type: "reservation_start", reservationId: r.id }
      );
      if (ok) {
        await prisma.reservation.update({
          where: { id: r.id },
          data: { pushReminderStartSentAt: now },
        });
        startSent += 1;
      }
    }

    if (
      !r.pushReminderEndSentAt &&
      r.endDate <= now &&
      r.endDate >= windowStart &&
      !isLikelySyntheticLongBooking(r.startDate, r.endDate)
    ) {
      const ok = await sendFcmToToken(
        tokenFcm,
        { title: "Booking ended", body: carLabel ? `Your booking for ${carLabel} has reached its end time.` : "Your car booking has ended." },
        { type: "reservation_end", reservationId: r.id }
      );
      if (ok) {
        await prisma.reservation.update({
          where: { id: r.id },
          data: { pushReminderEndSentAt: now },
        });
        endSent += 1;
      }
    }
  }

  return Response.json({ ok: true, processed: candidates.length, startSent, endSent });
}
