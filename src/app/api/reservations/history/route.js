/**
 * GET /api/reservations/history – current user's reservation history. Layer 3: LOCAL only or 503.
 */

import { listReservations } from "@/lib/reservations";
import { getProvider, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { requireCompany, jsonResponse, errorResponse, dataSourceNotConfiguredResponse } from "@/lib/api-helpers";

export async function GET(request) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  try {
    const provider = await getProvider(out.session.companyId, LAYERS.RESERVATIONS);
    if (provider !== PROVIDERS.LOCAL) return dataSourceNotConfiguredResponse(LAYERS.RESERVATIONS);
  } catch (err) {
    console.error("GET /api/reservations/history (data source) error:", err);
    return errorResponse(err?.message || "Failed to load history", 500);
  }
  const list = await listReservations({
    userId: out.session.userId,
    companyId: out.session.companyId,
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
