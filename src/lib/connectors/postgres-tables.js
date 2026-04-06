/**
 * List public base tables from PostgreSQL (for Database Settings / setup wizard).
 */

import pg from "pg";
import { getPostgresConfig, wrapPostgresError } from "./postgres-config";

const { Client } = pg;

export async function listPostgresTables(creds) {
  const config = getPostgresConfig(creds);
  const client = new Client(config);
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return (res.rows || []).map((r) => r.table_name).filter(Boolean);
  } catch (e) {
    throw wrapPostgresError(e);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}
