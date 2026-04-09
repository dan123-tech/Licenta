/**
 * POST /api/incidents/[id]/attachments - append files to existing incident (owner or admin)
 */

import { requireCompany, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { getIncidentById, addIncidentAttachments } from "@/lib/incidents";
import { persistIncidentAttachment } from "@/lib/incident-storage";

export const runtime = "nodejs";

function guessKind(contentType, filename) {
  const t = String(contentType || "").toLowerCase();
  const n = String(filename || "").toLowerCase();
  if (t.startsWith("image/")) return "photo";
  if (t === "application/pdf" || n.endsWith(".pdf")) return "document";
  if (n.endsWith(".doc") || n.endsWith(".docx")) return "document";
  return "file";
}

export async function POST(request, { params }) {
  const out = await requireCompany();
  if ("response" in out) return out.response;
  const { id } = await params;

  const incident = await getIncidentById({ companyId: out.session.companyId, incidentId: id });
  if (!incident) return errorResponse("Not found", 404);
  const isAdmin = out.session.role === "ADMIN";
  const isOwn = String(incident.userId) === String(out.session.userId);
  if (!isAdmin && !isOwn) return errorResponse("Forbidden", 403);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 422);
  }

  const files = formData.getAll("files").filter((f) => f && typeof f !== "string");
  if (!files.length) return errorResponse("No files", 422);

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

  await addIncidentAttachments({ incidentId: incident.id, attachments });
  return jsonResponse({ ok: true });
}

