# DBeaver connection credentials

Use these settings to connect to the FleetStream SQL Server databases in DBeaver.

---

## 1. Main FleetStream (SQL Server)

| Field     | Value              |
|----------|--------------------|
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `1433`             |
| **Database** | `FleetStream`  |
| **Username** | `sa`           |
| **Password** | `YourStrong!Pass123` |

**Start DB:** `docker compose -f docker-compose.sqlserver.yml up -d`

---

## 2. SharePoint-style database (WSS_Content)

| Field     | Value              |
|----------|--------------------|
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `1434`             |
| **Database** | `WSS_Content`  |
| **Username** | `sa`           |
| **Password** | `YourStrong!Pass123` |

**Start DB:** `docker compose -f docker-compose.sharepoint-db.yml up -d`  
**Create schema:** `node scripts/run-sharepoint-schema.js`  
**Seed data:** `node scripts/seed-sharepoint-db.js`

---

## 3. AD / Entra-style user database (ADDirectory)

| Field     | Value              |
|----------|--------------------|
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | `1435`             |
| **Database** | `ADDirectory`  |
| **Username** | `sa`           |
| **Password** | `YourStrong!Pass123` |

**Start DB:** `docker compose -f docker-compose.ad-db.yml up -d`  
**Create schema:** `node scripts/run-ad-schema.js`  
**Seed data:** `node scripts/seed-ad-db.js`

---

## DBeaver steps

1. **New connection** → **SQL Server**.
2. **Main** tab: set Host, Port, Database name.
3. **Authentication** (or **Driver properties**): set Username = `sa`, Password = `YourStrong!Pass123`.
4. If connection fails: enable **Trust server certificate** (or add `trustServerCertificate=true` in connection URL).
5. **Test connection**, then **Finish**.

**Note:** On Windows, if `localhost` fails, use `127.0.0.1` as Host.
