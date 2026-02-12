# cursor_1.md – Checkpoint for Cursor / AI context

**Purpose:** Restore context at the start of a new chat. Use this + `CURSOR.md` for full project + recent changes.

---

## Project in one line

**Company Car Sharing** – Next.js (App Router) + Prisma/PostgreSQL, session auth, instant reservations (no calendar), Tailwind. Swagger at `/api-docs`.

---

## What was done (this session / checkpoint)

1. **UI theme (professional corporate)**
   - Sidebar: deep navy/slate `#1E293B`.
   - Main background: light cool gray `#F8FAFC`.
   - Primary accent: Royal Blue `#3B82F6` (replaced purple/teal).
   - Inter font; 12px rounding (`rounded-xl`) and soft shadows globally.

2. **Sidebar & navigation**
   - **View as User/Admin** moved from top bar into sidebar (under profile), only when user is admin. Styled as segmented control (Slate/Navy + blue active).
   - **Logout:** Ghost/outline (slate border + text, soft red on hover), `LogOut` icon from `lucide-react`, pinned to bottom of sidebar.
   - Sidebar: `overflow-x-hidden`; nav uses `overflow-y-auto overflow-x-hidden` (no horizontal scrollbar).

3. **Layout**
   - Main content: `flex-1 w-full min-w-0`; no max-width so content uses full width.
   - Root wrappers: `w-full` on dashboard page and both dashboards.
   - Sections and table wrappers: `w-full min-w-0` so tables (e.g. Manage Cars) and cards stretch.
   - Sidebar: fixed 260px, `min-w-0` on nav items and logout so nothing forces width.

---

## Key paths (unchanged)

- **App:** `src/app/` (dashboard, login, register, api-docs).
- **Dashboard:** `src/components/dashboard/` – **Sidebar.jsx** (view toggle, logout, nav), **AdminDashboard.jsx**, **UserDashboard.jsx**, **NoCompanyView.jsx**.
- **Styles:** `src/app/globals.css` (theme variables), `src/app/layout.jsx` (Inter font).
- **Docs:** `docs/CHECKPOINT.md` (full checkpoint), `CURSOR.md` (short project summary).

---

## For Cursor / next session

- **Theme vars** live in `globals.css` (`--sidebar-bg`, `--primary`, `--main-bg`, etc.).
- **View-as state** is in dashboard page (`AdminDashboardOrUserToggle`), passed as `viewAs` / `setViewAs` to the active dashboard and then to **Sidebar**; Sidebar only shows the toggle when both props are set (admin context).
- **Layout:** Sidebar must keep `overflow-x-hidden` and nav `overflow-y-auto overflow-x-hidden` to avoid horizontal scroll; main uses `w-full min-w-0` for full-width content.

---

*Full feature list and API: see `docs/CHECKPOINT.md` and `CURSOR.md`.*
