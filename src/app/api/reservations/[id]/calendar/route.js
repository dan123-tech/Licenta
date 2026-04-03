/**
 * GET /api/reservations/[id]/calendar — download reservation as text/calendar (.ics).
 * Requires session; owner or company admin of the car's company.
 */

import { requireCompany } from "@/lib/api-helpers";
import { getReservationById } from "@/lib/reservations";
import { buildReservationIcs, calendarHostFromEnv } from "@/lib/ics";
import { isCompanyAdmin } from "@/lib/companies";

export async function GET(_request, context) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const params = await context.params;
  const id = params?.id;
  if (!id || typeof id !== "string") {
    return new Response(JSON.stringify({ error: "Invalid id" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const reservation = await getReservationById(id);
  if (!reservation?.car) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  if (reservation.car.companyId !== out.session.companyId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const isAdmin = await isCompanyAdmin(out.session.userId, out.session.companyId);
  if (reservation.userId !== out.session.userId && !isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const carLabel = [reservation.car.brand, reservation.car.model, reservation.car.registrationNumber]
    .filter(Boolean)
    .join(" ");
  const summary = `Car booking: ${carLabel}`;
  const purpose = reservation.purpose ? `Purpose: ${reservation.purpose}` : "";
  const host = calendarHostFromEnv();
  const ics = buildReservationIcs({
    uid: `${reservation.id}@${host}`,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    summary,
    description: purpose || undefined,
    organizerName: reservation.user?.name,
    organizerEmail: reservation.user?.email,
  });

  const filename = `reservation-${reservation.id.slice(0, 8)}.ics`;
  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
