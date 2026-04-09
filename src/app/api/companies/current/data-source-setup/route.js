/**
 * POST /api/companies/current/data-source-setup
 * Admin: finish first-time database onboarding.
 * Body: { mode: "builtin" } — use FleetShare Prisma DB for all layers.
 *       { mode: "postgres" } — all layers already saved as External PostgreSQL with credentials + tables.
 *       { mode: "usersExternal" } — Users layer uses an external provider (Entra/Firebase/SQL Server/Postgres/SharePoint).
 */

import { z } from "zod";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";
import {
  applyBuiltinDataSourcesAndCompleteSetup,
  verifyExternalPostgresSetup,
  markDataSourceSetupComplete,
  verifyUsersExternalSetup,
} from "@/lib/companies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  mode: z.enum(["builtin", "postgres", "usersExternal"]),
});

export async function POST(request) {
  try {
    const out = await requireAdmin();
    if ("response" in out) return out.response;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Invalid body: use { \"mode\": \"builtin\" } | \"usersExternal\" | \"postgres\"", 422);
    const companyId = out.session.companyId;
    if (parsed.data.mode === "builtin") {
      await applyBuiltinDataSourcesAndCompleteSetup(companyId);
      return jsonResponse({ ok: true, mode: "builtin" });
    }
    if (parsed.data.mode === "usersExternal") {
      const v = await verifyUsersExternalSetup(companyId);
      if (!v.ok) return errorResponse(v.error, 422);
      await markDataSourceSetupComplete(companyId);
      return jsonResponse({ ok: true, mode: "usersExternal" });
    }
    const v = await verifyExternalPostgresSetup(companyId);
    if (!v.ok) return errorResponse(v.error, 422);
    await markDataSourceSetupComplete(companyId);
    return jsonResponse({ ok: true, mode: "postgres" });
  } catch (err) {
    console.error("POST data-source-setup error:", err);
    return errorResponse(err?.message || "Setup failed", 500);
  }
}
