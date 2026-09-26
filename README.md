# AWS Route 53 Web Console Clone

A full-stack web application that recreates the core user experience and DNS management workflows of the **AWS Route 53 console**.

The application provides a Route 53-inspired interface for managing Hosted Zones and DNS Records, with authentication, persistent SQLite storage, validation, search, filtering, pagination, and functional simulated modules for additional Route 53 sections.

> **Note:** This project is a technical assessment clone. It does not connect to real AWS Route 53 infrastructure, modify real DNS records, or require AWS credentials.

---

## Live Demo

**Frontend:** `TODO - Add deployment URL`

**Backend API:** `TODO - Add backend URL`

**API Documentation:** `TODO - Add Swagger URL`

### Demo Credentials

```text
Email:    demo@aws.local
Password: demo123
```

---

# 1. Features

## Authentication

- Demo login/logout
- Password hashing using `scrypt`
- Server-side session management
- HTTP-only authentication cookies
- Session expiration
- Session restoration after page refresh
- Protected API endpoints
- User ownership isolation
- No authentication state stored as trusted data in `localStorage`

## Hosted Zones

- Create Hosted Zones
- View Hosted Zones
- Edit Hosted Zones
- Delete Hosted Zones
- Search Hosted Zones
- Server-side pagination
- Public and Private zone types
- Stable Route 53-style Zone IDs
- Hosted Zone details page
- Cascade deletion of associated DNS records

## DNS Records

Supports all required DNS record types:

| Type | Supported |
|---|---|
| A | Yes |
| AAAA | Yes |
| CNAME | Yes |
| TXT | Yes |
| MX | Yes |
| NS | Yes |
| PTR | Yes |
| SRV | Yes |
| CAA | Yes |

DNS functionality includes:

- Create records
- View records
- Edit records
- Delete records
- Search records
- Filter by record type
- Pagination
- TTL configuration
- Type-specific form fields
- Zone Apex support
- Server-side validation
- Duplicate record validation
- CNAME conflict validation

## Additional Route 53 Sections

The following sections are implemented as persistent simulated management modules:

- Traffic Policies
- Health Checks
- Resolver Endpoints
- Profiles

These modules use the same REST API and SQLite persistence architecture but do not connect to real AWS services.

## UI / UX

The interface follows an AWS Route 53-inspired console design:

- AWS-style navigation
- Dark console header
- Sidebar navigation
- Breadcrumbs
- Console-style tables
- Search and filter controls
- Modal forms
- Confirmation dialogs
- Status badges
- Toast notifications
- Loading states
- Empty states
- Error states
- Responsive layout
- Accessible form controls

---

# 2. Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- CSS
- Lucide Icons

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Uvicorn

### Database

- SQLite

### Authentication

- HTTP-only cookies
- Server-side sessions
- `scrypt` password hashing

---

# 3. Architecture Overview

The application follows a layered full-stack architecture:

```text
                         ┌─────────────────────────┐
                         │        Browser          │
                         │                         │
                         │   Next.js + React + TS  │
                         └────────────┬────────────┘
                                      │
                              REST / JSON API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │        FastAPI          │
                         │                         │
                         │ API Routers             │
                         │ Authentication          │
                         │ Request Validation      │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      Service Layer      │
                         │                         │
                         │ Business Logic          │
                         │ Ownership Checks        │
                         │ Validation Rules        │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │    Repository Layer     │
                         │                         │
                         │ Database Access         │
                         │ CRUD Operations         │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │         SQLite          │
                         │                         │
                         │   Persistent Storage     │
                         └─────────────────────────┘
```

### Request Flow

```text
Frontend
   ↓
FastAPI Router
   ↓
Authentication / Ownership Check
   ↓
Pydantic Validation
   ↓
Service Layer
   ↓
Repository Layer
   ↓
SQLAlchemy
   ↓
SQLite
   ↓
API Response
   ↓
Frontend
```

This separation keeps UI, business logic, API handling, and database access independent.

---

# 4. Project Structure

```text
aws-route53-clone/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── dependencies.py
│   │   │   ├── responses.py
│   │   │   └── security.py
│   │   │
│   │   ├── repositories/
│   │   │   ├── hosted_zone_repository.py
│   │   │   ├── record_repository.py
│   │   │   ├── session_repository.py
│   │   │   ├── user_repository.py
│   │   │   └── simulated_crud_repository.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── zones.py
│   │   │   ├── records.py
│   │   │   └── simulated.py
│   │   │
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── hosted_zone_service.py
│   │   │   └── record_service.py
│   │   │
│   │   ├── validators/
│   │   │   ├── zone_validators.py
│   │   │   └── record_validators.py
│   │   │
│   │   ├── database.py
│   │   ├── database_migrations.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── schemas_simulated.py
│   │   ├── seed.py
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── start-prod.sh
│
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── hosted-zones/
│   │   ├── health-checks/
│   │   ├── profiles/
│   │   ├── resolver/
│   │   ├── traffic-policies/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── hosted-zones/
│   │   ├── layout/
│   │   ├── records/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── README.md
└── .env.example
```

---

# 5. Database Schema

The application uses SQLite for persistent relational storage.

## Entity Relationship Overview

```text
users
  │
  ├──────── sessions
  │
  ├──────── hosted_zones
  │              │
  │              └──────── dns_records
  │
  ├──────── traffic_policies
  ├──────── health_checks
  ├──────── resolver_endpoints
  └──────── profiles
```

## Users

Stores application users.

| Field | Description |
|---|---|
| `id` | Internal primary key |
| `email` | User email |
| `name` | Display name |
| `password_hash` | Salted password hash |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

Passwords are never stored as plaintext.

## Sessions

Stores server-side authentication sessions.

| Field | Description |
|---|---|
| `id` | Session primary key |
| `user_id` | Associated user |
| `token` | Opaque session token |
| `expires_at` | Session expiration |
| `created_at` | Creation timestamp |

## Hosted Zones

Stores user-owned hosted zones.

| Field | Description |
|---|---|
| `id` | Internal database ID |
| `zone_id` | Stable Route 53-style identifier |
| `name` | Domain name |
| `type` | Public / Private |
| `description` | Zone description |
| `owner_id` | Owning user |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

Example:

```text
id:          1
zone_id:     Z0000000000001
name:        example.com
type:        Public
owner_id:    1
```

The internal database ID is used for relationships while `zone_id` is the Route 53-style identifier displayed to users.

## DNS Records

Stores records belonging to hosted zones.

| Field | Description |
|---|---|
| `id` | Record primary key |
| `hosted_zone_id` | Related hosted zone |
| `name` | Record name |
| `type` | DNS record type |
| `value` | Human-readable value |
| `data` | JSON-backed structured data |
| `ttl` | Time to live |
| `priority` | Optional priority |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |

Because DNS record types have different structures, the application stores canonical record data as JSON.

Example A record:

```json
{
  "addresses": [
    "192.0.2.10"
  ]
}
```

Example MX record:

```json
{
  "priority": 10,
  "exchange": "mail.example.com"
}
```

Example CAA record:

```json
{
  "flags": 0,
  "tag": "issue",
  "value": "letsencrypt.org"
}
```

---

# 6. Database Persistence

The default database location is:

```text
backend/data/route53.db
```

The database location can be configured with:

```env
DATABASE_PATH=/path/to/route53.db
```

or:

```env
DATABASE_URL=sqlite:////path/to/route53.db
```

The application uses additive database migrations.

Application startup does not intentionally:

- Drop tables
- Delete the database
- Reset application data
- Recreate existing resources

Existing users, hosted zones, DNS records, and simulated resources remain available after restarting the backend.

For production deployment, SQLite must be stored on persistent writable storage.

---

# 7. API Documentation

The backend exposes a versioned REST API under:

```text
/api/v1
```

Interactive Swagger/OpenAPI documentation is automatically provided by FastAPI at:

```text
/docs
```

---

## Authentication

### Login

```http
POST /api/v1/auth/login
```

Authenticates a user and creates a server-side session.

### Logout

```http
POST /api/v1/auth/logout
```

Invalidates the current session.

### Current User

```http
GET /api/v1/auth/me
```

Returns the currently authenticated user.

---

## Hosted Zones

### List Hosted Zones

```http
GET /api/v1/hosted-zones
```

Query parameters:

```text
search
page
page_size
```

Example:

```text
GET /api/v1/hosted-zones?search=example&page=1&page_size=10
```

### Create Hosted Zone

```http
POST /api/v1/hosted-zones
```

### Get Hosted Zone

```http
GET /api/v1/hosted-zones/{zone_id}
```

### Update Hosted Zone

```http
PUT /api/v1/hosted-zones/{zone_id}
```

### Delete Hosted Zone

```http
DELETE /api/v1/hosted-zones/{zone_id}
```

Deleting a hosted zone also removes its associated DNS records.

---

## DNS Records

### List Records

```http
GET /api/v1/hosted-zones/{zone_id}/records
```

Query parameters:

```text
search
type
page
page_size
```

Example:

```text
GET /api/v1/hosted-zones/Z0000000000001/records?type=A&page=1&page_size=20
```

### Create Record

```http
POST /api/v1/hosted-zones/{zone_id}/records
```

### Get Record

```http
GET /api/v1/hosted-zones/{zone_id}/records/{record_id}
```

### Update Record

```http
PUT /api/v1/hosted-zones/{zone_id}/records/{record_id}
```

### Delete Record

```http
DELETE /api/v1/hosted-zones/{zone_id}/records/{record_id}
```

---

## Traffic Policies

```http
GET    /api/v1/traffic-policies
POST   /api/v1/traffic-policies
PUT    /api/v1/traffic-policies/{id}
DELETE /api/v1/traffic-policies/{id}
```

## Health Checks

```http
GET    /api/v1/health-checks
POST   /api/v1/health-checks
PUT    /api/v1/health-checks/{id}
DELETE /api/v1/health-checks/{id}
```

## Resolver Endpoints

```http
GET    /api/v1/resolver-endpoints
POST   /api/v1/resolver-endpoints
PUT    /api/v1/resolver-endpoints/{id}
DELETE /api/v1/resolver-endpoints/{id}
```

## Profiles

```http
GET    /api/v1/profiles
POST   /api/v1/profiles
PUT    /api/v1/profiles/{id}
DELETE /api/v1/profiles/{id}
```

## Health

```http
GET /api/v1/health
```

Used to verify that the backend service is running.

---

# 8. API Response Format

Successful responses use a consistent structure.

Example:

```json
{
  "data": {
    "id": 1,
    "name": "example.com"
  }
}
```

List responses include pagination metadata:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

Errors use structured error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid DNS record data"
  }
}
```

---

# 9. Validation

The backend performs server-side validation.

Validation includes:

- Domain and hostname validation
- IPv4 validation
- IPv6 validation
- TTL validation
- DNS record type validation
- Required field validation
- Type-specific DNS validation
- Duplicate record detection
- CNAME conflict detection
- Zone Apex normalization

The frontend also provides contextual validation and helper messages.

---

# 10. Authentication & Security

## Password Security

Passwords are stored as salted `scrypt` hashes.

## Session Security

Authentication uses an HTTP-only cookie containing an opaque server-side session token.

```text
Browser
   │
   │ HTTP-only cookie
   ▼
FastAPI
   │
   │ Session lookup
   ▼
SQLite sessions table
   │
   ▼
Authenticated user
```

The frontend does not treat `localStorage` as proof of authentication.

## Ownership Isolation

Hosted zones and records belong to the authenticated user.

API requests verify resource ownership before allowing access or modification.

## CORS

Production browser origins should be explicitly configured.

Credentialed requests should never use wildcard origins.

---

# 11. Local Setup

## Prerequisites

Install:

- Python 3.10+
- Node.js 18+
- npm
- Git

Docker is **not required**.

---

## Clone Repository

```bash
git clone https://github.com/palakaeron/aws-route53-clone.git
cd aws-route53-clone
```

---

# 12. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment.

### Windows

```powershell
python -m venv .venv
```

Activate:

```powershell
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/api/v1/health
```

---

# 13. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Login using:

```text
Email:    demo@aws.local
Password: demo123
```

---

# 14. Testing

Backend tests are located in:

```text
backend/tests/
```

Run:

```bash
pytest backend/tests
```

The tests cover areas including:

- Authentication
- Session handling
- Hosted Zone CRUD
- DNS Record CRUD
- Validation
- Ownership isolation
- Simulated Route 53 modules

Python compilation can be checked with:

```bash
python -m compileall backend/app backend/tests
```

---

# 15. Production Build

## Frontend

```bash
cd frontend
npm install
npm run build
```

## Backend

Production startup script:

```bash
bash backend/start-prod.sh
```

Or directly:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

# 16. Deployment

The intended deployment architecture is:

```text
                    Internet
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
          Vercel           PythonAnywhere
         Next.js              FastAPI
             │                   │
             │    REST API       │
             └─────────┬─────────┘
                       │
                       ▼
                    SQLite
              Persistent Storage
```

Deployment links will be added after deployment.

```text
Frontend:      TODO
Backend API:   TODO
Swagger Docs:  TODO
```

Because SQLite is file-based, the backend must use persistent writable storage for production data.

---

# 17. Environment Variables

## Backend

```env
DATABASE_URL=sqlite:////path/to/route53.db

FRONTEND_ORIGINS=http://localhost:3000,http://localhost:3001

SESSION_TTL_HOURS=8

SESSION_COOKIE_SECURE=false
```

For HTTPS production:

```env
SESSION_COOKIE_SECURE=true
```

## Frontend

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.example.com/api/v1
```

Never commit real secrets or production `.env` files.

---

# 18. Assignment Requirement Mapping

| Requirement | Implementation |
|---|---|
| Route 53-style UI | AWS-inspired console interface |
| Authentication | Login/logout + server-side sessions |
| Hosted Zones | Full CRUD |
| DNS Records | Full CRUD |
| DNS Record Types | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| SQLite Persistence | Yes |
| Search | Hosted Zones, Records and simulated modules |
| Filtering | Record type, status and direction |
| Pagination | Server-side pagination |
| Validation | Frontend + backend |
| REST API | FastAPI `/api/v1` |
| Database Layer | SQLAlchemy + repository pattern |
| Additional Sections | Traffic Policies, Health Checks, Resolver, Profiles |
| Error Handling | Structured API errors |
| Documentation | README + Swagger/OpenAPI |
| Testing | Pytest |
| Docker-Free Setup | Yes |

---

# 19. Design Decisions

### SQLite

SQLite provides relational persistence without requiring a separate database server, making the application easy to run locally and evaluate.

### FastAPI

FastAPI provides:

- Typed API contracts
- Automatic OpenAPI documentation
- Pydantic validation
- Clear router structure
- Lightweight REST APIs

### Next.js

Next.js provides:

- React-based UI
- File-based routing
- TypeScript support
- Component architecture
- Production builds

### Server-Side Sessions

Server-side sessions ensure that authentication state is controlled by the backend rather than being trusted directly from the browser.

---

# 20. Scope & Limitations

This project reproduces the **Route 53 console experience and application workflows**.

It does not:

- Create actual AWS Hosted Zones
- Modify real DNS records
- Connect to AWS Route 53 APIs
- Require AWS access keys
- Operate as an authoritative DNS nameserver
- Perform real AWS traffic routing
- Perform real AWS Health Checks

The additional Route 53 sections are simulated application modules backed by SQLite.

---

# 21. Future Enhancements

Possible future improvements include:

- Real AWS Route 53 API integration
- BIND zone-file import/export
- DNS record import/export
- Advanced traffic routing visualization
- Real AWS Health Check integration
- IAM-based authorization
- Audit logging
- Multi-user administration
- CI/CD automation
- End-to-end browser testing
- Production monitoring

---

# 22. License

This project was created for educational, demonstration, and technical assessment purposes.

It is not affiliated with or endorsed by Amazon Web Services.