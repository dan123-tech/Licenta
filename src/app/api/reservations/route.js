/**
 * GET /api/reservations – list reservations (user: own; admin: company)
 * POST /api/reservations – create reservation
 */

import { z } from "zod";
import { listReservations, createReservation, createInstantReservation, ensureReservationHasCodes } from "@/lib/reservations";
import { updateCar } from "@/lib/cars";
import { requireCompany, jsonResponse, errorResponse } from "@/lib/api-helpers";

const postSchema = z.object({
  carId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  purpose: z.string().max(500).optional().nullable(),
});

export async function GET(request) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const carId = searchParams.get("carId") ?? undefined;
  const options = {
    companyId: out.session.companyId,
    status: status ?? undefined,
    carId,
  };
  if (out.session.role !== "ADMIN") options.userId = out.session.userId;
  const list = await listReservations(options);
  const withCodes = await Promise.all(list.map(ensureReservationHasCodes));
  const isAdmin = out.session.role === "ADMIN";
  return jsonResponse(
    withCodes.map((r) => {
      const isOwner = r.userId === out.session.userId;
      const showCodes = isOwner || isAdmin;
      return {
        id: r.id,
        carId: r.carId,
        car: r.car,
        userId: r.userId,
        user: r.user,
        startDate: r.startDate,
        endDate: r.endDate,
        purpose: r.purpose,
        status: r.status,
        pickup_code: showCodes ? r.pickup_code : undefined,
        code_valid_from: showCodes ? r.code_valid_from : undefined,
        release_code: showCodes ? r.release_code : undefined,
        releasedKmUsed: r.releasedKmUsed,
        releasedExceededReason: r.releasedExceededReason,
        releasedExceededStatus: r.releasedExceededStatus,
        releasedExceededAdminComment: r.releasedExceededAdminComment,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    })
  );
}

export async function POST(request) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { getUserById } = await import("@/lib/users");
  const currentUser = await getUserById(out.session.userId);
  if (currentUser?.drivingLicenceStatus !== "APPROVED") {
    return errorResponse("You must have an approved driving licence to reserve a car. Upload your driving licence and wait for admin approval.", 403);
  }
  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);
  const { carId, startDate, endDate, purpose } = parsed.data;
  const isInstant = startDate == null && endDate == null;
  try {
    let reservation;
    if (isInstant) {
      reservation = await createInstantReservation(out.session.userId, carId, purpose);
      await updateCar(carId, reservation.car.companyId, { status: "RESERVED" });
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) return errorResponse("End must be after start", 422);
      reservation = await createReservation(out.session.userId, carId, start, end, purpose);
      await updateCar(carId, reservation.car.companyId, { status: "RESERVED" });
    }
    return jsonResponse(
      {
        id: reservation.id,
        car: reservation.car,
        user: reservation.user,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        purpose: reservation.purpose,
        status: reservation.status,
        pickup_code: reservation.pickup_code,
        code_valid_from: reservation.code_valid_from,
        release_code: reservation.release_code,
      },
      201
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create reservation";
    return errorResponse(message, 409);
  }
}
