/**
 * POST /api/auth/register
 * Body: { email, password, name }
 * Creates a new user account. No company or invite – user can log in and join a company later (e.g. via invite from admin).
 */

import { z } from "zod";
import { findUserByEmail, createUser } from "@/lib/users";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(200),
});

export async function POST(request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors?.password?.[0] ?? "Invalid input";
    return errorResponse(msg, 422);
  }
  const { email, password, name } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) return errorResponse("Email already registered", 409);

  const user = await createUser({ email, password, name });

  return jsonResponse(
    { user: { id: user.id, email: user.email, name: user.name } },
    201
  );
}
