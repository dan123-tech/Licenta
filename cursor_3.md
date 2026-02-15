# Checkpoint – What Has Been Done (FleetStream / Database Settings)

Use this file so the AI (or you) knows the current state of the project. Update it when major features or fixes are added.

---

## 1. App Overview

- **FleetStream** – Company car sharing app (Next.js).
- **Layers:** Users, Cars, Reservations. Each layer can use: **Local** (Prisma/PostgreSQL), **SQL Server**, **Firebase**, **SharePoint**, or **Entra** (Users only).
- **Database Settings** (Admin): Choose provider per layer, enter credentials, Test Connection, Connect, Save Configuration.

---

## 2. Docker Databases Created

| Purpose | Compose file | Port | Database | Tables / Notes |
|--------|--------------|------|----------|----------------|
| Main app SQL | `docker-compose.sqlserver.yml` | 1433 | FleetStream | Users, Company, CompanyMember, Invite, Car, Cars, Reservation |
| SharePoint-style | `docker-compose.sharepoint-db.yml` | 1434 | WSS_Content | Sites, Webs, UserInfo, Groups, AllLists, AllUserData, AllDocs, DocStreams, Features, etc. |
| AD/Entra-style | `docker-compose.ad-db.yml` | 1435 | ADDirectory | ADUsers, ADGroups, ADGroupMembers |

**Credentials (all):** Host `127.0.0.1` or `localhost`, User `sa`, Password `YourStrong!Pass123`.

**Schema scripts:** `run-sqlserver-schema.js`, `run-sharepoint-schema.js`, `run-ad-schema.js`.  
**Seed scripts:** `seed-sqlserver-cars.js`, `seed-sharepoint-db.js`, `seed-ad-db.js`.

---

## 3. Documentation Files

- **DBEAVER-CREDENTIALS.md** – DBeaver connection details for all three SQL Server instances.
- **WEB-APP-CREDENTIALS.md** – What to enter in the app for Entra/SharePoint; **note:** when using Docker SharePoint/AD DBs, use **SQL Server** provider (not Entra/SharePoint) and the ports/databases above.
- **docs/SQL_SERVER_DOCKER.md** – SQL Server Docker usage.
- **docs/ANDROID_DATA_SOURCE_CONFIG.md** – Android/data source config if present.
- **docs/PROJECT-CHECKPOINT.md** – Detailed log of what was done (full description of Docker, APIs, UI, and fixes).

---

## 4. Database Settings UI & Backend

- **Connect modal:** Test Connection + Connect for **SQL Server**, **Firebase**, **Microsoft Entra (AD)**, **SharePoint**.
- **SQL Server:** Test lists tables; Connect requires a data table name; credentials and config saved per layer.
- **Firebase:** Test calls API; Connect saves credentials and sets provider for that layer.
- **Entra & SharePoint:** Connect now **saves credentials and config to backend** (fixed); Test validates required fields.
- **Save Configuration** – Saves provider and table names for **all three layers** (Users, Cars, Reservations).
- **Reset all to Local** – Sets all layers to Local and persists.

---

## 5. Key Paths

- **Orchestrator:** `src/orchestrator/config.js`, `context.jsx` – LAYERS, PROVIDERS, CREDENTIAL_SCHEMAS, load/save config and credentials.
- **Database Settings UI:** `src/components/dashboard/DatabaseSettingsSection.jsx` – Layer sections, Connect modal, handleTestConnection, handleConnect, handleSave.
- **Data source manager:** `src/lib/data-source-manager.js` – getProvider, getLayerTable, getStoredCredentials, saveDataSourceConfig, saveStoredCredentials.
- **APIs:** `data-source-config` (GET/PATCH), `data-source-credentials` (POST), `data-source/tables` (POST, SQL Server), `data-source/test-firebase` (POST).
- **Connectors:** `src/lib/connectors/sql-server-*.js`, `firebase-users.js`, `sql-server-config.js`.

---

## 6. What to Do Next (optional)

- Add real Entra/SharePoint API test endpoints if you want “Test Connection” to validate against Microsoft cloud.
- Load “has credentials” from backend (without returning secrets) to show lock icon after page reload.
- Extend Firebase/SharePoint connectors for Cars and Reservations if the app needs to read those layers from those providers.

---

*Last updated: checkpoint created; reflects work through Database Settings buttons (SSO, SQL Server, Firebase) for all layers and Docker SharePoint/AD DBs.*
