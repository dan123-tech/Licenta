/**
 * Run sql-server-sharepoint-schema.sql against the SharePoint-style SQL Server (Docker).
 *
 * 1. Start:  docker compose -f docker-compose.sharepoint-db.yml up -d
 * 2. Run:    node scripts/run-sharepoint-schema.js
 *    (or:    SQLSERVER_PORT=1434 node scripts/run-sharepoint-schema.js)
 *
 * Uses port 1434 and database WSS_Content by default.
 */

const sql = require("mssql");
const fs = require("fs");
const path = require("path");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1434", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: "master",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

const TARGET_DB = process.env.SQLSERVER_TARGET_DB || "WSS_Content";
const SCHEMA_PATH = path.join(__dirname, "..", "sql-server-sharepoint-schema.sql");

function splitBatches(content) {
  const lines = content.split(/\r?\n/);
  const batches = [];
  let current = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase() === "GO") {
      const batch = current.join("\n").trim();
      if (batch) batches.push(batch);
      current = [];
    } else {
      current.push(line);
    }
  }
  const last = current.join("\n").trim();
  if (last) batches.push(last);
  return batches;
}

async function run() {
  console.log("Connecting to SharePoint SQL Server at", config.server + ":" + config.port, "as", config.user, "...");
  let pool;
  try {
    pool = await sql.connect(config);
    console.log("Connected.\n");

    await pool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${TARGET_DB}')
      BEGIN
        CREATE DATABASE [${TARGET_DB}];
        PRINT 'Database ${TARGET_DB} created.';
      END
    `);
    await pool.close();

    const dbConfig = { ...config, database: TARGET_DB };
    pool = await sql.connect(dbConfig);

    if (!fs.existsSync(SCHEMA_PATH)) {
      console.error("Schema file not found:", SCHEMA_PATH);
      process.exit(1);
    }
    const content = fs.readFileSync(SCHEMA_PATH, "utf8");
    const batches = splitBatches(content);
    console.log("Running", batches.length, "batch(es) from sql-server-sharepoint-schema.sql ...\n");

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      try {
        await pool.request().query(batch);
        console.log("  Batch", i + 1, "OK");
      } catch (err) {
        console.error("  Batch", i + 1, "error:", err.message);
        throw err;
      }
    }

    console.log("\n--- SharePoint-style schema applied to database", TARGET_DB, "---");
    console.log("Tables: Sites, Webs, UserInfo, Groups, AllLists, AllUserData, AllDocs, DocStreams, etc.");
    console.log("Connect with: Host", config.server, "Port", config.port, "Database", TARGET_DB);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

run();
