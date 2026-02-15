# Android: Data Source Config & Repository Pattern

The backend supports a **Dynamic Table Mapper**: the admin chooses which database and table each layer (Users, Cars, Reservations) uses. The Android app should use the same config so it knows where data comes from and can show the correct source badge.

## 1. Get current config (which table/database per layer)

**Endpoint:** `GET /api/companies/current/data-source-config`

**Response:** (with session cookie)

```json
{
  "users": "LOCAL",
  "cars": "SQL_SERVER",
  "reservations": "LOCAL",
  "usersTable": null,
  "carsTable": "FleetCars",
  "reservationsTable": null
}
```

- `users`, `cars`, `reservations`: provider per layer (`LOCAL`, `SQL_SERVER`, `FIREBASE`, `ENTRA`, `SHAREPOINT`).
- `usersTable`, `carsTable`, `reservationsTable`: optional table name when provider is SQL Server (e.g. `"Employees"`, `"FleetCars"`).

## 2. Repository pattern: “Which table/database am I using?”

- **UserRepository** (or equivalent) should call `GET /api/companies/current/data-source-config` once per session (or when the app comes to foreground / after login).
- Store the result in memory or a small cache.
- For **data** calls, keep using the same APIs as today:
  - `GET /api/users` → backend already routes to Local, Firebase, or SQL Server (and table) from the saved config.
  - `GET /api/cars` → same.
  - `GET /api/reservations` → same.

So **Retrofit calls do not change**: you still call `GET /api/users`, `GET /api/cars`, etc. The backend decides which database and table to use. The Android app only needs the config for **display** (e.g. “Source: SQL Server (Table: Employees)”).

## 3. Optional: show source badge in the UI

Use the config to show a badge like the web app:

- **Users screen:**  
  `Source: {getProviderLabel(users) + (usersTable != null ? " (Table: " + usersTable + ")" : "")}`
- **Cars screen:** same with `cars` / `carsTable`.
- **Reservations screen:** same with `reservations` / `reservationsTable`.

Example labels: `Local DB`, `SQL Server (Table: Employees)`, `Firebase`, etc.

## 4. Summary

| What | How |
|------|-----|
| Know which DB/table is used | `GET /api/companies/current/data-source-config` |
| Fetch users/cars/reservations | Unchanged: `GET /api/users`, `GET /api/cars`, `GET /api/reservations` |
| Show source to user | Use config to build label, e.g. “Source: SQL Server (Table: Employees)” |

No change to existing Retrofit data endpoints; only add one optional config call and use it for the source badge.
