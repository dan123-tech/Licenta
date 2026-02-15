/**
 * Populate AD/Entra-style database (ADDirectory) with sample users and groups.
 *
 * Prerequisites:
 *   1. docker compose -f docker-compose.ad-db.yml up -d
 *   2. node scripts/run-ad-schema.js
 *
 * Run: node scripts/seed-ad-db.js
 * Or:  SQLSERVER_PORT=1435 node scripts/seed-ad-db.js
 */

const sql = require("mssql");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1435", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: process.env.SQLSERVER_TARGET_DB || "ADDirectory",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

const SAMPLE_USERS = [
  { DisplayName: "Admin User", GivenName: "Admin", Surname: "User", Mail: "admin@company.com", UserPrincipalName: "admin@company.com", JobTitle: "Administrator", Department: "IT", AccountEnabled: true },
  { DisplayName: "Jane Doe", GivenName: "Jane", Surname: "Doe", Mail: "jane.doe@company.com", UserPrincipalName: "jane.doe@company.com", JobTitle: "Developer", Department: "Engineering", AccountEnabled: true },
  { DisplayName: "John Smith", GivenName: "John", Surname: "Smith", Mail: "john.smith@company.com", UserPrincipalName: "john.smith@company.com", JobTitle: "Driver", Department: "Fleet", AccountEnabled: true },
  { DisplayName: "Maria Garcia", GivenName: "Maria", Surname: "Garcia", Mail: "maria.garcia@company.com", UserPrincipalName: "maria.garcia@company.com", JobTitle: "HR Manager", Department: "HR", AccountEnabled: true },
  { DisplayName: "Bob Wilson", GivenName: "Bob", Surname: "Wilson", Mail: "bob.wilson@company.com", UserPrincipalName: "bob.wilson@company.com", JobTitle: "Fleet Coordinator", Department: "Fleet", AccountEnabled: true },
];

async function run() {
  console.log("Connecting to AD DB at", config.server + ":" + config.port, "database:", config.database);
  const pool = await sql.connect(config);
  try {
    const request = pool.request();
    const userCount = await request.query("SELECT COUNT(*) AS cnt FROM ADUsers");
    if (userCount.recordset[0].cnt > 0) {
      console.log("AD DB already seeded. Skipping.");
      return;
    }

    for (const u of SAMPLE_USERS) {
      await pool.request()
        .input("DisplayName", sql.NVarChar(255), u.DisplayName)
        .input("GivenName", sql.NVarChar(100), u.GivenName)
        .input("Surname", sql.NVarChar(100), u.Surname)
        .input("Mail", sql.NVarChar(255), u.Mail)
        .input("UserPrincipalName", sql.NVarChar(255), u.UserPrincipalName)
        .input("JobTitle", sql.NVarChar(255), u.JobTitle)
        .input("Department", sql.NVarChar(255), u.Department)
        .input("AccountEnabled", sql.Bit, u.AccountEnabled ? 1 : 0)
        .query(`
          INSERT INTO ADUsers (DisplayName, GivenName, Surname, Mail, UserPrincipalName, JobTitle, Department, AccountEnabled)
          VALUES (@DisplayName, @GivenName, @Surname, @Mail, @UserPrincipalName, @JobTitle, @Department, @AccountEnabled)
        `);
    }
    console.log("  ADUsers:", SAMPLE_USERS.length, "rows");

    const groupRes = await pool.request().query(`
      INSERT INTO ADGroups (DisplayName, Description, SecurityEnabled)
      OUTPUT INSERTED.Id
      VALUES
        (N'FleetStream Users', N'All users who can use FleetStream', 1),
        (N'FleetStream Admins', N'Administrators', 1);
    `);
    const groupIds = groupRes.recordset.map((r) => r.Id);
    const userRes = await pool.request().query("SELECT Id FROM ADUsers ORDER BY Id");
    const userIds = userRes.recordset.map((r) => r.Id);
    for (const uid of userIds) {
      await pool.request().query(
        `INSERT INTO ADGroupMembers (GroupId, UserId) VALUES (${groupIds[0]}, ${uid})`
      );
    }
    await pool.request().query(
      `INSERT INTO ADGroupMembers (GroupId, UserId) VALUES (${groupIds[1]}, ${userIds[0]})`
    );
    console.log("  ADGroups: 2, ADGroupMembers:", userIds.length + 1, "rows");

    console.log("\n--- AD DB (ADDirectory) seeded ---");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

run();
