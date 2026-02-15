/**
 * POST /api/companies/current/data-source/test-firebase
 * Body: { credentials: { serviceAccountJson?: string } }
 * Tests Firebase with the provided service account JSON (e.g. from Database Settings form).
 * Admin only.
 */

import { z } from "zod";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { testFirebaseConnection } from "@/lib/connectors/firebase-users";

const bodySchema = z.object({
  credentials: z.object({
    serviceAccountJson: z.string().optional(),
  }),
});

function errMsg(e) {
  return e?.message ?? (typeof e === "string" ? e : "Firebase connection failed");
}

export async function POST(request) {
  try {
    const out = await requireAdmin();
    if ("response" in out) return out.response;
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return errorResponse("Invalid body", 422);
    const { credentials } = parsed.data;
    if (!credentials?.serviceAccountJson?.trim()) {
      return errorResponse("Paste the Service account JSON from Firebase Console → Service accounts → Generate new private key.", 422);
    }
    await testFirebaseConnection(credentials);
    return jsonResponse({ ok: true, message: "Connection successful." });
  } catch (err) {
    console.error("POST test-firebase error:", err);
    return errorResponse(errMsg(err), 500);
  }
}
