# Company Car Sharing

Next.js + PostgreSQL app for company car sharing: login, invite users, manage cars, and reserve vehicles.

**Repositories:** This repo is the **full edition** (Database Settings, Microsoft Entra / SQL Server / Firebase / SharePoint orchestration, Docker-oriented workflows). A **PostgreSQL-only web edition** for Vercel lives in a **separate repo** you maintain from the sibling folder `../licenta_dani-web` (init a new Git remote there; do not mix the two histories unless you use subtrees/submodules on purpose).

## Tech stack

- **Next.js** (App Router), **JavaScript** (.js / .jsx), **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- Session auth (cookie), **Swagger** at `/api-docs`

## Setup commands (in order)

### Quick start (Windows) — run the installer script

If you want the **Company server** running quickly via Docker Compose:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\install.ps1
```

Stop containers (keeps DB data):

```powershell
.\install.ps1 -Down
```

1. **Install dependencies** (already done if you cloned after scaffold)

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `DATABASE_URL` (PostgreSQL) and `AUTH_SECRET` (e.g. `openssl rand -base64 32`).

3. **Database**

   **Option A  Docker (recommended for local dev)**

   ```bash
   docker compose up -d
   ```

   Then in `.env` set:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/company_car_sharing?schema=public"
   ```

   **Option B  Existing PostgreSQL**

   Create the DB (e.g. `createdb company_car_sharing` or via your DB tool), then set `DATABASE_URL` in `.env`.

   **Run migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   - App: [http://localhost:3000](http://localhost:3000)  
   - API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Creating the Next.js project from CLI (reference)

If you need to create the Next.js app from scratch in an **empty** folder:

```bash
npx create-next-app@latest . --yes --use-npm
```

If the folder already has files, create in a temp folder and move files to root  see [docs/SETUP_COMMANDS.md](docs/SETUP_COMMANDS.md).

## Docs

- [Project summary & architecture](docs/PROJECT_SUMMARY.md)
- [Setup commands (detailed)](docs/SETUP_COMMANDS.md)
- [API documentation (request/response examples)](docs/API.md)
- [Checkpoint (current state snapshot)](docs/CHECKPOINT.md)  
- **CURSOR.md**  short project context for AI (same context as checkpoint).

## How to run the project (first time or new clone)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: set `DATABASE_URL` (PostgreSQL) and `AUTH_SECRET`.

3. **Database** (PostgreSQL for the main app)
   - Start DB: `docker compose up -d` (or use your own PostgreSQL).
   - In `.env`: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/company_car_sharing?schema=public"` (if using Docker).
   - Apply schema: `npx prisma migrate dev --name init` (or `npx prisma db push` if you prefer).

4. **Run the app**
   ```bash
   npm run dev
   ```
   - App: [http://localhost:3000](http://localhost:3000)  
   - API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## How to update the project (after pulling changes)

1. **Install any new dependencies**
   ```bash
   npm install
   ```

2. **Regenerate Prisma client** (if `prisma/schema.prisma` or Prisma version changed)
   ```bash
   npx prisma generate
   ```

3. **Run new migrations** (if there are new migration files)
   ```bash
   npx prisma migrate dev
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

   - App: [http://localhost:3000](http://localhost:3000)  
   - API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Optional: if you use **SQL Server** (Database Settings), start it with `docker compose -f docker-compose.sqlserver.yml up -d` and run `npm run seed-sqlserver` once. See [docs/SQL_SERVER_DOCKER.md](docs/SQL_SERVER_DOCKER.md).

## Scripts

| Command              | Description          |
|----------------------|----------------------|
| `npm run dev`        | Dev server           |
| `npm run build`      | Production build     |
| `npm run start`      | Start production     |
| `npm run lint`       | ESLint               |
| `npm run seed`       | Seed users/cars (PostgreSQL) |
| `npm run seed-sqlserver` | Seed SQL Server (Docker) - run after starting `docker-compose.sqlserver.yml` |
| `npx prisma migrate dev` | Create/apply migration |
| `npx prisma generate`    | Regenerate client    |
| `npx prisma studio`      | DB GUI               |
