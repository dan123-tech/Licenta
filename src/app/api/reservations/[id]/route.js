/**
 * PATCH /api/reservations/[id] – cancel, release, or extend reservation
 * Body: { action: "cancel" } | { action: "release", newKm: number, exceededReason?: string } | { action: "extend", endDate: "ISO string" }
 */

import { z } from "zod";
import { getReservationById, cancelReservation, extendReservation, completeReservation, updateExceededApprovalStatus, refreshReservationCodes } from "@/lib/reservations";
import { updateCar } from "@/lib/cars";
import { getCompanyById } from "@/lib/companies";
import { requireCompany, jsonResponse, errorResponse } from "@/lib/api-helpers";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("release"),
    newKm: z.number().int().min(0),
    exceededReason: z.string().max(2000).optional(),
  }),
  z.object({ action: z.literal("extend"), endDate: z.string().datetime() }),
  z.object({ action: z.literal("approveExceeded"), observations: z.string().max(2000).optional() }),
  z.object({ action: z.literal("rejectExceeded"), observations: z.string().max(2000).optional() }),
  z.object({ action: z.literal("refreshCodes") }),
]);

export async function PATCH(request, { params }) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid or missing request body", 422);
  }

  // Handle refreshCodes with loose check so web and Android (Gson) both work
  if (body && typeof body === "object" && body.action === "refreshCodes") {
    const reservation = await getReservationById(id);
    if (!reservation) return errorResponse("Reservation not found", 404);
    const isOwn = reservation.userId === out.session.userId;
    const sameCompany = reservation.car?.companyId === out.session.companyId;
    const allowed = (out.session.role === "ADMIN" && sameCompany) || (isOwn && reservation.status === "ACTIVE");
    if (!allowed) return errorResponse("Forbidden", 403);
    if (reservation.status !== "ACTIVE") return errorResponse("Only active reservations can have codes refreshed", 422);
    const updated = await refreshReservationCodes(id);
    return jsonResponse({ ok: true, pickup_code: updated.pickup_code, release_code: updated.release_code });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 422);

  const reservation = await getReservationById(id);
  if (!reservation) return errorResponse("Reservation not found", 404);

  const isOwn = reservation.userId === out.session.userId;
  const isAdmin = out.session.role === "ADMIN";
  const sameCompany = reservation.car.companyId === out.session.companyId;
  if (!isOwn && !(isAdmin && sameCompany)) return errorResponse("Forbidden", 403);

  if (parsed.data.action === "cancel") {
    await cancelReservation(id);
    if (reservation.status === "ACTIVE") {
      await updateCar(reservation.carId, reservation.car.companyId, { status: "AVAILABLE" });
    }
    return jsonResponse({ ok: true, status: "CANCELLED" });
  }

  if (parsed.data.action === "release") {
    if (reservation.status !== "ACTIVE") return errorResponse("Only active reservations can be released", 422);
    const currentKm = reservation.car.km ?? 0;
    const newKm = parsed.data.newKm;
    if (newKm < currentKm) return errorResponse("New km cannot be less than current car km", 422);
    const kmUsed = newKm - currentKm;
    const company = await getCompanyById(reservation.car.companyId);
    const defaultKm = company?.defaultKmUsage ?? 100;
    const exceededReason = (parsed.data.exceededReason ?? "").trim();
    if (kmUsed > defaultKm && !exceededReason) {
      return errorResponse("Reason is required when km used exceeds company limit (" + defaultKm + " km)", 422);
    }
    await completeReservation(id, {
      releasedKmUsed: kmUsed,
      ...(exceededReason && {
        releasedExceededReason: exceededReason,
        releasedExceededStatus: "PENDING_APPROVAL",
      }),
    });
    await updateCar(reservation.carId, reservation.car.companyId, { status: "AVAILABLE", km: newKm });
    return jsonResponse({ ok: true, status: "COMPLETED", km: newKm, kmUsed });
  }

  if (parsed.data.action === "approveExceeded" || parsed.data.action === "rejectExceeded") {
    if (out.session.role !== "ADMIN" || reservation.car.companyId !== out.session.companyId) return errorResponse("Forbidden", 403);
    if (reservation.status !== "COMPLETED" || reservation.releasedExceededStatus !== "PENDING_APPROVAL") {
      return errorResponse("Reservation has no pending km-exceeded approval", 422);
    }
    const status = parsed.data.action === "approveExceeded" ? "APPROVED" : "REJECTED";
    const observations = parsed.data.observations?.trim() || undefined;
    const updated = await updateExceededApprovalStatus(id, status, observations);
    return jsonResponse({ ok: true, releasedExceededStatus: updated.releasedExceededStatus });
  }

  const newEnd = new Date(parsed.data.endDate);
  try {
    const updated = await extendReservation(id, newEnd);
    return jsonResponse({
      id: updated.id,
      endDate: updated.endDate,
      status: updated.status,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to extend";
    return errorResponse(message, 409);
  }
}
