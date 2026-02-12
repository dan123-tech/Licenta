/**
 * GET /api/auth/session
 * Returns current user and company from session cookie.
 */

import { getSession } from "@/lib/auth";
import { getCompanyById } from "@/lib/companies";
import { getUserById } from "@/lib/users";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse("Unauthorized", 401);
  const userRow = await getUserById(session.userId);
  const baseUser = {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role ?? null,
    companyId: session.companyId ?? null,
    drivingLicenceStatus: userRow?.drivingLicenceStatus ?? null,
    drivingLicenceUrl: userRow?.drivingLicenceUrl ?? null,
  };
  if (!session.companyId) {
    return jsonResponse({ user: baseUser, company: null });
  }
  const company = await getCompanyById(session.companyId);
  return jsonResponse({
    user: baseUser,
    company: company ? {
      id: company.id,
      name: company.name,
      domain: company.domain,
      joinCode: company.joinCode,
      defaultKmUsage: company.defaultKmUsage ?? 100,
      averageFuelPricePerLiter: company.averageFuelPricePerLiter ?? null,
      defaultConsumptionL100km: company.defaultConsumptionL100km ?? 7.5,
      priceBenzinePerLiter: company.priceBenzinePerLiter ?? null,
      priceDieselPerLiter: company.priceDieselPerLiter ?? null,
      priceElectricityPerKwh: company.priceElectricityPerKwh ?? null,
    } : null,
  });
}
