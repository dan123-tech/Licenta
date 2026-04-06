/**
 * Build JSON + Set-Cookie after password (and optional MFA) succeed.
 * Shared by POST /api/auth/login and POST /api/auth/mfa-verify.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeSessionCookie } from "@/lib/auth/session";
import { normalizeClientType, rotateUserSessionToken } from "@/lib/auth/session-tokens";
import { getCompanyById } from "@/lib/companies";

/**
 * @param {{ id: string, email: string, name: string }} user
 * @param {"web"|"mobile"} clientType
 */
export async function buildLoginSuccessResponse(user, clientType, request) {
  const client = normalizeClientType(clientType);

  const enrolled = await prisma.companyMember.findMany({
    where: { userId: user.id, status: "ENROLLED" },
    include: { company: true },
  });
  const member =
    enrolled.length === 0
      ? null
      : [...enrolled].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

  if (member) {
    const sid = await rotateUserSessionToken(user.id, client);
    const company = await getCompanyById(member.companyId);
    const payload = {
      user: { id: user.id, email: user.email, name: user.name, role: member.role, companyId: member.companyId },
      company: company ? { id: company.id, name: company.name, domain: company.domain, joinCode: company.joinCode } : null,
    };
    if (client === "web") payload.webSessionId = sid;
    const res = NextResponse.json(payload);
    await writeSessionCookie(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: member.companyId,
        role: member.role,
        client,
        sid,
      },
      request,
      res
    );
    return res;
  }

  const sid = await rotateUserSessionToken(user.id, client);
  const payload = {
    user: { id: user.id, email: user.email, name: user.name, role: null, companyId: null },
    company: null,
  };
  if (client === "web") payload.webSessionId = sid;
  const res = NextResponse.json(payload);
  await writeSessionCookie(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      companyId: null,
      role: null,
      client,
      sid,
    },
    request,
    res
  );
  return res;
}
