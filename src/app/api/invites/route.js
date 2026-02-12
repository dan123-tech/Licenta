/**
 * GET /api/invites – (admin) list company invites with status (pending / joined)
 */

import { listInvites } from "@/lib/users";
import { requireAdmin, jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const invites = await listInvites(out.session.companyId);
  const now = new Date();
  return jsonResponse(
    invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      status: inv.usedAt ? "joined" : (inv.expiresAt < now ? "expired" : "pending"),
    }))
  );
}
