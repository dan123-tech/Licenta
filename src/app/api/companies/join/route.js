/**
 * POST /api/companies/join – join a company by join code.
 * Body: { joinCode }
 */

import { z } from "zod";
import { joinCompanyByCode } from "@/lib/companies";
import { setSession } from "@/lib/auth";
import { requireSession, jsonResponse, errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  joinCode: z.string().min(1).max(20),
});

export async function POST(request) {
  const out = await requireSession();
  if ("response" in out) return out.response;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);

  const member = await joinCompanyByCode(out.session.userId, parsed.data.joinCode);
  if (!member) {
    return errorResponse("Invalid join code or you are already a member", 400);
  }

  await setSession({
    userId: out.session.userId,
    email: out.session.email,
    name: out.session.name,
    companyId: member.companyId,
    role: member.role,
  });

  return jsonResponse({
    company: {
      id: member.company.id,
      name: member.company.name,
      domain: member.company.domain,
      joinCode: member.company.joinCode,
    },
    role: member.role,
    message: "You have joined the company.",
  });
}
