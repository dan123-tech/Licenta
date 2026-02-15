/**
 * PATCH /api/users/[id] – (admin) update member role / driving licence / name, email (SQL Server)
 * DELETE /api/users/[id] – (admin) remove member from company or delete user (SQL Server)
 */

import { z } from "zod";
import { updateMemberRole, removeMember, setUserDrivingLicenceStatus } from "@/lib/users";
import { getProvider, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { updateSqlServerUser, deleteSqlServerUser } from "@/lib/connectors/sql-server-users";
import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";

const patchSchema = z.object({
  role: z.enum(["ADMIN", "USER"]).optional(),
  drivingLicenceStatus: z.enum(["APPROVED", "REJECTED"]).optional(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
});

export async function PATCH(request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id: userId } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);
  const data = parsed.data;

  try {
    const provider = await getProvider(out.session.companyId, LAYERS.USERS);
    if (provider === PROVIDERS.SQL_SERVER) {
      const payload = {};
      if (data.role !== undefined) payload.role = data.role;
      if (data.name !== undefined) payload.name = data.name;
      if (data.email !== undefined) payload.email = data.email;
      if (data.drivingLicenceStatus !== undefined) payload.drivingLicenceStatus = data.drivingLicenceStatus;
      if (Object.keys(payload).length === 0) return errorResponse("No valid update field", 422);
      const user = await updateSqlServerUser(out.session.companyId, userId, payload);
      if (!user) return errorResponse("User not found", 404);
      return jsonResponse(user);
    }
  } catch (err) {
    console.error("PATCH /api/users/[id] error:", err);
    return errorResponse(err?.message || "Failed to update user", 500);
  }

  if (data.role != null) {
    if (userId === out.session.userId && data.role === "USER") {
      return errorResponse("Cannot revoke your own admin role", 400);
    }
    try {
      const member = await updateMemberRole(out.session.companyId, userId, data.role);
      return jsonResponse(member);
    } catch {
      return errorResponse("Member not found", 404);
    }
  }
  if (data.drivingLicenceStatus != null) {
    try {
      await setUserDrivingLicenceStatus(userId, data.drivingLicenceStatus, { verifiedBy: "ADMIN" });
      return jsonResponse({ ok: true, drivingLicenceStatus: data.drivingLicenceStatus });
    } catch {
      return errorResponse("Member not found", 404);
    }
  }
  return errorResponse("No valid update field", 422);
}

export async function DELETE(_request, { params }) {
  const out = await requireAdmin();
  if ("response" in out) return out.response;
  const { id: userId } = await params;
  if (String(userId) === String(out.session.userId)) return errorResponse("Cannot remove yourself", 400);

  try {
    const provider = await getProvider(out.session.companyId, LAYERS.USERS);
    if (provider === PROVIDERS.SQL_SERVER) {
      const result = await deleteSqlServerUser(out.session.companyId, userId);
      if (result.count === 0) return errorResponse("User not found", 404);
      return jsonResponse({ ok: true });
    }
  } catch (err) {
    console.error("DELETE /api/users/[id] error:", err);
    return errorResponse(err?.message || "Failed to delete user", 500);
  }

  try {
    await removeMember(out.session.companyId, userId);
    return jsonResponse({ ok: true });
  } catch {
    return errorResponse("Member not found", 404);
  }
}
