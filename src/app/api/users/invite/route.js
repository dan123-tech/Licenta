/**
 * POST /api/users/invite – (admin) invite user by email
 * Body: { email, name?, role? }
 */

import { z } from "zod";
import { createInvite } from "@/lib/users";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  role: z.enum(["ADMIN", "USER"]).optional().default("USER"),
});

export async function POST(request) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);
  const invite = await createInvite(
    out.session.companyId,
    parsed.data.email,
    parsed.data.role,
    parsed.data.name
  );
  return jsonResponse(
    {
      inviteId: invite.id,
      token: invite.token,
      email: invite.email,
      expiresAt: invite.expiresAt,
      message: "Invite created. Send the token to the user (e.g. by email).",
    },
    201
  );
}
