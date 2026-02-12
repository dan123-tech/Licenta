/**
 * PATCH /api/users/[id] – (admin) update member role
 * DELETE /api/users/[id] – (admin) remove member from company
 */

import { z } from "zod";
import { updateMemberRole, removeMember, setUserDrivingLicenceStatus } from "@/lib/users";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  drivingLicenceStatus: z.enum(["APPROVED", "REJECTED"]).optional(),
});

export async function PATCH(request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id: userId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);
  const data = parsed.data;
  try {
    if (data.role != null) {
      if (userId === out.session.userId && data.role === "USER") {
        return errorResponse("Cannot revoke your own admin role", 400);
      }
      const member = await updateMemberRole(out.session.companyId, userId, data.role);
      return jsonResponse(member);
    }
    if (data.drivingLicenceStatus != null) {
      await setUserDrivingLicenceStatus(userId, data.drivingLicenceStatus);
      return jsonResponse({ ok: true, drivingLicenceStatus: data.drivingLicenceStatus });
    }
    return errorResponse("No valid update field", 422);
  } catch {
    return errorResponse("Member not found", 404);
  }
}

export async function DELETE(_request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id: userId } = await params;
  if (userId === out.session.userId) return errorResponse("Cannot remove yourself", 400);
  try {
    await removeMember(out.session.companyId, userId);
    return jsonResponse({ ok: true });
  } catch {
    return errorResponse("Member not found", 404);
  }
}
