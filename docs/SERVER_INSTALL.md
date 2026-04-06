# Installing FleetShare on a server

The running app exposes a page **`/download`** with buttons to download the install scripts and a text file of Docker commands (files live in `public/downloads/`).

## `sudo`-style install (recommended)

This project is a **Next.js app + PostgreSQL**. The practical way to ship “one installer” is **Docker Compose**: one command pulls/builds images and starts the database and app together.

### Linux / macOS

```bash
cd /path/to/licenta_dani-main
chmod +x install.sh
sudo ./install.sh
```

Or without the wrapper:

```bash
bash scripts/install-server.sh
```

`sudo` is only required if your Docker setup needs root; many installs use the `docker` group instead (then run **without** `sudo`).

### Windows

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. In PowerShell, from the repo folder:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\install.ps1
```

3. Edit `.env` (created from `.env.example`): `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, SMTP or Resend.

---

## Why not a single `.exe`?

A real **FleetShare** deployment includes:

- Node.js runtime  
- Built Next.js server  
- **PostgreSQL** (separate service)  
- Prisma migrations  
- Optional: Caddy/nginx, SQL Server sidecars for data-source features  

Bundling all of that into **one Windows `.exe`** like a desktop game is **not realistic** without a huge custom platform (e.g. embedding Postgres). What companies usually do:

| Approach | What you get |
|----------|----------------|
| **Docker + `install.sh` / `install.ps1`** | Closest to “run one script as admin”; same stack everywhere. |
| **Installer built with Inno Setup / WiX** | A **setup.exe** that runs Docker Desktop checks, copies files, writes `.env`, runs `docker compose up`. (You’d maintain that project separately.) |
| **MSI + Windows services** | Install Node LTS + PostgreSQL + your app + NSSM/PM2 — possible but more fragile than Docker. |

If you need a **branded Windows installer**, the usual path is: wrap **Docker Compose** (or document “install Docker, then run `install.ps1`”).

---

## After install

- Firewall: allow **3000** (and **8443** if you use HTTPS in compose).
- Set **`NEXT_PUBLIC_APP_URL`** and **`NEXTAUTH_URL`** to `http://YOUR_SERVER_IP:3000` or your HTTPS URL (rebuild app image if you bake the public URL at build time).
- Email: configure **SMTP** or **Resend** in `.env` (see `.env.example`). `docker-compose.yml` passes these variables into the `app` container.

## Make / run the app with Docker (quick reference)

From the project folder (`.env` must exist — at least **`AUTH_SECRET`**):

```bash
docker compose build --no-cache app
docker compose up -d
```

Or use **`./install.sh`** (Linux/macOS) or **`install.ps1`** (Windows) — build + start **db**, **app**, and **caddy**.

**Installer flags**

| Bash (`./install.sh`) | PowerShell (`.\install.ps1`) | Effect |
|----------------------|-----------------------------|--------|
| `--help` | `-Help` | Usage |
| `--down` | `-Down` | `docker compose down` (keeps volumes) |
| `--no-build` | `-NoBuild` | Skip image build; only `up -d` |
| `--pull` | `-Pull` | Pull base images before build |

The scripts check that **Docker is running**, create `.env` from `.env.example` if missing, and **warn** if `AUTH_SECRET` is shorter than 32 characters.

- **App:** http://localhost:3000 (or `http://SERVER_IP:3000` from another machine).
- **HTTPS (Caddy):** https://localhost:8443 if certs exist under `deploy/certs/`.

**Public URL** (invite links, anything baked into the client): set `NEXT_PUBLIC_APP_URL` in `.env`, then rebuild the app image:

```bash
docker compose build --no-cache app && docker compose up -d app
```

**Stop:** `docker compose down` — add **`-v`** only if you want to delete the Postgres volume (wipes data).
