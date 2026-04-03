/**
 * Audit log helper – append-only writes to the AuditLog table.
 * Rows are never updated or deleted; they form a tamper-evident history.
 *
 * Usage:
 *   await writeAuditLog({
 *     companyId,
 *     actorId,          // userId who performed the action (null = system)
 *     action,           // AuditAction enum value (string)
 *     entityType,       // "CAR" | "RESERVATION" | "COMPANY" | "USER"
 *     entityId,         // id of the affected row
 *     meta,             // optional plain object { before, after, reason, … }
 *   });
 *
 * Errors are caught and logged so they never break the primary API call.
 */

import { prisma } from "@/lib/db";

/**
 * @param {{
 *   companyId: string,
 *   actorId?: string | null,
 *   action: string,
 *   entityType: string,
 *   entityId?: string | null,
 *   meta?: Record<string, unknown> | null,
 * }} opts
 */
export async function writeAuditLog({ companyId, actorId = null, action, entityType, entityId = null, meta = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,
        actorId: actorId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        meta: meta ?? undefined,
      },
    });
  } catch (err) {
    // Non-fatal: log to console but do not bubble up to the caller
    console.error("[audit] Failed to write audit log:", err?.message ?? err);
  }
}

/**
 * Fetch a paginated list of audit logs for a company, newest first.
 *
 * @param {string} companyId
 * @param {{ page?: number, limit?: number, action?: string, entityType?: string }} opts
 */
export async function listAuditLogs(companyId, { page = 1, limit = 50, action, entityType } = {}) {
  const where = {
    companyId,
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);
  return { total, rows };
}
