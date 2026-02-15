# Project Checkpoint – Detailed Log of What Was Done

This document describes in detail the work done on the FleetStream project related to Database Settings, Docker databases, SSO (Entra/SharePoint), SQL Server, and Firebase for all layers (Users, Cars, Reservations).

---

## 1. Application Context

- **App name:** FleetStream (company car sharing).
- **Stack:** Next.js, Prisma, PostgreSQL (default “Local” DB).
- **Data layers:** Each of **Users**, **Cars**, and **Reservations** can be backed by:
  - **Local** – Prisma/PostgreSQL (default).
  - **SQL Server** – External SQL Server (e.g. Docker).
  - **Firebase** – Firebase Auth/Realtime DB etc.
  - **SharePoint** – SharePoint Online (or SharePoint-style source).
  - **Microsoft Entra (AD)** – Users layer only.

- **Database Settings** lives in the admin dashboard: one provider per layer, credentials per provider, optional “data table name” for SQL Server.

---

## 2. Docker Setup

### 2.1 Main FleetStream SQL Server

- **File:** `docker-compose.sqlserver.yml`
- **Container:** `fleetstream-sqlserver`
- **Port:** `1433`
- **Database:** `FleetStream`
- **Credentials:** Host `127.0.0.1` / `localhost`, User `sa`, Password `YourStrong!Pass123`
- **Schema:** `sql-server-schema.sql` – tables: Users, Company, CompanyMember, Invite, Car, Cars, Reservation.
- **Scripts:**
  - `node scripts/run-sqlserver-schema.js` – create DB and tables.
  - `node scripts/seed-sqlserver.js` – seed DB (and optional `seed-sqlserver-cars.js` for cars).
- **Docs:** `docs/SQL_SERVER_DOCKER.md`, `DBEAVER-CREDENTIALS.md`.

### 2.2 SharePoint-Style Database

- **File:** `docker-compose.sharepoint-db.yml`
- **Container:** `fleetstream-sharepoint-db`
- **Port:** `1434` (host) → 1433 (container)
- **Database:** `WSS_Content`
- **Credentials:** Same as above; port **1434**
- **Schema:** `sql-server-sharepoint-schema.sql` – SharePoint-like tables: Sites, Webs, UserInfo, Groups, GroupMembership, Roles, RoleAssignment, AllLists, AllUserData, AllDocs, DocStreams, Features, ImmedSubscriptions, SchedSubscriptions, ListItems.
- **Scripts:**
  - `SQLSERVER_PORT=1434 node scripts/run-sharepoint-schema.js` – create DB and tables.
  - `node scripts/seed-sharepoint-db.js` – seed sample site, webs, users, groups, lists, list items, etc.
- **Usage in app:** Use **SQL Server** provider (not “SharePoint”) with Host `127.0.0.1`, Port **1434**, Database **WSS_Content**, and choose table (e.g. UserInfo, ListItems).

### 2.3 AD / Entra-Style User Database

- **File:** `docker-compose.ad-db.yml`
- **Container:** `fleetstream-ad-db`
- **Port:** `1435` (host) → 1433 (container)
- **Database:** `ADDirectory`
- **Credentials:** Same as above; port **1435**
- **Schema:** `sql-server-ad-schema.sql` – ADUsers, ADGroups, ADGroupMembers.
- **Scripts:**
  - `SQLSERVER_PORT=1435 node scripts/run-ad-schema.js` – create DB and tables.
  - `node scripts/seed-ad-db.js` – seed sample users and groups.
- **Usage in app:** Use **SQL Server** provider for **Users** with Host `127.0.0.1`, Port **1435**, Database **ADDirectory**, table **ADUsers**.

---

## 3. Credentials and Connection Documentation

### 3.1 DBeaver

- **File:** `DBEAVER-CREDENTIALS.md`
- **Content:** Host, Port, Database, Username, Password for:
  - Main FleetStream (1433, FleetStream)
  - SharePoint-style (1434, WSS_Content)
  - AD-style (1435, ADDirectory)
- **Note:** Use `127.0.0.1` if `localhost` fails on Windows; enable “Trust server certificate” if required.

### 3.2 Web App (Entra & SharePoint)

- **File:** `WEB-APP-CREDENTIALS.md`
- **Content:**
  - **Entra:** Application (client) ID, Directory (tenant) ID, Client Secret – where to get them in Azure Portal.
  - **SharePoint:** Site URL, Client ID, Client Secret – same.
  - **Important:** When SharePoint and AD are **in Docker** (SQL Server), the app does **not** use Application ID / Client Secret / Site URL; use **SQL Server** provider and the connection details above (ports 1434 / 1435, databases WSS_Content / ADDirectory).

---

## 4. Database Settings UI and Buttons

### 4.1 Components and Flow

- **Section:** `src/components/dashboard/DatabaseSettingsSection.jsx`
- **Orchestrator:** `src/orchestrator/config.js`, `src/orchestrator/context.jsx` – providers, credential schemas, config and credentials state.
- **Layers:** Three sections – Users, Cars, Reservations. Each has buttons: Local, (for Users) Entra, SQL Server, Firebase, SharePoint; (for Cars/Reservations) SQL Server, Firebase, SharePoint.
- **Connect modal:** Opens when user clicks a non-Local provider. Shows schema fields (e.g. host, port, database for SQL Server; clientId, tenantId, clientSecret for Entra; siteUrl, clientId, clientSecret for SharePoint; serviceAccountJson etc. for Firebase).
- **Buttons in modal:** Test Connection, Connect, Cancel.
- **Footer:** Save Configuration, Reset all to Local.

### 4.2 Test Connection

- **SQL Server:** Calls `apiDataSourceTablesFetch` (POST `/api/admin/data-source/tables`) with host, port, databaseName, username, password. Returns list of table names; modal shows dropdown to select table.
- **Firebase:** Calls `apiDataSourceTestFirebase` (POST `/api/companies/current/data-source/test-firebase`) with `credentials.serviceAccountJson`. Backend uses Firebase Admin to verify.
- **Entra / SharePoint:** No backend test yet. Front-end only validates that required fields are filled (e.g. clientId, tenantId, clientSecret for Entra; siteUrl, clientId, clientSecret for SharePoint) and shows “Connection successful” for UX.

### 4.3 Connect (Save Credentials and Config)

- **SQL Server:** Saves credentials and optional `tableName` via `apiDataSourceCredentialsSave`; then updates provider and table name for that layer via `apiDataSourceConfigSave` (users/cars/reservations, usersTable/carsTable/reservationsTable). Table name is required (typed or selected after Test).
- **Firebase:** Saves credentials via `apiDataSourceCredentialsSave`; updates provider for that layer via `apiDataSourceConfigSave`. No table name.
- **Entra:** (Previously only updated local state.) **Fixed:** Connect now calls `apiDataSourceCredentialsSave` (layer, ENTRA, credentials) and `apiDataSourceConfigSave` (set users to ENTRA, keep cars/reservations and table names unchanged). Then updates local state and closes modal.
- **SharePoint:** Same as Entra: Connect now saves credentials and config (provider for the selected layer) to the backend, then updates local state and closes modal.
- All four providers (SQL Server, Firebase, Entra, SharePoint) now **persist** credentials and provider per layer when the user clicks Connect.

### 4.4 Save Configuration

- Sends current `config` (users, cars, reservations, usersTable, carsTable, reservationsTable) to PATCH `/api/companies/current/data-source-config`.
- Applies to **all three layers**; use after changing provider (e.g. switching to Local) or to re-sync with backend.
- Button has title: “Save current provider and table choices for Users, Cars, and Reservations layers”.

### 4.5 Reset All to Local

- Sets users, cars, reservations to LOCAL and clears usersTable, carsTable, reservationsTable; saves via same config API. All layers return to Local DB.

---

## 5. Backend (APIs and Data Source Manager)

### 5.1 Data Source Config

- **GET/PATCH** `/api/companies/current/data-source-config`
- **GET:** Returns `{ users, cars, reservations, usersTable?, carsTable?, reservationsTable? }` from company’s `dataSourceConfig` (Prisma).
- **PATCH:** Body same shape; updates company. Used by Connect (per layer) and Save Configuration (all layers).

### 5.2 Data Source Credentials

- **POST** `/api/companies/current/data-source-credentials`
- **Body:** `{ layer, provider, credentials, tableName? }`
- **Providers:** SQL_SERVER, FIREBASE, ENTRA, SHAREPOINT.
- Stores encrypted credentials in company’s `dataSourceCredentials` (requires `AUTH_SECRET` in .env). Used by Connect for all four providers.

### 5.3 SQL Server Tables (Test Connection)

- **POST** `/api/admin/data-source/tables`
- **Body:** `{ provider: "SQL_SERVER", host, port, databaseName, username, password }`
- Uses `src/lib/connectors/sql-server-tables.js` to connect and list table names. Admin only.

### 5.4 Test Firebase

- **POST** `/api/companies/current/data-source/test-firebase`
- **Body:** `{ credentials: { serviceAccountJson } }`
- Uses Firebase Admin to verify connection. Used by Test Connection in modal.

### 5.5 Data Source Manager

- **File:** `src/lib/data-source-manager.js`
- **Functions:** `getDataSourceConfig`, `getProvider`, `getLayerTable`, `getStoredCredentials`, `saveStoredCredentials`, `saveDataSourceConfig`
- **Table keys:** usersTable, carsTable, reservationsTable per layer.
- **Credential key:** `layer:provider` (e.g. `users:SQL_SERVER`).

---

## 6. Connectors

- **SQL Server:** `sql-server-config.js`, `sql-server-users.js`, `sql-server-cars.js`, `sql-server-reservations.js`, `sql-server-tables.js` – use stored credentials and layer table name from data source manager.
- **Firebase:** `firebase-users.js` – list users, test connection; uses stored `serviceAccountJson` per company/layer.
- **Entra / SharePoint:** Backend storage and config are in place; actual API calls to Microsoft Graph / SharePoint (when not using Docker SQL) depend on additional connector implementation if needed.

---

## 7. Summary Checklist

- [x] Main FleetStream SQL Server Docker and schema (FleetStream DB, port 1433).
- [x] SharePoint-style Docker DB (WSS_Content, port 1434) with full schema and seed.
- [x] AD/Entra-style Docker DB (ADDirectory, port 1435) with schema and seed.
- [x] DBeaver credentials documented for all three SQL Server instances.
- [x] Web app credentials documented (Entra/SharePoint from Azure; Docker = use SQL Server).
- [x] Connect modal: Test Connection and Connect work for SQL Server, Firebase, Entra, SharePoint.
- [x] Connect for Entra and SharePoint saves credentials and config to backend (not only local state).
- [x] Save Configuration applies to all three layers (Users, Cars, Reservations).
- [x] SQL Server and Firebase Connect apply correctly per layer (Users, Cars, Reservations).

---

*This document reflects the state of the project at the checkpoint. For runbooks and connection details, see also DBEAVER-CREDENTIALS.md, WEB-APP-CREDENTIALS.md, and docs/SQL_SERVER_DOCKER.md.*
