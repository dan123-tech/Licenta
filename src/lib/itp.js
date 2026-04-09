import { prisma } from "@/lib/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isItpExpired(itpExpiresAt) {
  if (!itpExpiresAt) return false;
  const exp = itpExpiresAt instanceof Date ? itpExpiresAt : new Date(itpExpiresAt);
  if (Number.isNaN(exp.getTime())) return false;
  return exp < startOfToday();
}

export function isItpDueSoon(itpExpiresAt, days) {
  if (!itpExpiresAt) return false;
  const exp = itpExpiresAt instanceof Date ? itpExpiresAt : new Date(itpExpiresAt);
  if (Number.isNaN(exp.getTime())) return false;
  const today = startOfToday();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + Math.max(0, days));
  return exp >= today && exp <= windowEnd;
}

export async function getItpMetaMap(companyId, carIds) {
  if (!companyId || !Array.isArray(carIds) || carIds.length === 0) return new Map();
  const metas = await prisma.carItpMeta.findMany({
    where: { companyId, carId: { in: carIds.map(String) } },
  });
  const map = new Map();
  for (const m of metas) map.set(String(m.carId), m);
  return map;
}

export async function upsertItpMeta(companyId, carId, { itpExpiresAt }) {
  return prisma.carItpMeta.upsert({
    where: { companyId_carId: { companyId, carId } },
    create: { companyId, carId, itpExpiresAt: itpExpiresAt ?? null },
    update: { itpExpiresAt: itpExpiresAt ?? null },
  });
}

