/**
 * GET /api/incidents/[id] - get one incident
 * PATCH /api/incidents/[id] - admin update (status, severity, adminNotes)
 */

import { z } from "zod";
import { requireCompany, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { getIncidentById, updateIncidentAdmin } from "@/lib/incidents";
import { getProvider, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { updateSqlServerCar, getSqlServerCarById } from "@/lib/connectors/sql-server-cars";
import { updateCar, getCarById } from "@/lib/cars";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["SUBMITTED", "IN_REVIEW", "RESOLVED"]).optional(),
  severity: z.enum(["A", "B", "C"]).optional(),
  adminNotes: z.string().max(4000).optional().nullable(),
});

async function setCarMaintenanceIfSeverityA(companyId, carId) {
  try {
    const provider = await getProvider(companyId, LAYERS.CARS);
    if (provider === PROVIDERS.SQL_SERVER) {
      const before = await getSqlServerCarById(companyId, carId);
      if (before && String(before.status).toUpperCase() === "AVAILABLE") {
        await updateSqlServerCar(companyId, carId, { status: "IN_MAINTENANCE" });
      }
      return;
    }
    if (provider === PROVIDERS.LOCAL) {
      const before = await getCarById(carId, companyId);
      if (before && String(before.status).toUpperCase() === "AVAILABLE") {
        await updateCar(carId, companyId, { status: "IN_MAINTENANCE" });
      }
    }
  } catch {
    // best effort
  }
}

export async function GET(_request, { params }) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { id } = await params;
  const row = await getIncidentById({ companyId: out.session.companyId, incidentId: id });
  if (!row) return errorResponse("Not found", 404);
  const isAdmin = out.session.role === "ADMIN";
  const isOwn = String(row.userId) === String(out.session.userId);
  if (!isAdmin && !isOwn) return errorResponse("Forbidden", 403);
  return jsonResponse(row);
}

export async function PATCH(request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);

  const before = await getIncidentById({ companyId: out.session.companyId, incidentId: id });
  if (!before) return errorResponse("Not found", 404);

  const updated = await updateIncidentAdmin({
    companyId: out.session.companyId,
    incidentId: id,
    data: {
      ...parsed.data,
      adminNotes: parsed.data.adminNotes === null ? null : parsed.data.adminNotes,
    },
  });

  if ((parsed.data.severity || "").toUpperCase() === "A") {
    await setCarMaintenanceIfSeverityA(out.session.companyId, before.carId);
  }

  return jsonResponse(updated);
}

