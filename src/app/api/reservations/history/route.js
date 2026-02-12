/**
 * GET /api/reservations/history – current user's reservation history (all statuses)
 */

import { listReservations } from "@/lib/reservations";
import { requireSession, jsonResponse } from "@/lib/api-helpers";

export async function GET(request) {
  const out = await requireSession();
  if ("response" in out) return out.response;
  const list = await listReservations({
    userId: out.session.userId,
  });
  return jsonResponse(
    list.map((r) => ({
      id: r.id,
      car: r.car,
      startDate: r.startDate,
      endDate: r.endDate,
      purpose: r.purpose,
      status: r.status,
      pickup_code: r.pickup_code,
      code_valid_from: r.code_valid_from,
      release_code: r.release_code,
      releasedKmUsed: r.releasedKmUsed,
      releasedExceededReason: r.releasedExceededReason,
      releasedExceededStatus: r.releasedExceededStatus,
      releasedExceededAdminComment: r.releasedExceededAdminComment,
      createdAt: r.createdAt,
    }))
  );
}
