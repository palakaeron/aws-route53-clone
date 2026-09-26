# AWS Route 53 Clone

A functional Route 53-style web console built for the assignment. It recreates the requested user experience and core workflows without implementing real DNS operations.

This project intentionally runs without Docker. The frontend, FastAPI backend, and persistent SQLite database run directly on the local machine, which keeps development straightforward on Windows.

## Stack
- Frontend: Next.js + TypeScript
- Backend: FastAPI
- Database: SQLite

## Features
- Password-hashed demo authentication with opaque server-side SQLite sessions
- HTTP-only session cookies that survive page refresh without storing user data in localStorage
- Hosted Zone CRUD
- Hosted Zone search
- DNS Record CRUD
- DNS record search
- Record types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
- AWS/Route 53-inspired navigation, tables, forms, modal dialogs and badges
- Persistent simulated CRUD for Traffic Policies, Health Checks, Resolver Endpoints and Profiles
- Search and filter controls for simulated Route 53 sections
- Persistent SQLite storage

## Demo credentials
- Email: `demo@aws.local`
- Password: `demo123`

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000
Swagger: http://localhost:8000/docs

### Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000 (or http://localhost:3001 when using the alternate local port)

If the backend is deployed elsewhere, create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api/v1
```

SQLite data is stored locally at `backend/data/route53.db` by default. Set `DATABASE_PATH` to use a different persistent local path; normal startup never resets the database.

## Production Deployment

The recommended deployment is a Vercel frontend and a Render backend web service with a paid persistent disk. Vercel serves the Next.js application; Render runs FastAPI and mounts a persistent disk at `/var/lib/route53`. The SQLite file must be stored on that mounted disk, not in the service's ephemeral filesystem.

Backend production start command:
```bash
bash start-prod.sh
```

The script binds Uvicorn to `0.0.0.0` and uses the platform `PORT` variable, defaulting to `8000` for local testing. Configure the backend service with:
```env
DATABASE_URL=sqlite:////var/lib/route53/route53.db
FRONTEND_ORIGINS=https://your-frontend.example.com
SESSION_COOKIE_SECURE=true
SESSION_TTL_HOURS=8
```

Configure the frontend build with:
```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api/v1
```

The backend runs additive migrations and idempotent seed checks during startup. It does not call `drop_all()`, delete the SQLite file, or recreate existing application tables. Existing users, sessions, hosted zones, records, and simulated resources remain in place. A restart or redeploy preserves data as long as the persistent disk remains attached.

Health and API checks:
- `GET https://your-backend.example.com/api/v1/health` must return `200` and `{"data":{"status":"ok"}}`.
- `GET https://your-backend.example.com/docs` exposes FastAPI Swagger documentation.
- `GET /api/v1/auth/me` returns `401` until the browser has logged in.

Back up the SQLite database from the mounted volume with SQLite's online backup command:
```bash
sqlite3 /var/lib/route53/route53.db ".backup '/var/lib/route53/backups/route53-$(date +%Y%m%d-%H%M%S).db'"
```

Never set credentialed CORS to `*`, never commit `.env` files or real secrets, and do not deploy SQLite on a platform without persistent storage. The repository contains `.env.example` templates for both services; replace all example URLs with the actual deployed URLs.

## Architecture
```text
Next.js browser UI
      |
      | REST/JSON (/api/v1)
      v
FastAPI
      |
      v
SQLAlchemy
      |
      v
SQLite (backend/data/route53.db)
```

## Database schema
- `users`: mocked login users
- `sessions`: opaque, expiring browser sessions linked to users
- `hosted_zones`: user-owned domain zones with an immutable Route 53-style `zone_id`
- `dns_records`: DNS records linked to hosted zones with cascade delete and JSON-backed value data

Hosted-zone database IDs remain internal integers for relationships, while `zone_id` is a stable Route 53-style identifier such as `Z0000000000001`. It is created once and never changed during normal hosted-zone edits.

DNS record values are stored as JSON text because each DNS type has a different valid shape. The API returns both a readable `value` string for the current console table and canonical `data` JSON. Examples include `{"addresses":["192.0.2.10"]}` for A, `{"priority":10,"exchange":"mail.example.com"}` for MX, and `{"flags":0,"tag":"issue","value":"letsencrypt.org"}` for CAA. The backend validates the JSON according to its record type before persistence.

## API overview
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/hosted-zones`
- `POST /api/v1/hosted-zones`
- `GET /api/v1/hosted-zones/{id}`
- `PUT /api/v1/hosted-zones/{id}`
- `DELETE /api/v1/hosted-zones/{id}`
- `GET /api/v1/hosted-zones/{id}/records`
- `POST /api/v1/hosted-zones/{id}/records`
- `PUT /api/v1/hosted-zones/{id}/records/{record_id}`
- `DELETE /api/v1/hosted-zones/{id}/records/{record_id}`
- `GET|POST /api/v1/traffic-policies`
- `GET|PUT|DELETE /api/v1/traffic-policies/{id}`
- `GET|POST /api/v1/health-checks`
- `GET|PUT|DELETE /api/v1/health-checks/{id}`
- `GET|POST /api/v1/resolver-endpoints`
- `GET|PUT|DELETE /api/v1/resolver-endpoints/{id}`
- `GET|POST /api/v1/profiles`
- `GET|PUT|DELETE /api/v1/profiles/{id}`
- `GET /api/v1/health`

Hosted-zone lists support server-side `search`, `page`, and `page_size` query parameters. API paths use the stable Route 53-style hosted-zone ID; integer relationship IDs remain only in response data for the existing nested-record workflow.

## Authentication

The assessment uses the seeded demo account, but authentication is enforced by the backend. Passwords are stored as salted `scrypt` hashes. Successful login creates an opaque random token in the SQLite `sessions` table and sends it only in an HTTP-only, `SameSite=Lax` cookie. The frontend restores a browser session through `GET /api/v1/auth/me`; it never treats localStorage as proof of authentication.

Sessions expire after eight hours by default. Set `SESSION_TTL_HOURS` for local testing and `SESSION_COOKIE_SECURE=true` when serving over HTTPS. Hosted zones and their records are scoped to the authenticated owner, so guessing another resource ID returns `404` rather than exposing it.

Existing SQLite files are upgraded through recorded, additive migrations in `schema_migrations`. Startup does not reset application data. The Phase 2 migration hashes legacy demo passwords, replaces the old plaintext value with a non-secret marker, adds server-side sessions, and assigns existing hosted zones to the original user.

## Assignment mapping
The implementation covers the required authentication, Hosted Zone CRUD, DNS Record CRUD, SQLite persistence, Route 53-style navigation/UI, search, filters, forms, modals and functional simulated sections. Optional bonus items such as BIND import/export and keyboard shortcuts are not included in this baseline.

## Hosted demo

This repository does not include a deployed public URL. For evaluation, run the backend and frontend locally using the instructions above, or deploy both services with persistent storage and set `NEXT_PUBLIC_API_URL` to the public backend API URL. Because the application uses SQLite, the hosted environment must provide a persistent writable volume for `backend/data/route53.db`.

## Code quality

The project is intentionally organized into small, single-purpose modules:
- FastAPI routers separate authentication, Hosted Zones, and DNS Records.
- Pydantic schemas define API contracts and validation.
- SQLAlchemy models contain only persistence concerns.
- Next.js pages own page-level state and orchestration.
- Reusable table and form components keep UI logic out of route files.
- Shared TypeScript domain types remove unnecessary `any` usage.
- Comments/docstrings explain non-obvious design decisions and module responsibilities.

The implementation favors readable functions, typed payloads, consistent error handling, and clear separation between presentation, API communication, and persistence. Docker is intentionally not part of the setup or deployment workflow.
