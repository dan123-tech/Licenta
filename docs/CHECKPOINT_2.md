# Company Car Sharing – Checkpoint 2 (Pre–Real-time/PWA/Chat)

**Date:** 2026-02-11  
**Purpose:** Snapshot of the project state **before** integrating real-time push, Socket.io, live chat, AI chatbot, PWA, offline cache, and Digital Key. Use this to restore context or to apply the “high-end mobile-parity” features from `cursor_2.md`.

---

## 1. What this project is

- **Company Car Sharing** – Next.js (App Router) + PostgreSQL app for company car sharing.
- **Stack:** JavaScript (.js/.jsx), Prisma, PostgreSQL, session cookies, Tailwind, Recharts, Swagger at `/api-docs`.
- **Auth:** Custom session (cookie), no NextAuth. Login/register; invite flow uses **set-password** with token.

---

## 2. Implemented features (state at this checkpoint)

### Auth & onboarding
- Login, register, session, set-password (unchanged from CHECKPOINT.md).

### Company
- No company → NoCompanyView (create or join by code).
- **Company settings (admin):** Default km per reservation, default consumption (L/100km), **global fuel pricing:** Benzine (currency/L), Diesel (currency/L), Electricity (currency/kWh); legacy “Price per Liter” fallback. Pending km-exceeded approvals (approve/reject with observations).

### Cars (enterprise fleet)
- **Car entity:** fuelType (Benzine | Diesel | Electric | Hybrid), averageConsumptionL100km, averageConsumptionKwh100km (EV/Hybrid), batteryLevel (0–100), batteryCapacityKwh, lastServiceMileage.
- **Add/Edit car:** Brand, registration, km, status, fuel type; for fuel cars – L/100km; for EV/Hybrid – battery %, battery capacity (kWh), kWh/100km; last service km.
- **Cars table:** Fuel type badge (color-coded), Consumption (L/100km or kWh/100km), **Service** column – “Oil change due” when (km − lastServiceMileage) > 10,000 (fuel/hybrid); “Battery check due” for electric.
- **Efficiency:** CarConsumptionCell for L/100km inline edit (fuel cars).

### Reservations
- Instant reserve (carId, optional purpose); release with new km and optional exceeded reason; cancel; admin pending-exceeded approvals.

### User dashboard
- Dashboard, Driving licence, My Reservations (Release, Cancel), Available / Unavailable Cars, History. No Digital Key button yet.

### Admin dashboard
- Company, **Statistics & Reports**, Manage Cars (with fuel type, service column), Manage Users, Invites, Car Sharing History, My Reservations.
- **Statistics & Reports (Recharts):**
  - Metric cards: active reservations, total km this month, estimated fuel/electricity cost, CO₂ this month (kg).
  - **Carbon footprint** bar chart (last 30 days) – 2.31 kg CO₂/L Benzine, 2.68 kg/L Diesel, optional grid factor for Electric.
  - **Fuel efficiency leaderboard** – cars ranked by consumption (most efficient first); L/100km or kWh/100km.
  - **Fleet by fuel type** pie chart; **Cost per fuel category** bar chart.
  - **Range remaining** (EV/Hybrid): (Battery % / 100) × (100 / Consumption) × Battery capacity (kWh).
  - **Service required** list – oil change >10,000 km or battery check.
  - Efficiency by cost table; car usage bar chart; fuel trend line chart (30 days); top users; PDF download.

### UI/UX
- Navy Blue/Slate corporate theme (#1E293B, #3B82F6, #F8FAFC). Sidebar, View-as toggle, full-width main. No notification prompt, no chat widgets, no toasts, no PWA install prompt.

---

## 3. Key files and structure (at this checkpoint)

| Area | Path |
|------|------|
| App router | `src/app/` (login, register, dashboard, api-docs) |
| API routes | `src/app/api/` (auth, companies, cars, users, invites, reservations, openapi). **No** `notifications/`, **no** `chat/`. |
| Lib | `src/lib/` (db, auth, api-helpers, companies, users, cars, reservations, api). **No** push.js, **no** socket.js. |
| Dashboard components | `src/components/dashboard/` (Sidebar, NoCompanyView, UserDashboard, AdminDashboard, StatisticsDashboard). **No** LiveChat, AIChat, DigitalKeyBluetooth, NotificationPermissionPrompt, ToastContext, DashboardProviders, PWAProvider. |
| Public | `public/` – no manifest.json, no sw.js, no offline.html. |
| Prisma | **No** PushSubscription, **No** ChatMessage. Car has fuelType, batteryLevel, lastServiceMileage, averageConsumptionKwh100km, batteryCapacityKwh. Company has priceBenzinePerLiter, priceDieselPerLiter, priceElectricityPerKwh. |
| Scripts | `npm run dev`, `npm run build`, `npm run start`. **No** server.js, **no** dev:realtime / start:realtime. |

---

## 4. API summary (at this checkpoint)

- Auth, companies (current + create + join), users (list, invite, PATCH/DELETE), invites, cars (CRUD + new fleet fields), reservations (GET, POST, history, PATCH, pending-approvals).
- **No** `/api/notifications/subscribe`, **no** `/api/notifications/vapid-public`, **no** `/api/chat`, **no** `/api/chat/ai`.
- Session and companies/current return company fuel prices and default consumption.

---

## 5. Database (Prisma at this checkpoint)

- **Car:** fuelType (enum), averageConsumptionL100km, averageConsumptionKwh100km, batteryLevel, batteryCapacityKwh, lastServiceMileage.
- **Company:** priceBenzinePerLiter, priceDieselPerLiter, priceElectricityPerKwh, defaultConsumptionL100km, averageFuelPricePerLiter, defaultKmUsage.
- **No** PushSubscription model, **no** ChatMessage model.

---

## 6. What comes next (cursor_2.md)

Apply the “high-end mobile-parity” features: Web Push + Service Worker, Socket.io for real-time updates, notification permission prompt, live chat (users ↔ admins), AI chatbot (FAQs + reservation-aware, LLM optional), PWA (manifest + Service Worker + offline cache), Digital Key (Web Bluetooth), and Navy/Slate styling for chat, toasts, and Bluetooth prompts. See **cursor_2.md** for the exact implementation request.

---

*After applying cursor_2.md, see `docs/REALTIME_PWA_CHAT.md` for how the new features work.*
