# Company Car Sharing – Checkpoint

**Date:** 2026-02-11  
**Purpose:** Snapshot of the project state for this context window. Use this to restore context or onboard.  
**Last updated:** Post UI theme, sidebar/nav restyle, and layout fixes.

---

## 1. What this project is

- **Company Car Sharing** – Next.js (App Router) + PostgreSQL app for company car sharing.
- **Stack:** JavaScript (.js/.jsx), Prisma, PostgreSQL, session cookies, Tailwind, Swagger at `/api-docs`.
- **Auth:** Custom session (cookie), no NextAuth. Login/register; invite flow uses **set-password** with token.

---

## 2. Implemented features (current state)

### Auth & onboarding
- **Login** (`/login`) – email + password → redirect to `/dashboard`.
- **Register** (`/register`) – email, name, password (min 8) → redirect to login. No invite required for signup.
- **Session** – `GET /api/auth/session` returns `{ user, company }`; `companyId`/`role` can be null (user not in a company).
- **Set password** – `POST /api/auth/set-password` with `{ token, newPassword }` for invite flow.

### Company
- **No company:** Dashboard shows **NoCompanyView** – create company (name, optional domain) or **join by code**.
- **Company:** `Company.joinCode` (unique, generated on create). `POST /api/companies/join` with `{ joinCode }` enrolls user as USER.
- **Current company:** `GET /api/companies/current`, `PATCH` (admin) for name/domain.

### Reservations (instant – no calendar)
- **Instant reserve:** User/admin clicks **Reserve** → reservation is created **immediately** (no date/time picker).
  - **POST /api/reservations** with only `{ carId, purpose? }` (no `startDate`/`endDate`) → server uses *now* and *now + 1 year* as range (“until released”).
- **Car status:** On **create** reservation → car status set to **RESERVED**. Car disappears from “Available cars” and cannot be reserved by others.
- **Release:** User/admin clicks **Release** → modal asks **Km used** → reservation COMPLETED, car status → **AVAILABLE**, car’s **km** updated (current km + km used).
- **Cancel:** Same as before → reservation CANCELLED, car → AVAILABLE (if it was ACTIVE).
- **PATCH /api/reservations/:id** body: `{ "action": "cancel" }` | `{ "action": "release", "kmUsed": number }` | `{ "action": "extend", "endDate": "..." }`.

### User dashboard
- **Sections:** Dashboard (stats, recent activity), My Reservations, Available Cars, Unavailable Cars, History.
- **Available Cars:** One-click **Reserve** (no modal). **My Reservations:** **Release** + **Cancel** for ACTIVE.
- Tables use dark text `#2c3e50` for readability.

### Admin dashboard
- **Manage Cars** – Add car form, table with status dropdown, Delete. Join-code banner.
- **Manage Users** – Table (Email, Name, Role, Status). **Set Admin** / **Set User**, **Remove**. **Add User** modal → invite by email (creates invite + PENDING_INVITE member).
- **Invites** – Table: who was invited (Email, Invited at, Status: Pending / Joined / Expired, Expires). **GET /api/invites** (admin).
- **Car Sharing History** – Company-wide reservations (Car, User, Reserved at, Status).
- **My Reservations** – Admin can **Reserve a car** (modal: car dropdown + optional purpose, no dates), **Release** / **Cancel** for their active reservations.

### UI/UX (professional corporate theme)
- **Theme:** Sidebar `#1E293B` (navy/slate), main background `#F8FAFC`, primary accent Royal Blue `#3B82F6`. Inter font via Next.js. Rounded corners 12px (`rounded-xl`) globally.
- **Sidebar:** Fixed width 260px, `overflow-x-hidden`. **View as User/Admin** toggle (segmented control) under profile, only for admins. **Logout** – ghost/outline (slate border/text, soft red on hover), LogOut icon (lucide-react), pinned to bottom.
- **Main content:** Full width (`flex-1 w-full min-w-0`), no max-width on main. Sections and tables use `w-full` so Manage Cars and cards stretch. No horizontal scroll on sidebar; main can use `overflow-x-hidden` where needed.
- **Login/Register/NoCompanyView:** Same blue/slate theme, rounded-xl inputs and buttons.
- **Dependency:** `lucide-react` for sidebar LogOut icon.

---

## 3. Key files and structure

| Area | Path |
|------|------|
| App router | `src/app/` (login, register, dashboard, page.jsx, api-docs) |
| API routes | `src/app/api/` (auth, companies, cars, users, invites, reservations, openapi) |
| Lib (domain + API client) | `src/lib/` (db.js, auth/, api-helpers.js, companies.js, users.js, cars.js, reservations.js, api.js) |
| Dashboard components | `src/components/dashboard/` (Sidebar, NoCompanyView, UserDashboard, AdminDashboard) |
| Prisma | `prisma/schema.prisma`, `prisma/migrations/` |
| Docs | `docs/API.md`, `docs/PROJECT_SUMMARY.md`, `docs/SETUP_COMMANDS.md`, `docs/CHECKPOINT.md` |

---

## 4. API summary (current)

- **Auth:** login, logout, register, session, set-password.
- **Companies:** GET/PATCH current, POST create, POST join.
- **Users:** GET list, POST invite, PATCH/DELETE by id (role, remove).
- **Invites:** GET list (admin only).
- **Cars:** GET, POST, GET/PATCH/DELETE by id.
- **Reservations:** GET (user: own; admin: company), POST (body: `carId`, optional `purpose` for instant; optional `startDate`/`endDate` for dated), GET history, PATCH by id (cancel | release | extend).
- **OpenAPI:** GET `/api/openapi`, UI at `/api-docs`.

---

## 5. Database (Prisma)

- **User** – id, email (unique), password, name, avatarUrl.
- **Company** – id, name, domain, **joinCode** (unique, nullable).
- **CompanyMember** – userId, companyId, role (ADMIN|USER), status (ENROLLED|PENDING_INVITE).
- **Invite** – token, email, companyId, expiresAt, usedAt.
- **Car** – companyId, brand, model, registrationNumber, km, status (AVAILABLE|RESERVED|IN_MAINTENANCE).
- **Reservation** – userId, carId, startDate, endDate, purpose, status (ACTIVE|COMPLETED|CANCELLED).

---

## 6. Frontend API client (`src/lib/api.js`)

- All requests use `credentials: 'include'`.
- Notable: `apiCreateReservation(carId, purpose)` (instant), `apiReleaseReservation(id)`, `apiInvites()`, `apiCancelReservation(id)`, plus session, companies, cars, users, reservations list/history.

---

## 7. Run / build

- `docker compose up -d` → DB.
- `npx prisma migrate deploy` (or `migrate dev`).
- `npm run dev` → http://localhost:3000.
- `npm run build` → succeeds with current code.

---

*Use **CURSOR.md** at project root for a short AI-oriented summary of the same.*
