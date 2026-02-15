/**
 * GET /api/reservations/pending-approvals – (admin) list reservations with pending km-exceeded approval. Layer 3.
 */

import { listPendingExceededApprovals } from "@/lib/reservations";
import { getProvider, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { requireCompany, jsonResponse, errorResponse, dataSourceNotConfiguredResponse } from "@/lib/api-helpers";

export async function GET() {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  try {
    const provider = await getProvider(out.session.companyId, LAYERS.RESERVATIONS);
    if (provider !== PROVIDERS.LOCAL) return dataSourceNotConfiguredResponse(LAYERS.RESERVATIONS);
  } catch (err) {
    console.error("GET /api/reservations/pending-approvals (data source) error:", err);
    return errorResponse(err?.message || "Failed to load", 500);
  }
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
