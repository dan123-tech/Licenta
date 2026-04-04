/**
 * Shared helpers for API routes: JSON responses and session/role checks.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isCompanyAdmin } from "@/lib/companies";

export function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** 503 when layer uses external provider (not yet connected). Client can show "Data Source Not Configured". */
export function dataSourceNotConfiguredResponse(layer, message = "Data source not configured for this layer.") {
  return NextResponse.json({ error: message, code: "DATA_SOURCE_NOT_CONFIGURED", layer }, { status: 503 });
}

/**
 * Get current session or return 401 JSON response.
 * @returns {{ session: Object } | { response: NextResponse }}
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) return { response: errorResponse("Unauthorized", 401) };
  return { session };
}

/**
 * Require session and that the user is in a company (companyId set).
 * Use for routes that need a company context (cars, reservations, users, etc.).
 * @returns {{ session: Object } | { response: NextResponse }}
 */
export async function requireCompany() {
  const out = await requireSession();
  if ("response" in out) return out;
  if (!out.session.companyId) {
    return { response: errorResponse("Join or create a company first", 403) };
  }
  return out;
}

/**
 * Require session and that the user is ADMIN for their company.
 * @returns {{ session: Object } | { response: NextResponse }}
 */
export async function requireAdmin() {
  const out = await requireCompany();
  if ("response" in out) return out;
  const admin = await isCompanyAdmin(out.session.userId, out.session.companyId);
  if (!admin) return { response: errorResponse("Forbidden", 403) };
  return out;
}
