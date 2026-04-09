import { mkdir, writeFile } from "fs/promises";
import path from "path";

function safeFilename(name) {
  return String(name || "file")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 180);
}

export async function persistIncidentAttachment(buffer, { incidentId, filename }) {
  const base = `${Date.now()}-${safeFilename(filename)}`;
  const dir = path.join(process.cwd(), "public", "uploads", "incidents", String(incidentId));
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, base);
  await writeFile(filepath, buffer);
  return `/uploads/incidents/${encodeURIComponent(String(incidentId))}/${encodeURIComponent(base)}`;
}

