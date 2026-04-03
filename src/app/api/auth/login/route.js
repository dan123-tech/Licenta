/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets session cookie and returns user + company (company null if user has not joined/created one yet).
 */

import { z } from "zod";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword, setSession } from "@/lib/auth";
import { getCompanyById } from "@/lib/companies";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse("Invalid email or password", 422);
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) return errorResponse("Invalid credentials", 401);

  const ok = await verifyPassword(password, user.password);
  if (!ok) return errorResponse("Invalid credentials", 401);

  const member = await prisma.companyMember.findFirst({
    where: { userId: user.id, status: "ENROLLED" },
    include: { company: true },
  });

  if (member) {
    await setSession(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: member.companyId,
        role: member.role,
      },
      request
    );
    const company = await getCompanyById(member.companyId);
    return jsonResponse({
      user: { id: user.id, email: user.email, name: user.name, role: member.role, companyId: member.companyId },
      company: company ? { id: company.id, name: company.name, domain: company.domain, joinCode: company.joinCode } : null,
    });
  }

  await setSession(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      companyId: null,
      role: null,
    },
    request
  );
  return jsonResponse({
    user: { id: user.id, email: user.email, name: user.name, role: null, companyId: null },
    company: null,
  });
}
