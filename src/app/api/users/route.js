/**
 * GET /api/users – list company members (admin sees all; optional ?status=enrolled|pending)
 */

import { listCompanyMembers } from "@/lib/users";
import { requireCompany, jsonResponse } from "@/lib/api-helpers";

export async function GET(request) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const members = await listCompanyMembers(out.session.companyId, status || undefined);
  return jsonResponse(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role,
      status: m.status,
      drivingLicenceUrl: m.user.drivingLicenceUrl,
      drivingLicenceStatus: m.user.drivingLicenceStatus,
      createdAt: m.createdAt,
    }))
  );
}
