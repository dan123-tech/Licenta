/**
 * POST /api/auth/login
 * Body: { email, password }
 * Sets session cookie and returns user + company (company null if user has not joined/created one yet).
 */

import { z } from "zod";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword, createUserSession } from "@/lib/auth";
import { getCompanyById } from "@/lib/companies";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  /** "web" (default): one browser session; "mobile": separate slot so phone + laptop can both stay logged in */
  clientType: z.enum(["web", "mobile"]).optional(),
});

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 422);
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid email or password", 422);
    }
    const { email, password, clientType: bodyClient } = parsed.data;
    const headerClient = request.headers.get("x-client-type");
    const clientType =
      bodyClient === "mobile" || (headerClient && headerClient.toLowerCase() === "mobile") ? "mobile" : "web";

    const user = await findUserByEmail(email);
    if (!user) return errorResponse("Invalid credentials", 401);

    const ok = await verifyPassword(password, user.password);
    if (!ok) return errorResponse("Invalid credentials", 401);

    const member = await prisma.companyMember.findFirst({
      where: { userId: user.id, status: "ENROLLED" },
      include: { company: true },
    });

    if (member) {
      const sid = await createUserSession(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          companyId: member.companyId,
          role: member.role,
        },
        clientType,
        request
      );
      const company = await getCompanyById(member.companyId);
      const payload = {
        user: { id: user.id, email: user.email, name: user.name, role: member.role, companyId: member.companyId },
        company: company ? { id: company.id, name: company.name, domain: company.domain, joinCode: company.joinCode } : null,
      };
      if (clientType === "web") payload.webSessionId = sid;
      return jsonResponse(payload);
    }

    const sid = await createUserSession(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId: null,
        role: null,
      },
      clientType,
      request
    );
    const payload = {
      user: { id: user.id, email: user.email, name: user.name, role: null, companyId: null },
      company: null,
    };
    if (clientType === "web") payload.webSessionId = sid;
    return jsonResponse(payload);
  } catch (e) {
    console.error("[auth/login]", e);
    const msg = String(e?.message ?? e);
    const code = e?.code;
    if (
      code === "P1001" ||
      msg.includes("Can't reach database server") ||
      msg.includes("ECONNREFUSED")
    ) {
      return errorResponse(
        "Database is not running or DATABASE_URL is wrong. Start PostgreSQL (e.g. open Docker Desktop, then run: docker compose up -d db) and ensure .env has DATABASE_URL=postgresql://postgres:postgres@localhost:5432/company_car_sharing?schema=public",
        503
      );
    }
    if (
      msg.includes("Unknown argument") &&
      (msg.includes("activeWebSessionToken") || msg.includes("activeMobileSessionToken"))
    ) {
      return errorResponse(
        "Session support is out of date on this server. Stop the app, run: npx prisma generate (and npx prisma migrate deploy if needed), then start again.",
        503
      );
    }
    return errorResponse("Login failed", 500);
  }
}
