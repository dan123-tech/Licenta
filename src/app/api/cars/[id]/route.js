/**
 * GET /api/cars/[id] – one car (with reservation history for admin)
 * PATCH /api/cars/[id] – (admin) update car
 * DELETE /api/cars/[id] – (admin) delete car
 */

import { z } from "zod";
import { getCarById, updateCar, deleteCar } from "@/lib/cars";
import { requireCompany, requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

const FUEL_TYPES = ["Benzine", "Diesel", "Electric", "Hybrid"];
const patchSchema = z.object({
  brand: z.string().min(1).max(100).optional(),
  model: z.string().max(100).optional().nullable(),
  registrationNumber: z.string().min(1).max(50).optional(),
  km: z.number().int().min(0).optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "IN_MAINTENANCE"]).optional(),
  fuelType: z.enum(FUEL_TYPES).optional(),
  averageConsumptionL100km: z.union([z.number().min(0).max(30), z.null()]).optional(),
  averageConsumptionKwh100km: z.union([z.number().min(0).max(100), z.null()]).optional(),
  batteryLevel: z.union([z.number().min(0).max(100).int(), z.null()]).optional(),
  batteryCapacityKwh: z.union([z.number().min(0).max(500), z.null()]).optional(),
  lastServiceMileage: z.union([z.number().int().min(0), z.null()]).optional(),
});

export async function GET(_request, { params }) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { id } = await params;
  const car = await getCarById(id, out.session.companyId);
  if (!car) return errorResponse("Car not found", 404);
  const canSeeHistory = out.session.role === "ADMIN";
  return jsonResponse({
    id: car.id,
    brand: car.brand,
    model: car.model,
    registrationNumber: car.registrationNumber,
    km: car.km,
    status: car.status,
    fuelType: car.fuelType ?? "Benzine",
    averageConsumptionL100km: car.averageConsumptionL100km ?? null,
    averageConsumptionKwh100km: car.averageConsumptionKwh100km ?? null,
    batteryLevel: car.batteryLevel ?? null,
    batteryCapacityKwh: car.batteryCapacityKwh ?? null,
    lastServiceMileage: car.lastServiceMileage ?? null,
    ...(canSeeHistory && {
      reservations: car.reservations.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        purpose: r.purpose,
        status: r.status,
        user: r.user,
      })),
    }),
  });
}

export async function PATCH(request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);
  const result = await updateCar(id, out.session.companyId, parsed.data);
  if (result.count === 0) return errorResponse("Car not found", 404);
  const car = await getCarById(id, out.session.companyId);
  return jsonResponse(car ?? { id });
}

export async function DELETE(_request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id } = await params;
  const result = await deleteCar(id, out.session.companyId);
  if (result.count === 0) return errorResponse("Car not found", 404);
  return jsonResponse({ ok: true });
}
