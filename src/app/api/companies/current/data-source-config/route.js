/**
 * GET /api/companies/current/data-source-config – read saved config (provider per layer).
 * PATCH /api/companies/current/data-source-config – (admin) save config. Body: { users?, cars?, reservations? }
 */

import { z } from "zod";
import { getDataSourceConfig, saveDataSourceConfig } from "@/lib/data-source-manager";
import { requireCompany, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({
  users: z.enum(["LOCAL", "ENTRA", "SQL_SERVER", "FIREBASE", "SHAREPOINT"]).optional(),
  cars: z.enum(["LOCAL", "SQL_SERVER", "FIREBASE", "SHAREPOINT"]).optional(),
  reservations: z.enum(["LOCAL", "SQL_SERVER", "FIREBASE", "SHAREPOINT"]).optional(),
  usersTable: z.string().nullable().optional(),
  carsTable: z.string().nullable().optional(),
  reservationsTable: z.string().nullable().optional(),
});

function errMsg(e) {
  return e?.message ?? (typeof e === "string" ? e : "Request failed");
}

export async function GET() {
  try {
    const out = await requireCompany();
    if ("response" in out) return out.response;
    const config = await getDataSourceConfig(out.session.companyId);
    return jsonResponse(config);
  } catch (err) {
    console.error("GET data-source-config error:", err);
    return errorResponse(errMsg(err), 500);
  }
}

export async function PATCH(request) {
  try {
    const out = await requireAdmin();
    if ("response" in out) return out.response;
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      let hint = "check body";
      try {
        const err = parsed.error;
        if (err && Array.isArray(err.errors) && err.errors[0]?.message) hint = err.errors[0].message;
      } catch (_) {}
      return errorResponse("Invalid config: " + hint, 422);
    }
    const config = {};
    if (parsed.data.users != null) config.users = parsed.data.users;
    if (parsed.data.cars != null) config.cars = parsed.data.cars;
    if (parsed.data.reservations != null) config.reservations = parsed.data.reservations;
    if (parsed.data.usersTable !== undefined) config.usersTable = parsed.data.usersTable || null;
    if (parsed.data.carsTable !== undefined) config.carsTable = parsed.data.carsTable || null;
    if (parsed.data.reservationsTable !== undefined) config.reservationsTable = parsed.data.reservationsTable || null;
    await saveDataSourceConfig(out.session.companyId, config);
    const updated = await getDataSourceConfig(out.session.companyId);
    return jsonResponse(updated);
  } catch (err) {
    console.error("PATCH data-source-config error:", err);
    return errorResponse(errMsg(err), 500);
  }
}
