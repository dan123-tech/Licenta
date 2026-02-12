/**
 * GET /api/reservations/pending-approvals – (admin) list reservations with pending km-exceeded approval
 */

import { listPendingExceededApprovals } from "@/lib/reservations";
import { requireCompany, jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  if (out.session.role !== "ADMIN") return jsonResponse([]);
  const list = await listPendingExceededApprovals(out.session.companyId);
  return jsonResponse(
    list.map((r) => ({
      id: r.id,
      userId: r.userId,
      user: r.user,
      carId: r.carId,
      car: r.car,
      releasedKmUsed: r.releasedKmUsed,
      releasedExceededReason: r.releasedExceededReason,
      releasedExceededStatus: r.releasedExceededStatus,
      startDate: r.startDate,
      endDate: r.endDate,
      updatedAt: r.updatedAt,
    }))
  );
}
