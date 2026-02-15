/**
 * Populate SharePoint-style database (WSS_Content) with sample data.
 *
 * Prerequisites:
 *   1. docker compose -f docker-compose.sharepoint-db.yml up -d
 *   2. node scripts/run-sharepoint-schema.js
 *
 * Run: node scripts/seed-sharepoint-db.js
 * Or:  SQLSERVER_PORT=1434 node scripts/seed-sharepoint-db.js
 */

const sql = require("mssql");

const config = {
  server: process.env.SQLSERVER_HOST || "localhost",
  port: parseInt(process.env.SQLSERVER_PORT || "1434", 10),
  user: process.env.SQLSERVER_USER || "sa",
  password: process.env.SQLSERVER_PASSWORD || "YourStrong!Pass123",
  database: process.env.SQLSERVER_TARGET_DB || "WSS_Content",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

const SITE_ID = "A1000000-0000-0000-0000-000000000001";
const WEB_ID = "B2000000-0000-0000-0000-000000000002";
const LIST_ID = "C3000000-0000-0000-0000-000000000003";

async function run() {
  console.log("Connecting to SharePoint DB at", config.server + ":" + config.port, "database:", config.database);
  const pool = await sql.connect(config);
  try {
    const request = pool.request();

    const siteExists = await request.query(
      `SELECT Id FROM Sites WHERE Id = '${SITE_ID}'`
    );
    if (siteExists.recordset && siteExists.recordset.length > 0) {
      console.log("SharePoint DB already seeded. Skipping.");
      return;
    }

    await request.query(`
      INSERT INTO Sites (Id, Url, Language, Deleted)
      VALUES ('${SITE_ID}', N'https://company.sharepoint.com/sites/FleetStream', 1033, 0);
    `);
    console.log("  Sites: 1 row");

    await request.query(`
      INSERT INTO Webs (Id, SiteId, FullUrl, Title, Description, Language, Deleted)
      VALUES ('${WEB_ID}', '${SITE_ID}', N'https://company.sharepoint.com/sites/FleetStream', N'FleetStream Team', N'Company car sharing', 1033, 0);
    `);
    console.log("  Webs: 1 row");

    await request.query(`
      INSERT INTO UserInfo (tp_SiteID, tp_Login, tp_Email, tp_Title, tp_Deleted, tp_IsSiteAdmin, tp_PrincipalType)
      VALUES
        ('${SITE_ID}', N'i:0#.f|membership|admin@company.com', N'admin@company.com', N'Admin User', 0, 1, 1),
        ('${SITE_ID}', N'i:0#.f|membership|jane.doe@company.com', N'jane.doe@company.com', N'Jane Doe', 0, 0, 1),
        ('${SITE_ID}', N'i:0#.f|membership|john.smith@company.com', N'john.smith@company.com', N'John Smith', 0, 0, 1);
    `);
    console.log("  UserInfo: 3 rows");

    const groupsRes = await request.query(`
      INSERT INTO Groups (SiteId, Name, Description, Deleted)
      OUTPUT INSERTED.Id
      VALUES
        ('${SITE_ID}', N'FleetStream Members', N'Can view and reserve cars', 0),
        ('${SITE_ID}', N'FleetStream Admins', N'Site administrators', 0);
    `);
    const groupIds = groupsRes.recordset.map((r) => r.Id);
    const memberGroupId = groupIds[0];
    const adminGroupId = groupIds[1];

    const userRes = await request.query(`SELECT tp_ID FROM UserInfo WHERE tp_SiteID = '${SITE_ID}' ORDER BY tp_ID`);
    const userIds = userRes.recordset.map((r) => r.tp_ID);
    const adminUserId = userIds[0];
    for (const uid of userIds) {
      await request.query(
        `INSERT INTO GroupMembership (GroupId, UserId) VALUES (${memberGroupId}, ${uid})`
      );
    }
    await request.query(
      `INSERT INTO GroupMembership (GroupId, UserId) VALUES (${adminGroupId}, ${adminUserId})`
    );
    console.log("  Groups: 2, GroupMembership: 4 rows");

    const roleRes = await request.query(`
      INSERT INTO Roles (WebId, Name, Description, Mask, Type)
      OUTPUT INSERTED.Id
      VALUES ('${WEB_ID}', N'Full Control', N'Full control', 0x7FFFFFFFFFFFFFFF, 5);
    `);
    const roleId = roleRes.recordset[0].Id;
    await request.query(`
      INSERT INTO RoleAssignment (SiteId, ScopeId, PrincipalId, RoleId)
      VALUES ('${SITE_ID}', '${WEB_ID}', ${adminUserId}, ${roleId});
    `);
    console.log("  Roles: 1, RoleAssignment: 1 row");

    await request.query(`
      INSERT INTO AllLists (tp_ID, tp_WebId, tp_Title, tp_Description, tp_ServerTemplate, tp_BaseType, tp_ItemCount, tp_Hidden, tp_Deleted)
      VALUES ('${LIST_ID}', '${WEB_ID}', N'Fleet Drivers', N'Users who can drive company cars', 100, 0, 3, 0, 0);
    `);
    console.log("  AllLists: 1 row");

    await request.query(`
      INSERT INTO ListItems (ListId, WebId, Title, AuthorId, EditorId, Deleted)
      VALUES
        ('${LIST_ID}', '${WEB_ID}', N'Admin User', ${adminUserId}, ${adminUserId}, 0),
        ('${LIST_ID}', '${WEB_ID}', N'Jane Doe', ${adminUserId}, ${adminUserId}, 0),
        ('${LIST_ID}', '${WEB_ID}', N'John Smith', ${adminUserId}, ${adminUserId}, 0);
    `);
    console.log("  ListItems: 3 rows");

    await request.query(`
      INSERT INTO AllUserData (tp_ListId, tp_SiteId, tp_WebId, tp_Author, tp_Editor, tp_Level, tp_IsCurrentVersion)
      VALUES
        ('${LIST_ID}', '${SITE_ID}', '${WEB_ID}', ${adminUserId}, ${adminUserId}, 1, 1),
        ('${LIST_ID}', '${SITE_ID}', '${WEB_ID}', ${adminUserId}, ${adminUserId}, 1, 1),
        ('${LIST_ID}', '${SITE_ID}', '${WEB_ID}', ${adminUserId}, ${adminUserId}, 1, 1);
    `);
    console.log("  AllUserData: 3 rows");

    const docId = "D4000000-0000-0000-0000-000000000004";
    await request.query(`
      INSERT INTO AllDocs (Id, SiteId, WebId, ListId, DirName, LeafName, Size, ItemId, Deleted, ContentType)
      VALUES ('${docId}', '${SITE_ID}', '${WEB_ID}', '${LIST_ID}', N'', N'Fleet Policy.pdf', 1024, 1, 0, N'application/pdf');
    `);
    console.log("  AllDocs: 1 row");

    await request.query(`
      INSERT INTO Features (SiteId, WebId, FeatureId, Version)
      VALUES ('${SITE_ID}', NULL, 'B1C0D0E0-0A0B-0C0D-0E0F-0A0B0C0D0E0F', 1);
    `);
    console.log("  Features: 1 row");

    await request.query(`
      INSERT INTO ImmedSubscriptions (Id, SiteId, UserId, ListId, AlertTitle, DeliveryChannel)
      VALUES (NEWID(), '${SITE_ID}', ${adminUserId}, '${LIST_ID}', N'New reservations', 0);
    `);
    await request.query(`
      INSERT INTO SchedSubscriptions (Id, SiteId, UserId, Schedule)
      VALUES (NEWID(), '${SITE_ID}', ${adminUserId}, N'daily');
    `);
    console.log("  ImmedSubscriptions: 1, SchedSubscriptions: 1 row");

    console.log("\n--- SharePoint DB (WSS_Content) seeded ---");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

run();
