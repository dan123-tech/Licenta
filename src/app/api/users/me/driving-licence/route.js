/**
 * POST /api/users/me/driving-licence – upload driving licence photo and send to AI for verification
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { setUserDrivingLicenceUrl, setUserDrivingLicenceStatus, clearUserDrivingLicence } from "@/lib/users";
import { verifyDrivingLicenceWithAI } from "@/lib/ai-verification";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
  const out = await requireSession();
  if ("response" in out) return out.response;
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 422);
  }
  const file = formData.get("file");
  if (!file || typeof file === "string") return errorResponse("Missing or invalid file", 422);
  const typ = file.type?.toLowerCase();
  if (!ALLOWED_TYPES.includes(typ)) return errorResponse("Only JPEG, PNG or WebP images allowed", 422);
  if (file.size > MAX_SIZE) return errorResponse("File too large (max 5MB)", 422);
  const ext = typ === "image/jpeg" ? ".jpg" : typ === "image/png" ? ".png" : ".webp";
  const dir = path.join(process.cwd(), "public", "uploads", "driving-licences");
  await mkdir(dir, { recursive: true });
  const filename = `${out.session.userId}-${Date.now()}${ext}`;
  const filepath = path.join(dir, filename);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);
  const url = `/uploads/driving-licences/${filename}`;
  await setUserDrivingLicenceUrl(out.session.userId, { drivingLicenceUrl: url });

  // Send image to AI Docker for automatic verification
  try {
    console.info("[driving-licence] Sending image to AI verification for user", out.session.userId);
    const result = await verifyDrivingLicenceWithAI(buffer, typ, filename);
    console.info("[driving-licence] AI result:", JSON.stringify(result));
    const status = result.hasTwoPlusYearsExperience ? "APPROVED" : "REJECTED";
    await setUserDrivingLicenceStatus(out.session.userId, status, { verifiedBy: "AI" });
    return jsonResponse({
      drivingLicenceUrl: url,
      drivingLicenceStatus: status,
      aiVerified: true,
    });
  } catch (aiErr) {
    console.warn("[driving-licence] AI verification failed:", aiErr?.message ?? aiErr);
    return jsonResponse({
      drivingLicenceUrl: url,
      drivingLicenceStatus: "PENDING",
      aiVerified: false,
      message: aiErr?.message || "Licence saved; AI verification failed. An admin will review.",
    });
  }
}

/**
 * DELETE /api/users/me/driving-licence – remove driving licence photo and status
 */
export async function DELETE() {
  const out = await requireSession();
  if ("response" in out) return out.response;
  await clearUserDrivingLicence(out.session.userId);
  return jsonResponse({ drivingLicenceUrl: null, drivingLicenceStatus: null });
}
