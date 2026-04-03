/**
 * POST /api/users/me/push-token — register FCM token for cron-driven booking reminders.
 * DELETE — clear token (e.g. on logout from mobile).
 * Body: { token: string }
 */

import { z } from "zod";
import { requireSession, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { setUserFcmToken } from "@/lib/users";

const bodySchema = z.object({
  token: z.string().min(1).max(4096),
});

export async function POST(request) {
  const out = await requireSession();
  if ("response" in out) return out.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid token", 422);
  await setUserFcmToken(out.session.userId, parsed.data.token);
  return jsonResponse({ ok: true });
}

export async function DELETE() {
  const out = await requireSession();
  if ("response" in out) return out.response;
  await setUserFcmToken(out.session.userId, null);
  return jsonResponse({ ok: true });
}
