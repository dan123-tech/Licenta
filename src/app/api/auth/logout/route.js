/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */

import { clearSession } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-helpers";

export async function POST() {
  await clearSession();
  return jsonResponse({ ok: true });
}
