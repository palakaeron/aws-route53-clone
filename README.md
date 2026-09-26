# AWS Route 53 Web Console Clone

A full-stack technical assessment project that recreates the core **AWS Route 53 console experience** for Hosted Zones and DNS record management.

The application provides a Route 53-inspired web console with authentication, user-owned resources, full CRUD workflows, DNS validation, search, filtering, pagination, SQLite persistence, and functional simulated modules for additional Route 53 sections.

> **Important:** This is a functional application clone for assessment/demo purposes. It does **not** connect to real AWS Route 53 infrastructure, modify real DNS records, or require AWS credentials.

---

## Live Demo

| Resource | Link |
|---|---|
| **Frontend** | https://aws-route53-clone-theta.vercel.app/ |
| **Backend API** | https://route53-clone-api-g3t0.onrender.com |
| **Swagger / OpenAPI** | https://route53-clone-api-g3t0.onrender.com/docs |
| **Health Check** | https://route53-clone-api-g3t0.onrender.com/api/v1/health |
| **Source Code** | https://github.com/palakaeron/aws-route53-clone |

### Demo Credentials

```text
Email:    demo@aws.local
Password: demo123
```

---

## Project Overview

This project recreates the main workflows of the AWS Route 53 web console while implementing the application independently using modern full-stack technologies.

The main focus is on:

- Hosted Zone management
- DNS Record management
- Authentication and sessions
- REST API architecture
- SQLite persistence
- DNS validation
- Search and filtering
- Server-side pagination
- Ownership isolation
- AWS-inspired UI/UX
- Functional supporting Route 53 modules
- API documentation
- Automated backend testing

The project was designed as a functional engineering implementation rather than a static UI mockup.

---

## Project Highlights

- Full-stack Next.js + FastAPI application
- AWS Route 53-inspired console interface
- Login/logout authentication
- Server-side session management
- HTTP-only authentication cookies
- User-owned resources
- Hosted Zone CRUD
- DNS Record CRUD
- Support for all required DNS record types
- Search and filtering
- Server-side pagination
- Type-aware DNS validation
- SQLite database
- SQLAlchemy ORM
- Repository/service architecture
- REST API with FastAPI
- Swagger/OpenAPI documentation
- Structured API responses
- Error handling and validation
- Functional simulated Route 53 modules
- 43 backend tests passing
- Vercel frontend deployment
- Render backend deployment
- Docker-free local development

---

# Features

## 1. Authentication

The application includes a complete login/logout flow.

### Features

- Email/password login
- Server-side sessions
- HTTP-only session cookie
- Session expiration
- Logout
- Authentication state restoration
- Protected application routes
- User ownership checks

Authentication does not store the user object in browser local storage.

The frontend communicates with the backend using credentials-enabled requests so the HTTP-only session cookie is sent with API requests.

---

## 2. Hosted Zones

Hosted Zones are the primary Route 53 resource.

The application supports:

- Create Hosted Zone
- View Hosted Zone
- Edit Hosted Zone
- Delete Hosted Zone
- Search Hosted Zones
- Server-side pagination
- Zone metadata
- Record count
- Route 53-style Zone IDs
- Ownership isolation

Each zone receives a Route 53-style public identifier such as:

```text
Z1234567890ABC
```

Deleting a Hosted Zone also removes its associated DNS records.

---

## 3. DNS Records

DNS records can be created and managed inside each Hosted Zone.

The application supports all nine required record types:

| Record Type | Supported |
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

### Record Operations

- Create record
- Read record
- Update record
- Delete record
- Search records
- Filter by record type
- Server-side pagination
- TTL management
- Record value validation
- Record name normalization
- Apex/root record handling
- Duplicate detection
- CNAME conflict validation

---

## 4. DNS Validation

DNS validation is implemented on the backend rather than relying only on frontend validation.

Examples include:

- Valid DNS record names
- Positive TTL values
- IPv4 validation for A records
- IPv6 validation for AAAA records
- Target validation for CNAME records
- MX priority/value validation
- SRV structure validation
- CAA structure validation
- Record type-specific validation
- Duplicate record detection
- CNAME conflict rules

This prevents invalid requests from bypassing the frontend and being stored directly through the API.

---

## 5. Search, Filtering and Pagination

The application implements server-side data operations.

### Hosted Zones

- Search by domain/name
- Pagination
- Total count

### DNS Records

- Search by record name
- Filter by record type
- Pagination
- Total count

### Additional Modules

The simulated Route 53 modules also provide search, filtering, and pagination where appropriate.

---

## 6. Additional Route 53 Sections

The following Route 53 console sections are implemented as lightweight, SQLite-backed simulated modules:

### Traffic Policies

Provides a functional CRUD interface for simulated traffic policies.

### Health Checks

Provides creation, editing, deletion, and filtering of simulated health checks.

### Resolver

Provides simulated resolver resources and management workflows.

### Profiles

Provides simulated Route 53 profiles with CRUD operations.

These modules are intentionally implemented as application-level simulations.

They do not connect to AWS infrastructure.

---

# UI / UX

The frontend follows the visual language of the AWS console while remaining an independently implemented application.

### UI Features

- AWS-inspired navigation
- Responsive layout
- Sidebar navigation
- Breadcrumbs
- Data tables
- Modal dialogs
- Confirmation dialogs
- Inline validation
- Toast notifications
- Loading states
- Empty states
- API error states
- Search controls
- Filter controls
- Pagination controls
- Accessible focus states
- Keyboard-friendly modal handling
- Query-aware navigation state

The interface is designed to make the main Route 53 workflows easy to discover and operate.

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

## Database

- SQLite

## Authentication

- Server-side sessions
- HTTP-only cookies
- Salted password hashing using scrypt

## Deployment

- Vercel — frontend
- Render — backend

## Development

- Git
- GitHub
- npm
- Python virtual environment

---

# Architecture

```text
                         ┌──────────────────────────┐
                         │        Browser           │
                         │                          │
                         │   Next.js / React UI     │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTPS / REST API
                                      ▼
                         ┌──────────────────────────┐
                         │         FastAPI          │
                         │                          │
                         │        /api/v1           │
                         │                          │
                         │   Routers                │
                         │      ↓                   │
                         │   Services               │
                         │      ↓                   │
                         │   Repositories           │
                         │      ↓                   │
                         │   SQLAlchemy             │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │          SQLite          │
                         │                          │
                         │ Users                    │
                         │ Sessions                 │
                         │ Hosted Zones             │
                         │ DNS Records              │
                         │ Traffic Policies         │
                         │ Health Checks             │
                         │ Resolver                 │
                         │ Profiles                 │
                         └──────────────────────────┘
```

---

# Production Deployment Architecture

```text
User
 │
 ▼
Vercel
Next.js Frontend
 │
 │ HTTPS
 ▼
Render
FastAPI Backend
 │
 ▼
SQLite
```

### Frontend

Production frontend:

https://aws-route53-clone-theta.vercel.app/

### Backend

Production backend:

https://route53-clone-api-g3t0.onrender.com

The frontend is configured to communicate with:

```text
https://route53-clone-api-g3t0.onrender.com/api/v1
```

---

# Project Structure

```text
aws-route53-clone/
│
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── hosted-zones/
│   │   ├── traffic-policies/
│   │   ├── health-checks/
│   │   ├── resolver/
│   │   ├── profiles/
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   ├── hosted-zones/
│   │   ├── records/
│   │   └── common/
│   │
│   ├── lib/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   └── types.ts
│   │
│   ├── services/
│   ├── package.json
│   └── next.config.mjs
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── seed/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── migrations/
│   ├── data/
│   ├── requirements.txt
│   └── start-prod.sh
│
├── docs/
├── .gitignore
├── .env.example
└── README.md
```

---

# Database Design

The application uses SQLite with SQLAlchemy.

Core entities include:

```text
users
  │
  ├── sessions
  │
  ├── hosted_zones
  │       │
  │       └── dns_records
  │
  ├── traffic_policies
  │
  ├── health_checks
  │
  ├── resolver_resources
  │
  └── profiles
```

## Core Database Concepts

### Users

Stores application users and password hashes.

### Sessions

Stores opaque server-side authentication sessions.

### Hosted Zones

Stores user-owned DNS zones with stable Route 53-style zone IDs.

### DNS Records

Stores DNS records associated with Hosted Zones.

Record values are stored using structured JSON data so different DNS record types can be represented without creating separate tables for every record type.

---

# Database Migrations

The project uses versioned database migrations.

Migration progression:

```text
v1
 │
 ├── Initial database
 │
 ▼
v2
 │
 ├── Authentication
 ├── Users
 ├── Sessions
 └── Ownership
 │
 ▼
v3
 │
 ├── Route 53-style zone IDs
 ├── DNS record JSON values
 ├── updated_at
 └── DNS schema updates
 │
 ▼
v4
 │
 └── Simulated Route 53 modules
```

The migration process is designed to preserve existing data rather than destructively resetting the database.

---

# API

The backend exposes a versioned REST API:

```text
/api/v1
```

## Authentication

```text
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Hosted Zones

```text
GET    /api/v1/hosted-zones
POST   /api/v1/hosted-zones
GET    /api/v1/hosted-zones/{id}
PATCH  /api/v1/hosted-zones/{id}
DELETE /api/v1/hosted-zones/{id}
```

## DNS Records

```text
GET    /api/v1/hosted-zones/{zone_id}/records
POST   /api/v1/hosted-zones/{zone_id}/records
GET    /api/v1/records/{record_id}
PATCH  /api/v1/records/{record_id}
DELETE /api/v1/records/{record_id}
```

Additional API routes are provided for:

- Traffic Policies
- Health Checks
- Resolver
- Profiles

## Health

```text
GET /api/v1/health
```

---

# API Documentation

FastAPI automatically exposes OpenAPI documentation.

Swagger UI:

https://route53-clone-api-g3t0.onrender.com/docs

The API documentation can be used to inspect and test available endpoints.

---

# API Response Design

The API uses structured JSON responses for successful requests and errors.

This keeps frontend API handling consistent and makes errors easier to display to users.

The frontend API client also handles:

- Authentication failures
- JSON responses
- Empty `204 No Content` responses
- Query parameter construction
- API errors
- Session expiration

---

# Authentication & Security

The project includes several application-level security measures.

## Password Security

Passwords are not stored as plaintext.

Password hashing uses salted `scrypt`.

## Sessions

Authentication uses opaque random server-side sessions stored in SQLite.

The browser receives an HTTP-only cookie:

```text
route53_session
```

The session cookie is configured for the deployed frontend/backend architecture.

## Ownership Isolation

Resources are associated with their owning user.

API operations verify ownership before allowing access or modification.

This prevents one authenticated user from accessing another user's:

- Hosted Zones
- DNS Records
- Simulated Route 53 resources

## Frontend Security

The frontend does not store the authenticated user object in local storage.

Authentication state is restored through the backend session endpoint.

---

# Local Development

## Requirements

Install:

- Node.js
- npm
- Python 3.11+
- Git

Docker is **not required**.

---

# Backend Setup

From the repository root:

```bash
cd backend
```

Create a virtual environment.

### Windows

```powershell
python -m venv .venv
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

---

# Backend Environment

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=sqlite:///./data/route53.db
FRONTEND_ORIGINS=http://localhost:3000
SESSION_TTL_HOURS=8
```

Create the data directory if necessary:

```bash
mkdir data
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:

http://localhost:8000

Swagger:

http://localhost:8000/docs

Health check:

http://localhost:8000/api/v1/health

---

# Frontend Setup

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

Start Next.js:

```bash
npm run dev
```

Frontend:

http://localhost:3000

---

# Local Login

The seeded demo account can be used for local testing:

```text
Email:    demo@aws.local
Password: demo123
```

---

# Testing

The backend contains automated tests covering the main application functionality.

Current backend test status:

```text
43 tests passed
```

Tests cover areas including:

- Authentication
- Sessions
- Ownership
- Hosted Zones
- DNS Records
- DNS validation
- Pagination
- Search
- Filtering
- CRUD operations
- Conflict handling
- Simulated Route 53 modules

Run the backend test suite:

```bash
cd backend
pytest
```

---

# Code Quality

The backend follows a layered architecture:

```text
Router
  ↓
Service
  ↓
Repository
  ↓
SQLAlchemy
  ↓
SQLite
```

This separation keeps:

- HTTP handling
- Business logic
- Database access
- Validation

independent from one another.

The frontend uses reusable:

- UI components
- API client
- hooks
- typed models
- form components
- modal components
- layout components

This avoids duplicating application logic across pages.

---

# Validation Strategy

Validation is performed at multiple levels.

```text
User Input
    ↓
Frontend Validation
    ↓
HTTP Request
    ↓
FastAPI / Pydantic
    ↓
Business Validation
    ↓
Database
```

Backend validation is treated as authoritative.

This ensures that invalid data cannot be inserted simply by bypassing the frontend.

---

# Error Handling

The application includes error handling at both frontend and backend levels.

Examples include:

- Invalid login
- Expired session
- Unauthorized resource access
- Resource not found
- Duplicate Hosted Zone
- Duplicate DNS record
- Invalid DNS record
- CNAME conflicts
- Invalid TTL
- Invalid query parameters
- API failures

The frontend provides user-friendly error states and notifications instead of silently failing.

---

# Deployment

## Frontend — Vercel

Production frontend:

https://aws-route53-clone-theta.vercel.app/

Environment variable:

```env
NEXT_PUBLIC_API_URL=https://route53-clone-api-g3t0.onrender.com/api/v1
```

Build command:

```bash
npm run build
```

Framework:

```text
Next.js
```

---

# Backend — Render

Production backend:

https://route53-clone-api-g3t0.onrender.com

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check:

```text
/api/v1/health
```

The Render service is configured for **manual deployment** so changes are not automatically redeployed from GitHub.

---

# Deployment Persistence Note

The live Render free service uses an **ephemeral filesystem**.

Therefore:

- The application works with SQLite in the deployed environment.
- Data can persist while the running instance remains available.
- A Render restart, redeploy, or free-instance spin-down can reset the SQLite file.
- The current deployment should therefore be considered a **demo/assessment deployment**, not durable production storage.
- Durable production persistence would require a persistent volume or an external database.

This limitation is documented intentionally rather than hidden.

---

# Environment Variables

## Frontend

Development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Production:

```env
NEXT_PUBLIC_API_URL=https://route53-clone-api-g3t0.onrender.com/api/v1
```

## Backend

Example:

```env
DATABASE_URL=sqlite:///./data/route53.db
FRONTEND_ORIGINS=http://localhost:3000
SESSION_TTL_HOURS=8
```

---

# Assignment Requirement Coverage

| Requirement | Implementation |
|---|---|
| Route 53-style console | AWS-inspired responsive web console |
| Authentication | Login/logout + server-side sessions |
| Hosted Zones | Full CRUD |
| DNS Records | Full CRUD |
| DNS Types | A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA |
| Search | Hosted Zones, DNS Records and modules |
| Filtering | DNS type and module-specific filters |
| Pagination | Server-side pagination |
| Persistence | SQLite |
| Validation | Frontend + backend validation |
| REST API | FastAPI `/api/v1` |
| API Documentation | Swagger/OpenAPI |
| Database Layer | SQLAlchemy + repositories |
| Security | scrypt password hashing + HTTP-only sessions + ownership |
| Additional Sections | Traffic Policies, Health Checks, Resolver, Profiles |
| Error Handling | Structured API responses + UI error states |
| Automated Tests | 43 backend tests passing |
| Local Setup | Windows / macOS / Linux |
| Deployment | Vercel + Render |
| Docker-free workflow | Yes |

---

# Engineering Decisions

## Why SQLite?

SQLite keeps the project lightweight and easy to run locally while still providing real relational database storage.

It also avoids requiring developers or evaluators to install and configure a separate database server.

## Why FastAPI?

FastAPI provides:

- Typed request/response models
- Automatic OpenAPI documentation
- Fast development
- Clear REST routing
- Strong validation support
- Excellent Python ecosystem integration

## Why Next.js?

Next.js provides a structured React application with:

- App Router
- Route-based pages
- Production builds
- TypeScript support
- Component-based UI architecture

## Why server-side sessions?

Server-side sessions avoid storing sensitive authentication state in browser storage and allow the backend to control session expiration and invalidation.

## Why type-specific DNS validation?

DNS record types have different formats and constraints.

Centralized type-specific validation prevents malformed DNS data from entering the database.

---

# Scope & Limitations

This project is an application clone for assessment and demonstration purposes.

It does not:

- Connect to real AWS Route 53
- Create real AWS Hosted Zones
- Modify real DNS records
- Use AWS credentials
- Perform real DNS propagation
- Provision AWS infrastructure

The additional Route 53 modules are simulated application-level resources.

The deployed Render free service uses an ephemeral filesystem, so the deployed SQLite database should not be treated as durable production storage.

---

# Future Enhancements

Potential future improvements include:

- Real AWS Route 53 integration
- AWS IAM authentication
- Durable production database
- Persistent deployment volume
- DNS propagation checks
- Route 53 health-check integration
- Weighted routing simulation
- Alias record support
- Advanced traffic policies
- BIND zone import/export
- JSON/BIND export
- Bulk DNS operations
- Advanced audit logging
- Role-based access control
- Production observability

---

# Submission Checklist

Before submitting the project, verify:

1. Open the live frontend.
2. Sign in using the demo credentials.
3. Open Hosted Zones.
4. Create a test Hosted Zone.
5. Open the Hosted Zone.
6. Create multiple DNS record types.
7. Edit a DNS record.
8. Delete a DNS record.
9. Search and filter records.
10. Delete the test Hosted Zone.
11. Confirm associated records are removed.
12. Open Traffic Policies.
13. Open Health Checks.
14. Open Resolver.
15. Open Profiles.
16. Log out.
17. Verify protected pages require authentication.
18. Open the Swagger API documentation.
19. Verify the backend health endpoint.
20. Review the GitHub repository and README.

---

# Repository

GitHub:

https://github.com/palakaeron/aws-route53-clone

---

# Live Application

Frontend:

https://aws-route53-clone-theta.vercel.app/

Backend:

https://route53-clone-api-g3t0.onrender.com

Swagger:

https://route53-clone-api-g3t0.onrender.com/docs

Health:

https://route53-clone-api-g3t0.onrender.com/api/v1/health

---

# Disclaimer

This project is an independent educational and technical assessment implementation inspired by the AWS Route 53 console.

AWS Route 53 is a trademark/service of Amazon Web Services, Inc. This project is not affiliated with, sponsored by, or endorsed by Amazon Web Services.

No real AWS infrastructure is modified by this application.

---

# License

This project was created for educational, portfolio, and technical assessment purposes.
