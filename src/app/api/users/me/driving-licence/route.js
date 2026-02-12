/**
 * POST /api/users/me/driving-licence – upload driving licence photo (multipart/form-data, field: file)
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { setUserDrivingLicenceUrl } from "@/lib/users";

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
  await writeFile(filepath, Buffer.from(bytes));
  const url = `/uploads/driving-licences/${filename}`;
  await setUserDrivingLicenceUrl(out.session.userId, { drivingLicenceUrl: url });
  return jsonResponse({ drivingLicenceUrl: url, drivingLicenceStatus: "PENDING" });
}
