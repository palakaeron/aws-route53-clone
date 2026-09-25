# AWS Route 53 Web Console Clone

A full-stack, enterprise-grade clone of the **AWS Route 53 Web Console** experience built with **Next.js**, **TypeScript**, **FastAPI**, and persistent **SQLite**.

> **Note**: This application is a web-console clone designed for DNS domain & record management workflows. It does **NOT** function as a live DNS nameserver and does **NOT** connect to real AWS infrastructure or require AWS credentials.

---

## Key Features

* **AWS Route 53 Console Experience**:
  * Dark AWS header navigation bar, orange primary action buttons, compact enterprise tables, and restrained shadows.
  * Real-time dashboard showing hosted zone metrics, total active records, and service status.
  * Polished placeholder pages for Traffic Policies, Health Checks, Resolver, and Profiles with AWS documentation links.
* **Authentication & Session Persistence**:
  * Server-side SQLite session storage with `scrypt` password hashing.
  * Secure HTTP-only, `SameSite=Lax` cookie authentication (no `localStorage` tokens).
  * Session restoration on page refresh (`/api/v1/auth/me`) and automatic redirection on 401 session expiration.
  * Owner-scoped isolation for all hosted zones and records.
* **Hosted Zones Management**:
  * Complete CRUD for Public and Private hosted zones.
  * Stable, public Route 53-shaped Zone IDs (e.g. `Z0000000000001`).
  * Immutable zone names after creation with PATCH/PUT updating.
  * Accessible modal delete confirmation (`ConfirmModal`) warning users of record cascade deletion.
* **DNS Records Management**:
  * Complete support for all **9 required DNS record types**: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`.
  * Type-specific dynamic form fields, helper text, and inline validation.
  * Zone Apex (`@` or blank) support with live canonical domain name previews (`example.com (Zone Apex)`).
  * Fast TTL preset selector buttons (60s, 300s, 3600s, 86400s).
  * Monospace rendering for IP addresses and target hostnames.
* **Search, Filtering & Pagination**:
  * Server-side search and record type filtering.
  * Debounced search queries resetting pagination states.
  * Server-side pagination metadata with page size selection.
  * Differentiated empty states (0 records in zone vs no search results).
* **Docker-Free Architecture**:
  * Completely runs locally on Windows, macOS, or Linux without Docker, PostgreSQL, or Redis.

---

## Tech Stack & Architecture

```text
[ Next.js 14 + TypeScript ] (Frontend UI & Shell)
            |
            | REST API over HTTP (/api/v1) with HTTP-only Cookies
            v
   [ FastAPI (Python 3.12) ] (API Layer & Router)
            |
            v
     [ SQLAlchemy ORM ] (Service & Repository Pattern)
            |
            v
 [ SQLite (route53.db) ] (Local Persistent Data File)
```

* **Frontend**: Next.js 14, TypeScript, React 18, Vanilla CSS Design System (`globals.css`), Lucide Icons.
* **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Passlib (`scrypt`).
* **Database**: SQLite with persistent file storage (`backend/data/route53.db`).

---

## Database Schema

* **`users`**: User accounts with `id`, `email`, `name`, `password_hash`, and timestamps.
* **`sessions`**: Server-side user sessions with `id`, `user_id`, `token` (opaque UUID), `expires_at`, and `created_at`.
* **`hosted_zones`**: User-owned hosted zones with `id`, `zone_id` (e.g. `Z0000000000001`), `name`, `type` (`Public`/`Private`), `description`, `owner_id`, `created_at`, `updated_at`.
* **`dns_records`**: DNS records with `id`, `hosted_zone_id`, `name`, `type`, `value` (formatted string), `data` (JSON-backed object), `ttl`, `priority`, `created_at`, `updated_at`.

---

## API Documentation (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate user & set HTTP-only session cookie |
| `POST` | `/api/v1/auth/logout` | Invalidate server session & clear cookie |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user details |
| `GET` | `/api/v1/hosted-zones` | List user hosted zones (search, page, page_size) |
| `POST` | `/api/v1/hosted-zones` | Create a new hosted zone |
| `GET` | `/api/v1/hosted-zones/{id}` | Get hosted zone details by zone_id |
| `PUT` | `/api/v1/hosted-zones/{id}` | Replace hosted zone details |
| `PATCH` | `/api/v1/hosted-zones/{id}` | Partially update hosted zone details |
| `DELETE` | `/api/v1/hosted-zones/{id}` | Delete hosted zone and cascade delete records |
| `GET` | `/api/v1/hosted-zones/{id}/records` | List DNS records (search, type, page, page_size) |
| `POST` | `/api/v1/hosted-zones/{id}/records` | Create a new DNS record |
| `GET` | `/api/v1/hosted-zones/{id}/records/{rec_id}` | Get record by ID |
| `PUT` | `/api/v1/hosted-zones/{id}/records/{rec_id}` | Replace record |
| `PATCH` | `/api/v1/hosted-zones/{id}/records/{rec_id}` | Partially update record |
| `DELETE` | `/api/v1/hosted-zones/{id}/records/{rec_id}` | Delete DNS record |
| `GET` | `/api/v1/health` | Health check endpoint |

---

## Local Setup Instructions (Docker-Free)

### Prerequisites
* **Python**: 3.10+ (tested with Python 3.12)
* **Node.js**: 18+ (tested with Node 20 / 22)
* **OS**: Windows, macOS, or Linux

### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --reload --port 8000
```
Backend API server: `http://localhost:8000`  
Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```
Frontend web console: `http://localhost:3000`

---

## Demo Credentials

The database comes automatically seeded with a demo user account:

* **Email**: `demo@aws.local`
* **Password**: `demo123`

---

## Running Verification & Tests

### Backend Unit Tests (Pytest)
```bash
pytest backend
```
*Expected result*: `39 passed` (or 100% pass rate).

### Backend Syntax & Compilation Check
```bash
python -m compileall backend/app backend/tests
```

### Frontend Production Build & Type Check
```bash
cd frontend
npm run build
```
*Expected result*: `Compiled successfully` with `0 TypeScript errors`.

---

## Security Audit Summary

* **Password Hashing**: `scrypt` salted hashing via Passlib. Passwords are never stored in plaintext.
* **Session Security**: Cryptographically secure 256-bit random tokens stored server-side in SQLite. Transmitted strictly over HTTP-only `SameSite=Lax` cookies.
* **Owner Isolation**: All queries filter by `owner_id` derived from the session cookie, preventing unauthorized access to other users' zones or records.
* **Data Validation**: Strict Pydantic v2 schemas for all payloads; IP format, hostname syntax, and type-specific rules enforced server-side.
* **SQL Injection Prevention**: 100% SQLAlchemy ORM query building (zero raw string concatenation).

---

## Project Structure

```text
route53-clone/
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── app/
│   │   ├── core/           # Security, database connection, session auth
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── repositories/   # Data access repositories
│   │   ├── routers/        # FastAPI API routers (/api/v1)
│   │   ├── schemas/        # Pydantic data validation schemas
│   │   ├── services/       # Business logic layer
│   │   ├── validators/     # DNS record data validators
│   │   └── main.py         # FastAPI application entrypoint
│   ├── data/               # Persistent SQLite database storage (route53.db)
│   ├── tests/              # Pytest backend test suite (39 tests)
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── coming-soon/    # Polished AWS feature placeholder page
    │   ├── hosted-zones/   # Hosted zone list & details pages
    │   ├── login/          # Login page
    │   ├── globals.css     # AWS Console CSS design system & tokens
    │   ├── layout.tsx      # Next.js root layout
    │   └── page.tsx        # Dashboard page
    ├── components/
    │   ├── hosted-zones/   # HostedZoneForm & HostedZoneTable
    │   ├── layout/         # Shell navigation header, sidebar & drawer
    │   ├── records/        # RecordForm & RecordTable
    │   └── ui/             # Reusable UI primitives (Button, Modal, ConfirmModal, etc.)
    ├── lib/
    │   ├── api.ts          # Centralized typed REST client
    │   ├── types.ts        # TypeScript domain interfaces
    │   └── hooks/          # React custom hooks (useAuth, useHostedZones, useRecords, etc.)
    ├── package.json
    └── tsconfig.json
```

---

## License

Created for demonstration and educational assessment purposes.
