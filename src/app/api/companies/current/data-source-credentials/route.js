/**
 * POST /api/companies/current/data-source-credentials – store encrypted credentials for a layer+provider.
 * Body: { layer, provider, credentials: { ... }, tableName? }
 * Admin only. No Zod – manual validation to avoid _zod errors.
 */

import { NextResponse } from "next/server";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { saveStoredCredentials, LAYERS, PROVIDERS } from "@/lib/data-source-manager";

const LAYER_VALS = [LAYERS.USERS, LAYERS.CARS, LAYERS.RESERVATIONS];
const PROVIDER_VALS = [PROVIDERS.SQL_SERVER, PROVIDERS.FIREBASE, PROVIDERS.ENTRA, PROVIDERS.SHAREPOINT];
const MAX_CREDENTIALS_JSON_BYTES = 512 * 1024;

function sanitizePayload(credentials, tableName) {
  const payload = {};
  const creds = credentials && typeof credentials === "object" ? credentials : {};
  for (const [k, v] of Object.entries(creds)) {
    if (v === undefined) continue;
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      payload[k] = v;
    } else {
      payload[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }
  }
  if (tableName != null && String(tableName).trim()) payload.tableName = String(tableName).trim();
  const json = JSON.stringify(payload);
  if (Buffer.byteLength(json, "utf8") > MAX_CREDENTIALS_JSON_BYTES) {
    throw new Error("Credentials are too large (max 512 KB). For Firebase, paste only the service account JSON.");
  }
  return payload;
}

function errMsg(e) {
  if (e == null) return "Failed to save credentials";
  if (typeof e === "string") return e;
  return e?.message ?? String(e);
}

export async function POST(request) {
  try {
    const out = await requireAdmin();
    if ("response" in out) return out.response;

    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 16) {
      return errorResponse(
        "Credentials cannot be saved: AUTH_SECRET is missing or too short. Add AUTH_SECRET to your .env file (at least 16 characters).",
        503
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    if (!body || typeof body !== "object") {
      return errorResponse("Invalid request: body must be an object", 422);
    }

    const layer = body.layer;
    const provider = body.provider;
    if (!LAYER_VALS.includes(layer)) {
      return errorResponse("Invalid request: layer must be one of users, cars, reservations", 422);
    }
    if (!PROVIDER_VALS.includes(provider)) {
      return errorResponse("Invalid request: provider must be one of SQL_SERVER, FIREBASE, ENTRA, SHAREPOINT", 422);
    }

    let payload;
    try {
      payload = sanitizePayload(body.credentials, body.tableName);
    } catch (e) {
      return errorResponse(errMsg(e), 400);
    }

    await saveStoredCredentials(out.session.companyId, layer, provider, payload);
    return jsonResponse({ ok: true });
  } catch (err) {
    const message = errMsg(err);
    console.error("POST data-source-credentials error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
