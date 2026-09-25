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
- Placeholder pages for Traffic Policies, Health Checks, Resolver and Profiles
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

Frontend: http://localhost:3000

If the backend is deployed elsewhere, create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.example.com/api/v1
```

SQLite data is stored locally at `backend/data/route53.db` by default. Set `DATABASE_PATH` to use a different persistent local path; normal startup never resets the database.

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
- `GET /api/v1/health`

Hosted-zone lists support server-side `search`, `page`, and `page_size` query parameters. API paths use the stable Route 53-style hosted-zone ID; integer relationship IDs remain only in response data for the existing nested-record workflow.

## Important deployment note
SQLite is file-based. If your hosting provider uses ephemeral disks, database changes can be lost after a redeploy/restart. For a production-like hosted demo, attach persistent storage or move the database to a managed database while keeping the same API design.

## Authentication

The assessment uses the seeded demo account, but authentication is enforced by the backend. Passwords are stored as salted `scrypt` hashes. Successful login creates an opaque random token in the SQLite `sessions` table and sends it only in an HTTP-only, `SameSite=Lax` cookie. The frontend restores a browser session through `GET /api/v1/auth/me`; it never treats localStorage as proof of authentication.

Sessions expire after eight hours by default. Set `SESSION_TTL_HOURS` for local testing and `SESSION_COOKIE_SECURE=true` when serving over HTTPS. Hosted zones and their records are scoped to the authenticated owner, so guessing another resource ID returns `404` rather than exposing it.

Existing SQLite files are upgraded through recorded, additive migrations in `schema_migrations`. Startup does not reset application data. The Phase 2 migration hashes legacy demo passwords, replaces the old plaintext value with a non-secret marker, adds server-side sessions, and assigns existing hosted zones to the original user.

## Assignment mapping
The implementation covers the required authentication, Hosted Zone CRUD, DNS Record CRUD, SQLite persistence, Route 53-style navigation/UI, search, forms, modals and mocked sections. Optional bonus items such as BIND import/export and keyboard shortcuts are not included in this baseline.

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
