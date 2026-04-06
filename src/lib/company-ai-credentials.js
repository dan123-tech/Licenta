/**
 * Encrypted per-company AI credentials (Gemini API key for driving licence validation).
 * Same encryption as data-source credentials (AUTH_SECRET).
 */

import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encrypt";

/**
 * @param {string} companyId
 * @returns {Promise<string|null>} Gemini API key or null
 */
export async function getCompanyGeminiApiKey(companyId) {
  if (!companyId) return null;
  const row = await prisma.company.findUnique({
    where: { id: companyId },
    select: { aiCredentials: true },
  });
  const raw = row?.aiCredentials;
  if (!raw || typeof raw !== "object" || typeof raw.encrypted !== "string") return null;
  try {
    const json = decrypt(raw.encrypted);
    const o = JSON.parse(json);
    const k = o?.geminiApiKey;
    return typeof k === "string" && k.trim() ? k.trim() : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} companyId
 * @returns {Promise<boolean>}
 */
export async function companyHasGeminiApiKey(companyId) {
  const k = await getCompanyGeminiApiKey(companyId);
  return Boolean(k);
}

/**
 * @param {string} companyId
 * @param {{ geminiApiKey: string | null }} data — null clears stored key
 */
export async function setCompanyAiCredentials(companyId, { geminiApiKey }) {
  if (geminiApiKey == null) {
    return prisma.company.update({
      where: { id: companyId },
      data: { aiCredentials: null },
    });
  }
  const trimmed = String(geminiApiKey).trim();
  if (!trimmed) {
    return prisma.company.update({
      where: { id: companyId },
      data: { aiCredentials: null },
    });
  }
  const enc = encrypt(JSON.stringify({ geminiApiKey: trimmed }));
  return prisma.company.update({
    where: { id: companyId },
    data: { aiCredentials: { encrypted: enc } },
  });
}
