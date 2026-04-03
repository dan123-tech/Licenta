/**
 * POST /api/companies – create a new company (logged-in user becomes ADMIN).
 * Returns company with joinCode so others can join.
 */

import { z } from "zod";
import { createCompany } from "@/lib/companies";
import { setSession } from "@/lib/auth";
import { requireSession, jsonResponse, errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).optional().nullable(),
});

export async function POST(request) {
  const out = await requireSession();
  if ("response" in out) return out.response;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse("Invalid input", 422);

  const company = await createCompany(out.session.userId, parsed.data);

  await setSession(
    {
      userId: out.session.userId,
      email: out.session.email,
      name: out.session.name,
      companyId: company.id,
      role: "ADMIN",
    },
    request
  );

  return jsonResponse(
    {
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        joinCode: company.joinCode,
      },
      message: "Share the join code so others can join your company.",
    },
    201
  );
}
