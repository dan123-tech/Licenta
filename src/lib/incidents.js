import { prisma } from "@/lib/db";

export async function listIncidentsForUser({ companyId, userId }) {
  return prisma.incidentReport.findMany({
    where: { companyId, userId },
    orderBy: { createdAt: "desc" },
    include: { attachments: { orderBy: { createdAt: "desc" } } },
  });
}

export async function listIncidentsForAdmin({ companyId }) {
  return prisma.incidentReport.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getIncidentById({ companyId, incidentId }) {
  return prisma.incidentReport.findFirst({
    where: { companyId, id: incidentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createIncident({
  companyId,
  carId,
  userId,
  reservationId,
  occurredAt,
  severity,
  title,
  description,
  location,
}) {
  return prisma.incidentReport.create({
    data: {
      companyId,
      carId,
      userId,
      reservationId: reservationId || null,
      occurredAt: occurredAt || null,
      severity: severity || "C",
      title,
      description: description || null,
      location: location || null,
    },
  });
}

export async function addIncidentAttachments({ incidentId, attachments }) {
  if (!attachments || attachments.length === 0) return [];
  await prisma.incidentAttachment.createMany({
    data: attachments.map((a) => ({
      incidentId,
      kind: a.kind || "file",
      filename: a.filename || "file",
      contentType: a.contentType || null,
      sizeBytes: a.sizeBytes ?? null,
      url: a.url,
    })),
  });
  return prisma.incidentAttachment.findMany({
    where: { incidentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateIncidentAdmin({ companyId, incidentId, data }) {
  return prisma.incidentReport.update({
    where: { id: incidentId },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
      ...(data.severity !== undefined ? { severity: data.severity } : {}),
    },
  });
}

