# SQL Server (Docker) for Database Settings

Use this when you want to connect **SQL Server** as an external database in **Database Settings** (Users, Cars, or Reservations layer).

## 1. Start SQL Server

```bash
docker compose -f docker-compose.sqlserver.yml up -d
```

Wait ~30 seconds for SQL Server to be ready.

## 2. Populate the database (create DB + table + login user)

```bash
npm run seed-sqlserver
```

This creates:

- **Database:** `FleetStream`
- **Table:** `Users` (compatible with the app’s user shape)
- **Login user:** `admin@example.com` / `Password123!` (bcrypt-hashed)
- **Optional SQL login:** `fleetstream_app` / `AppPass!123` (for app connection instead of `sa`)

## 3. Connection info for Database Settings

In the app, go to **Database Settings** → choose **SQL Server** for a layer → **Connect** and use:

| Field          | Value              |
|----------------|--------------------|
| **Host**       | `localhost`        |
| **Port**       | `1433`             |
| **Database**   | `FleetStream`      |
| **Username**   | `sa` or `fleetstream_app` |
| **Password**   | `YourStrong!Pass123` or `AppPass!123` |

When the **Users** layer is connected to this SQL Server, the seeded user **admin@example.com** / **Password123!** can be used to log in (once the app’s SQL Server connector for the Users layer is implemented).

## 4. Stop SQL Server

```bash
docker compose -f docker-compose.sqlserver.yml down
```

Data is kept in the `sqlserver_data` volume. Use `down -v` to remove the volume.

## Environment (optional)

Override defaults when running the seed script:

- `SQLSERVER_HOST` (default: localhost)
- `SQLSERVER_PORT` (default: 1433)
- `SQLSERVER_USER` (default: sa)
- `SQLSERVER_PASSWORD` (default: YourStrong!Pass123)
- `SQLSERVER_TARGET_DB` (default: FleetStream)
