# CURSOR.md – Project context for AI

Read this at the start of a new conversation to know what this project is and what was done.

---

## Project

**Company Car Sharing** – Next.js (App Router) + PostgreSQL app. JavaScript (.js/.jsx), Prisma, session cookies, Tailwind. Swagger at `/api-docs`.

---

## What was done (summary)

1. **Auth** – Login, register (no invite), session cookie. Set-password for invite flow. Session can have no company (`companyId`/`role` null).
2. **Companies** – Create company (generates `joinCode`) or join by code. NoCompanyView on dashboard when user has no company.
3. **Cars** – Admin: CRUD cars, status (AVAILABLE, RESERVED, IN_MAINTENANCE). User: list available/unavailable.
4. **Reservations – instant (no calendar)**  
   - Reserve = one click (or admin modal with car + optional purpose). No start/end date picker.  
   - **POST /api/reservations** with only `carId` (and optional `purpose`) → instant reserve (server uses now → now+1yr).  
   - On create → car status set to **RESERVED** (no one else can reserve).  
   - **Release** → modal for **km used** → reservation COMPLETED, car AVAILABLE, car km += kmUsed. **Cancel** → reservation CANCELLED, car AVAILABLE.  
   - PATCH body: `{ action: "cancel" }` | `{ action: "release", kmUsed: number }` | `{ action: "extend", endDate }`.
5. **Admin** – Manage Cars, Manage Users (invite, Set Admin/User, Remove), **Invites** list (who invited, Joined/Pending/Expired), **Car Sharing History** (company reservations), **My Reservations** (reserve/release/cancel).
6. **User** – Dashboard, My Reservations (Release/Cancel), Available Cars (one-click Reserve), Unavailable Cars, History.
7. **UI** – Dark text in inputs and tables (`#2c3e50`), readable placeholders. Home: dark gradient + links. Login/Register/Dashboard styled to match.

---

## Key paths

- **App:** `src/app/` (page.jsx, login, register, dashboard, api-docs).
- **API:** `src/app/api/` (auth, companies, cars, users, **invites**, reservations, openapi).
- **Lib:** `src/lib/` (db.js, auth/, api-helpers.js, companies.js, users.js, cars.js, reservations.js, **api.js**).
- **Components:** `src/components/dashboard/` (Sidebar, NoCompanyView, UserDashboard, AdminDashboard).
- **Prisma:** `prisma/schema.prisma` (User, Company with joinCode, CompanyMember, Invite, Car, Reservation).

---

## Docs

- **Checkpoint (full state):** `docs/CHECKPOINT.md`
- **Cursor / AI checkpoint (theme + layout):** `cursor_1.md`
- **API (request/response):** `docs/API.md`
- **Setup:** `README.md`, `docs/SETUP_COMMANDS.md`

---

## If you change reservations

- Instant reserve: `createInstantReservation` in `src/lib/reservations.js`; POST route in `src/app/api/reservations/route.js` (optional startDate/endDate → instant).
- Car status: set RESERVED on create (in route, via `updateCar`); set AVAILABLE on cancel/release in `src/app/api/reservations/[id]/route.js`.
- Frontend: UserDashboard `reserveInstant(c.id)`, no modal. AdminDashboard reserve modal: car + purpose only.

Use **docs/CHECKPOINT.md** for a full checkpoint; this file is the short version for the same context window.
