/**
 * GET /api/audit-logs – paginated audit log for the admin's company.
 *
 * Query params:
 *   page       number (default 1)
 *   limit      number 1-200 (default 50)
 *   action     AuditAction string (optional filter)
 *   entityType "CAR" | "RESERVATION" | "COMPANY" | "USER" (optional filter)
 */

import { listAuditLogs } from "@/lib/audit";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const action = searchParams.get("action") ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;

  try {
    const { total, rows } = await listAuditLogs(out.session.companyId, { page, limit, action, entityType });
    return jsonResponse({
      total,
      page,
      limit,
      logs: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        meta: r.meta,
        createdAt: r.createdAt,
        actor: r.actor
          ? { id: r.actor.id, name: r.actor.name, email: r.actor.email }
          : null,
      })),
    });
  } catch (err) {
    console.error("GET /api/audit-logs error:", err);
    return errorResponse(err?.message || "Failed to load audit logs", 500);
  }
}
