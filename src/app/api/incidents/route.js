/**
 * GET /api/incidents - list incidents (admin: all; user: own)
 * POST /api/incidents - create incident with multipart uploads
 */

import { z } from "zod";
import { requireCompany, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { listIncidentsForAdmin, listIncidentsForUser, createIncident, addIncidentAttachments } from "@/lib/incidents";
import { persistIncidentAttachment } from "@/lib/incident-storage";
import { getProvider, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { updateSqlServerCar, getSqlServerCarById } from "@/lib/connectors/sql-server-cars";
import { updateCar, getCarById } from "@/lib/cars";

export const runtime = "nodejs";

const metaSchema = z.object({
  carId: z.string().min(1),
  title: z.string().min(1).max(120),
  severity: z.enum(["A", "B", "C"]).optional().default("C"),
  occurredAt: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

function guessKind(contentType, filename) {
  const t = String(contentType || "").toLowerCase();
  const n = String(filename || "").toLowerCase();
  if (t.startsWith("image/")) return "photo";
  if (t === "application/pdf" || n.endsWith(".pdf")) return "document";
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "document";
  return "file";
}

async function setCarMaintenanceIfSeverityA(companyId, carId) {
  try {
    const provider = await getProvider(companyId, LAYERS.CARS);
    if (provider === PROVIDERS.SQL_SERVER) {
      const before = await getSqlServerCarById(companyId, carId);
      if (before && String(before.status).toUpperCase() === "AVAILABLE") {
        await updateSqlServerCar(companyId, carId, { status: "IN_MAINTENANCE" });
      }
      return;
    }
    if (provider === PROVIDERS.LOCAL) {
      const before = await getCarById(carId, companyId);
      if (before && String(before.status).toUpperCase() === "AVAILABLE") {
        await updateCar(carId, companyId, { status: "IN_MAINTENANCE" });
      }
    }
  } catch {
    // best effort
  }
}

export async function GET() {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const isAdmin = out.session.role === "ADMIN";
  const rows = isAdmin
    ? await listIncidentsForAdmin({ companyId: out.session.companyId })
    : await listIncidentsForUser({ companyId: out.session.companyId, userId: out.session.userId });
  return jsonResponse(rows);
}

export async function POST(request) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 422);
  }

  const payload = {
    carId: String(formData.get("carId") || ""),
    title: String(formData.get("title") || ""),
    severity: String(formData.get("severity") || "C"),
    occurredAt: String(formData.get("occurredAt") || ""),
    location: String(formData.get("location") || ""),
    description: String(formData.get("description") || ""),
  };

  const parsed = metaSchema.safeParse(payload);
  if (!parsed.success) return errorResponse("Invalid input", 422);

  const occurredAt = parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : null;
  const incident = await createIncident({
    companyId: out.session.companyId,
    carId: parsed.data.carId,
    userId: out.session.userId,
    reservationId: null,
    occurredAt: occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
    severity: parsed.data.severity,
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
  });

  const files = formData.getAll("files").filter((f) => f && typeof f !== "string");
  const attachments = [];
  for (const f of files) {
    const bytes = await f.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const url = await persistIncidentAttachment(buffer, { incidentId: incident.id, filename: f.name });
    attachments.push({
      url,
      filename: f.name,
      contentType: f.type || "application/octet-stream",
      sizeBytes: f.size ?? null,
      kind: guessKind(f.type, f.name),
    });
  }

  if (attachments.length) {
    await addIncidentAttachments({ incidentId: incident.id, attachments });
  }

  if (parsed.data.severity === "A") {
    await setCarMaintenanceIfSeverityA(out.session.companyId, parsed.data.carId);
  }

  return jsonResponse({ ok: true, id: incident.id }, 201);
}

