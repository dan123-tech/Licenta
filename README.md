# Company Car Sharing

Next.js + PostgreSQL app for company car sharing: login, invite users, manage cars, and reserve vehicles.

## Tech stack

- **Next.js** (App Router), **JavaScript** (.js / .jsx), **Tailwind CSS**
- **PostgreSQL** + **Prisma**
- Session auth (cookie), **Swagger** at `/api-docs`

## Setup commands (in order)

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

   **Option A – Docker (recommended for local dev)**

   ```bash
   docker compose up -d
   ```

   Then in `.env` set:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/company_car_sharing?schema=public"
   ```

   **Option B – Existing PostgreSQL**

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

If the folder already has files, create in a temp folder and move files to root – see [docs/SETUP_COMMANDS.md](docs/SETUP_COMMANDS.md).

## Docs

- [Project summary & architecture](docs/PROJECT_SUMMARY.md)
- [Setup commands (detailed)](docs/SETUP_COMMANDS.md)
- [API documentation (request/response examples)](docs/API.md)
- [Checkpoint (current state snapshot)](docs/CHECKPOINT.md)  
- **CURSOR.md** – short project context for AI (same context as checkpoint).

## Scripts

| Command              | Description          |
|----------------------|----------------------|
| `npm run dev`        | Dev server           |
| `npm run build`      | Production build     |
| `npm run start`      | Start production     |
| `npm run lint`       | ESLint               |
| `npx prisma migrate dev` | Create/apply migration |
| `npx prisma generate`    | Regenerate client    |
| `npx prisma studio`      | DB GUI               |
