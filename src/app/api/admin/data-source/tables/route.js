/**
 * POST /api/admin/data-source/tables – list table names from a connected database.
 * Body: { provider, host?, port?, databaseName?, username?, password? }
 * Used after Test Connection to show "Select Data Table" dropdown. Admin only.
 */

import { requireAdmin, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { listSqlServerTables } from "@/lib/connectors/sql-server-tables";
import { listPostgresTables } from "@/lib/connectors/postgres-tables";
import { PROVIDERS } from "@/lib/data-source-manager";

function errMsg(e) {
  if (e == null) return "Failed to list tables";
  if (typeof e === "string") return e;
  return e?.message ?? String(e);
}

export async function POST(request) {
  try {
    const out = await requireAdmin();
    if ("response" in out) return out.response;
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON", 400);
    }
    const provider = body?.provider;
    if (!body || typeof body !== "object") return errorResponse("Body must be an object", 400);
    const host = body.host != null ? String(body.host).trim() : "";
    const username = body.username != null ? String(body.username).trim() : "";
    const password = body.password != null ? body.password : "";
    if (!host || !username) {
      return errorResponse("Missing connection params: host, username", 422);
    }
    let tables;
    if (provider === PROVIDERS.SQL_SERVER) {
      try {
        tables = await listSqlServerTables({
          host,
          port: body.port,
          databaseName: body.databaseName,
          username,
          password,
        });
      } catch (connErr) {
        console.error("POST /api/admin/data-source/tables (SQL Server) error:", connErr);
        const msg = errMsg(connErr);
        return errorResponse(
          msg.includes("ECONNREFUSED") ? "Could not connect to SQL Server. Check host, port, and that the server is running." : msg,
          500
        );
      }
    } else if (provider === PROVIDERS.POSTGRES) {
      try {
        tables = await listPostgresTables({
          host,
          port: body.port,
          databaseName: body.databaseName,
          username,
          password,
          ssl: body.ssl,
        });
      } catch (connErr) {
        console.error("POST /api/admin/data-source/tables (PostgreSQL) error:", connErr);
        const msg = errMsg(connErr);
        return errorResponse(
          msg.includes("ECONNREFUSED") ? "Could not connect to PostgreSQL. Check host, port, and that the server is running." : msg,
          500
        );
      }
    } else {
      return errorResponse("Table listing only supported for SQL Server or PostgreSQL", 400);
    }
    return jsonResponse({ tables: Array.isArray(tables) ? tables : [] });
  } catch (err) {
    console.error("POST /api/admin/data-source/tables error:", err);
    return errorResponse(errMsg(err), 500);
  }
}
