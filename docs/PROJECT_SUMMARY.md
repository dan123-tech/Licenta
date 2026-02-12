# Company Car Sharing – Project Summary

This document summarizes everything necessary to build the **Company Car Sharing** application so you can review and give the go before implementation.

---

## 1. Tech stack & environment

| Layer        | Choice        | Notes |
|-------------|----------------|--------|
| Framework   | **Next.js** (App Router) | SSR/API routes, modular structure |
| Database    | **PostgreSQL** | Persistent data |
| ORM         | **Prisma**     | Schema, migrations, type-safe client |
| Auth        | **NextAuth.js** or **JWT in cookies** | Session-based; supports “invite + set password” |
| API docs    | **Swagger/OpenAPI** | Served at `/api-docs`, generated from route handlers or manual spec |
| Env/secrets | **`.env`**      | `DATABASE_URL`, `NEXTAUTH_SECRET`, etc. (never committed) |

- **Modularity**: Features split into domains (auth, companies, users, cars, reservations). Each domain has its own folder under `src/` (or `app/`), with clear boundaries.
- **Documentation**: Every non-trivial function will have a JSDoc block describing purpose, parameters, return value, and important side effects.

---

## 2. High-level architecture

- **Monolith in one Next.js app**: Frontend (React) + API routes (Next.js Route Handlers) + server logic. No separate backend repo.
- **PostgreSQL**: Single database; Prisma schema defines all tables.
- **API**: REST-style JSON APIs under `/api/...`, consumed by the same Next.js frontend (and documented in Swagger).

---

## 3. Database schema (Prisma) – summary

Concepts aligned with your requirements and the mock-ups:

| Entity        | Purpose |
|---------------|---------|
| **User**      | Email, hashed password, name, optional avatar URL. One user can belong to one company (for simplicity; multi-company can be added later). |
| **Company**   | Name, optional domain (e.g. `company.com`) for display/context. One admin per company (or a `CompanyMember` role). |
| **CompanyMember** | Links User ↔ Company with **role** (ADMIN, USER) and **status** (ENROLLED, PENDING_INVITE). “Invited” = PENDING_INVITE until they set password and accept. |
| **Invite**    | Token, email, companyId, expiresAt. When user registers or sets password with token, status becomes ENROLLED. |
| **Car**       | Company-owned: brand, model (optional), registrationNumber, km, status (AVAILABLE, RESERVED, IN_MAINTENANCE, etc.). `companyId` FK. |
| **Reservation** | User + Car + start/end datetime, optional purpose, status (ACTIVE, COMPLETED, CANCELLED). Enables “history” for admin and user. |

Additional tables as needed:

- **RefreshToken** or session table if we use custom JWT/session store.
- **PasswordResetToken** or reuse **Invite** for “set password” flow.

Indexes: on `User.email`, `Invite.token`, `Reservation.carId` + dates, `CompanyMember.companyId` + `userId`, etc.

---

## 4. Application modules (structure)

Proposed modular layout (conceptual; paths can be under `src/` or `app/`):

```
app/
  api/                    # API routes (see section 6)
    auth/
    companies/
    users/
    cars/
    reservations/
    api-docs/             # Swagger UI (and optionally OpenAPI JSON)
  (login)/page.tsx
  (register)/page.tsx
  (dashboard)/
    admin/page.tsx
    user/page.tsx
  layout.tsx
lib/
  db/                     # Prisma client, singleton
  auth/                   # Session validation, JWT/cookie helpers
  companies/              # Company + CompanyMember logic
  users/                  # User CRUD, invite acceptance
  cars/                   # Car CRUD, filtering by company
  reservations/           # Reserve, cancel, extend, history
components/
  ui/                     # Reusable UI (buttons, inputs, modals)
  layout/                 # Sidebar, header
  login/                  # Login form, register form
  admin/                  # Manage users, manage cars
  user/                   # Dashboard, reservations, available cars, history
prisma/
  schema.prisma
  migrations/
docs/
  API.md                  # Human-readable API doc (request/response examples)
  OPENAPI.yaml or .json   # Machine-readable spec for Swagger
```

- **Best practices**: Environment-based config, validated inputs (e.g. Zod), centralized error handling, and logging for critical operations.
- **Big functions**: Each will have a short JSDoc explaining what it does (purpose, main steps, return value).

---

## 5. Features (from CAR_PROJECT.txt + mock-ups)

| # | Requirement | Implementation idea |
|---|-------------|----------------------|
| 1 | Login page | Use existing mock-up `tmp_frontend/LogIn_Page.html` → implement as Next.js page with email + password, redirect by role (admin vs user). |
| 2 | Register | Public route: email + password. If user was invited (token in query or stored), link to company and set status ENROLLED. |
| 3–4 | Company + invite | Admin creates company (or we seed one). Admin “invites” by email → create Invite + CompanyMember (PENDING_INVITE). Invited user registers or sets password via token. |
| 5 | User sees company cars | User dashboard: list cars for their company where status = AVAILABLE (and optionally reserved by others with dates). |
| 6 | Admin: users table | Admin page: list CompanyMembers (Email, Name, Role, Status, Actions). Status = Enrolled vs Pending. Actions = Edit role, Remove, Resend invite. |
| 7 | Admin: add/remove cars | Manage Cars: CRUD cars for the company. Add car form (brand, registration number, km, status). Delete car. |
| 8 | User rents car | “Reserve” = create Reservation (start/end, optional purpose). Car status can go to RESERVED for the period (or we keep AVAILABLE and rely on reservation overlap checks). |
| 9 | Car attributes + history | Car has multiple attributes in Prisma (brand, model, registrationNumber, km, status, etc.). Reservation history: list Reservations per car (admin sees all, user sees own). |
| 10 | Admin promotes user to admin | In Manage Users, “Edit” allows changing role from USER to ADMIN (and back). Only company admins can do this. |

Additional from mock-ups:

- **User**: Dashboard stats (active reservations, total km, total reservations), My Reservations (cancel, extend), Available / Unavailable cars, Reservation modal (start/end date-time, purpose), Change password, History table.
- **Admin**: No “database source” config (AD/Firebase/SharePoint) in v1; single PostgreSQL. Optional: “Company settings” (name, domain) later.

---

## 6. API design (REST) – list of endpoints

All under `/api`, JSON in/out. Auth via cookie (session) or `Authorization: Bearer <token>`.

### Auth

- `POST /api/auth/login` – body: `{ email, password }` → session cookie + user + company + role.
- `POST /api/auth/register` – body: `{ email, password, name, inviteToken? }` → create user, accept invite if token present.
- `POST /api/auth/logout` – clear session.
- `GET /api/auth/session` – return current user (and company, role) for frontend.
- `POST /api/auth/set-password` – body: `{ token, newPassword }` (for invite flow without full register page).

### Companies (admin or own)

- `GET /api/companies/current` – current user’s company (for admin: full; for user: basic).
- `PATCH /api/companies/current` – (admin) update company name/domain.

### Users (company members)

- `GET /api/users` – list members of current user’s company (admin sees all; user might see only self or limited). Query: `?status=enrolled|pending`.
- `POST /api/users/invite` – (admin) body: `{ email, name, role }` → create invite + CompanyMember (PENDING).
- `PATCH /api/users/:id` – (admin) update role (e.g. promote to admin) or name.
- `DELETE /api/users/:id` – (admin) remove from company (and optionally deactivate user).
- `POST /api/users/resend-invite` – (admin) body: `{ email }` → new token, resend email (if you add email sending).

### Cars

- `GET /api/cars` – list cars for current user’s company. Query: `?status=available|reserved|in_maintenance`.
- `POST /api/cars` – (admin) body: `{ brand, model?, registrationNumber, km, status }` → create car.
- `GET /api/cars/:id` – one car (with reservation history for admin).
- `PATCH /api/cars/:id` – (admin) update car (including status).
- `DELETE /api/cars/:id` – (admin) remove car.

### Reservations

- `GET /api/reservations` – list reservations. Query: `?userId=&carId=&status=active|completed|cancelled` (admin can filter by user/car; user sees own).
- `POST /api/reservations` – body: `{ carId, startDate, endDate, purpose? }` (start/end as ISO or date+time) → create reservation; validate no overlap.
- `PATCH /api/reservations/:id` – cancel or extend (e.g. new endDate).
- `GET /api/reservations/history` – current user’s history (or per car for admin).

### API docs (Swagger)

- `GET /api/api-docs` – serve Swagger UI (HTML).
- `GET /api/openapi.json` (or `.yaml`) – OpenAPI 3.0 spec so Swagger UI can render it.

---

## 7. API documentation (what is expected + response examples)

A separate **API documentation** file will be created (e.g. `docs/API.md` and/or OpenAPI spec) that for each endpoint specifies:

- **Method and path**
- **Auth**: required (session/admin/company member).
- **Request**: body schema and example (e.g. `POST /api/auth/login` → `{ "email": "user@company.com", "password": "secret" }`).
- **Response**: success (200/201) body example and error (4xx/5xx) body example.

Example for one endpoint:

**POST /api/auth/login**

- **Request body**
  - `email` (string, required)
  - `password` (string, required)
- **Success (200)**  
  `{ "user": { "id": "...", "email": "...", "name": "...", "role": "USER", "companyId": "..." }, "company": { "id": "...", "name": "..." } }`
- **Error (401)**  
  `{ "error": "Invalid credentials" }`

The same information will be reflected in the **OpenAPI spec** so that Swagger UI shows parameters, request bodies, and response examples.

---

## 8. Swagger integration

- **OpenAPI 3.0** spec: either hand-written `docs/openapi.yaml` or generated from code (e.g. next-swagger-doc or similar).
- **Swagger UI**: served at `/api-docs` (or `/api/api-docs`) by a route that returns HTML pointing to `/api/openapi.json`.
- **Content**: All endpoints from section 6 listed with path, method, tags (Auth, Companies, Users, Cars, Reservations), request body schemas, and response examples (200, 401, 403, 404, 422).

---

## 9. Frontend (from mock-ups)

- **Login**: Based on `tmp_frontend/LogIn_Page.html` – email, password, “First-time login” (admin) vs normal login, link to register/set-password.
- **Register**: Email, password, name; optional invite token (query param or hidden field).
- **User dashboard**: Based on `tmp_frontend/User_page.html` – sidebar (Dashboard, My Reservations, Available Cars, Unavailable Cars, History), stats cards, tables, Reserve button, reservation modal (start/end date-time, purpose), cancel/extend, change password.
- **Admin dashboard**: Based on `tmp_frontend/Admin_Page.html` – sidebar (Manage Cars, Manage Users); Manage Cars: add car form, table with edit/delete and status dropdown; Manage Users: table (Email, Name, Role, Status, Actions), Add User modal (email, name, role), Edit (e.g. change role), optional “Database config” removed for v1 (single PostgreSQL).

API calls will be made from the Next.js frontend to the same app’s `/api/...` routes (fetch or a small `lib/api` client). No separate backend URL in production.

---

## 10. Security & configuration

- **.env**: `DATABASE_URL`, `NEXTAUTH_SECRET` (or `JWT_SECRET`), optional `EMAIL_*` for invite emails. Never commit `.env`; `.env.example` with placeholder keys only.
- **Passwords**: Bcrypt (or Argon2) with salt; never stored in plain text.
- **Invite tokens**: Random, short-lived, single-use where possible.
- **Authorization**: Every API route checks session and, where needed, company membership and role (admin vs user).

---

## 11. What will be delivered (after your go)

1. **Prisma schema** – full schema for User, Company, CompanyMember, Invite, Car, Reservation (+ any session/token tables).
2. **Migrations** – initial migration and instructions to run.
3. **Next.js app** – modular structure as above.
4. **API routes** – all endpoints listed in section 6, with validation and error handling.
5. **Swagger** – OpenAPI spec + Swagger UI at `/api-docs`.
6. **API documentation** – `docs/API.md` (and/or equivalent in OpenAPI) with request/response examples for each endpoint.
7. **Frontend pages** – login, register, user dashboard, admin dashboard, aligned with your mock-ups and calling the new API.
8. **JSDoc** – on every “big” function (purpose, params, return, notable side effects).
9. **.env.example** – and README with setup (install, `cp .env.example .env`, `npx prisma migrate dev`, `npm run dev`).

If you confirm this summary, next step is to implement in the order: schema + migrations → auth + companies + users → cars + reservations → API docs + Swagger → frontend pages. No scripts or application code will be written until you give the go.
