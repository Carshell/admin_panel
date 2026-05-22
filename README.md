# Admin Panel

A Docker-based admin dashboard for mapping **services** to **server** (row) and **tenant** (column) pairs. Includes JWT login, health checks on monitor URLs, and full CRUD for servers, tenants, and services.

## Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React, Vite, nginx |
| Backend  | Python, FastAPI   |
| Database | PostgreSQL 16     |

## Security (read before publishing or deploying)

This repo is safe to push to a **public** GitHub repository when you follow these rules:

| Do | Don't |
|----|--------|
| Copy `.env.example` → `.env` and use **your own** passwords | Commit `.env` or real credentials |
| Keep `volumes/` out of git (already in `.gitignore`) | Commit Postgres data directories |
| Generate a long random `AUTH_SECRET` | Reuse example passwords from `.env.example` |
| Change `ADMIN_LOGIN` / `ADMIN_PASSWORD` before first run | Expose ports `5432` / `8000` to the internet without a firewall |

**What is NOT stored in git:**

- Database files (`volumes/postgres/`)
- `.env` secrets
- Server passwords you enter in the UI (they live only in your database)

**Default compose bindings:** Postgres (`5432`) and API (`8000`) are bound to `127.0.0.1` only. The UI is on `http://localhost:3000`.

## Quick start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and replace every `CHANGE_ME_*` value. Example for `AUTH_SECRET`:

```bash
openssl rand -hex 32
```

Ensure `DATABASE_URL` uses the same user, password, and database name as `POSTGRES_*`.

### 2. Start the stack

```bash
docker compose up --build
```

### 3. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Admin UI (login required) |
| http://localhost:8000/docs | API docs (Swagger) |

Sign in with the `ADMIN_LOGIN` and `ADMIN_PASSWORD` from your `.env` file.

### 4. Stop

```bash
docker compose down
```

To reset the database completely:

```bash
docker compose down
# Windows PowerShell
Remove-Item -Recurse -Force .\volumes\postgres\* -ErrorAction SilentlyContinue
# Linux / macOS
# rm -rf ./volumes/postgres/*
```

## Project layout

```
├── beckened/          # FastAPI API
├── frontened/         # React frontend
├── db/init/           # SQL schema (runs on first DB init)
├── docker-compose.yml
├── .env.example       # Template only — copy to .env
└── volumes/           # Local Postgres data (gitignored)
```

## Features

- **Grid view:** servers × tenants, services in cells
- **Auth:** JWT-protected API; login page on frontend
- **Health dots:** green/red status from HTTP GET to each service `monitor_url` (every 3 minutes)
- **CRUD:** add, edit, delete servers, tenants, and services

## API overview

All routes except `POST /auth/login` and `GET /health` require header:

```
Authorization: Bearer <token>
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login |
| GET | `/servers`, `/tenants`, `/services` | List |
| POST | `/servers`, `/tenants`, `/services` | Create |
| PUT | `/servers/{id}`, `/tenants/{id}`, `/services/{id}` | Update |
| DELETE | `/servers/{id}`, `/tenants/{id}`, `/services/{id}` | Delete |
| GET | `/services/status` | Monitor URL health check |

## Production checklist

- [ ] Strong unique values in `.env`
- [ ] Do not publish `.env` or `volumes/` to git
- [ ] Put HTTPS reverse proxy in front of the frontend
- [ ] Restrict database and API ports (or remove host port mappings)
- [ ] Rotate `AUTH_SECRET` and admin password if ever leaked

## Local development (without Docker)

**Backend:**

```bash
cd beckened
pip install -r requirements.txt
# Set DATABASE_URL, AUTH_SECRET, ADMIN_* in environment or .env
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontened
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if not using the nginx proxy.

## License

Use and modify as needed for your project.
