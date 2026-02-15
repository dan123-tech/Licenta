/**
 * GET /uploads/driving-licences/:filename – serve uploaded driving licence images.
 * Next.js production mode does not serve files added to public/ after build,
 * so this route reads them from disk and returns them.
 */

import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(request, { params }) {
  const segments = (await params).path;
  const filename = Array.isArray(segments) ? segments.join("/") : segments;

  // Security: only allow image filenames, no directory traversal
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const mime = MIME_TYPES[ext];
  if (!mime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", "driving-licences", filename);
  try {
    const buffer = await readFile(filepath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
