/**
 * List reservations from PostgreSQL (read-only).
 */

import pg from "pg";
import { getStoredCredentials, getLayerTable, LAYERS, PROVIDERS } from "@/lib/data-source-manager";
import { getPostgresConfig, quotePgTableIdent, wrapPostgresError } from "./postgres-config";

const { Client } = pg;

const RES_COLUMN_MAP = [
  ["id", ["id", "Id", "ID", "ReservationId", "reservation_id"]],
  ["userId", ["userId", "UserId", "user_id", "UserID"]],
  ["carId", ["carId", "CarId", "car_id", "CarID"]],
  ["startDate", ["startDate", "StartDate", "start_date"]],
  ["endDate", ["endDate", "EndDate", "end_date"]],
  ["purpose", ["purpose", "Purpose", "PURPOSE"]],
  ["status", ["status", "Status", "STATUS"]],
  ["pickup_code", ["pickup_code", "Pickup_code", "PickupCode", "pickupCode"]],
  ["code_valid_from", ["code_valid_from", "Code_valid_from", "CodeValidFrom", "codeValidFrom"]],
  ["release_code", ["release_code", "Release_code", "ReleaseCode", "releaseCode"]],
  ["releasedKmUsed", ["releasedKmUsed", "ReleasedKmUsed", "released_km_used"]],
  ["releasedExceededReason", ["releasedExceededReason", "ReleasedExceededReason", "released_exceeded_reason"]],
  ["releasedExceededStatus", ["releasedExceededStatus", "ReleasedExceededStatus", "released_exceeded_status"]],
  ["releasedExceededAdminComment", ["releasedExceededAdminComment", "ReleasedExceededAdminComment", "released_exceeded_admin_comment"]],
  ["createdAt", ["createdAt", "CreatedAt", "created_at"]],
  ["updatedAt", ["updatedAt", "UpdatedAt", "updated_at"]],
];

function mapRowToReservation(row) {
  const rawByLower = {};
  for (const key of Object.keys(row)) rawByLower[key.toLowerCase()] = row[key];
  const r = {
    id: null,
    userId: null,
    carId: null,
    startDate: null,
    endDate: null,
    purpose: null,
    status: "ACTIVE",
    pickup_code: null,
    code_valid_from: null,
    release_code: null,
    releasedKmUsed: null,
    releasedExceededReason: null,
    releasedExceededStatus: null,
    releasedExceededAdminComment: null,
    createdAt: null,
    updatedAt: null,
    car: null,
    user: null,
  };
  for (const [outKey, possibleKeys] of RES_COLUMN_MAP) {
    for (const candidate of possibleKeys) {
      const val = rawByLower[candidate.toLowerCase()];
      if (val !== undefined && val !== null) {
        if (outKey === "startDate" || outKey === "endDate" || outKey === "code_valid_from" || outKey === "createdAt" || outKey === "updatedAt") {
          r[outKey] = val instanceof Date ? val : new Date(val);
        } else if (outKey === "releasedKmUsed") {
          r[outKey] = typeof val === "number" ? val : parseInt(val, 10);
        } else {
          r[outKey] = typeof val === "string" ? val.trim() : val;
        }
        break;
      }
    }
  }
  r.id = r.id || `pg-res-${r.carId || ""}-${r.userId || ""}-${Date.now()}`;
  const statusUpper = (r.status || "").toUpperCase().replace(/[\s-]/g, "_");
  if (["ACTIVE", "COMPLETED", "CANCELLED"].includes(statusUpper)) r.status = statusUpper;
  else r.status = "ACTIVE";
  r.car = r.carId ? { id: r.carId } : null;
  r.user = r.userId ? { id: r.userId } : null;
  return r;
}

export async function listPostgresReservations(companyId, options = {}) {
  const tableName = await getLayerTable(companyId, LAYERS.RESERVATIONS);
  if (!tableName) return null;
  const creds = await getStoredCredentials(companyId, LAYERS.RESERVATIONS, PROVIDERS.POSTGRES);
  if (!creds || !creds.host || !creds.username) return null;

  const config = getPostgresConfig(creds);
  const client = new Client(config);
  const quoted = quotePgTableIdent(tableName);
  try {
    await client.connect();
    const res = await client.query(`SELECT * FROM ${quoted}`);
    let rows = res.rows || [];
    if (options.status) {
      const want = options.status.toUpperCase().replace(/[\s-]/g, "_");
      rows = rows.filter((row) => {
        const s = (row.Status || row.status || "").toString().toUpperCase().replace(/[\s-]/g, "_");
        return s === want;
      });
    }
    if (options.carId) {
      rows = rows.filter((row) => {
        const cid = row.CarId ?? row.carId ?? row.car_id;
        return String(cid) === String(options.carId);
      });
    }
    if (options.userId) {
      rows = rows.filter((row) => {
        const uid = row.UserId ?? row.userId ?? row.user_id;
        return String(uid) === String(options.userId);
      });
    }
    return rows.map((row) => mapRowToReservation(row));
  } catch (e) {
    throw wrapPostgresError(e);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
