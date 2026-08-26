# Software Requirements Specification (SRS)
## FinTrack — Personal Expense Tracker (V1 / MVP)

**Document Version:** 1.0
**Based on:** FinTrack PRD (V2 — includes Payment Method Module)
**Prepared for:** Development & QA Team

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional, technical, and non-functional requirements for **FinTrack V1**, a single-user personal expense tracking web application. It translates the Product Requirements Document (PRD) into a technical specification the backend and frontend teams can build, test, and deploy against.

### 1.2 Scope
FinTrack V1 allows one user to log expenses, organize them into self-created categories, assign a required predefined payment method, view spending through a dashboard (totals, charts, budget status), and search/filter/sort their expense history. No authentication, multi-user support, or external integrations are in scope for V1.

### 1.3 Intended Audience
- Backend developers (API, database, business logic)
- Frontend developers (UI, forms, charts)
- QA/Testing team
- Product Owner (for acceptance sign-off)

### 1.4 Definitions & Abbreviations
| Term | Meaning |
|------|---------|
| SRS | Software Requirements Specification |
| CRUD | Create, Read, Update, Delete |
| ORM | Object-Relational Mapping |
| API | Application Programming Interface |
| P0/P1/P2 | Priority levels (P0 = must-have for V1) |

### 1.5 References
- FinTrack PRD v2 (Product Requirements Document)

---

## 2. Overall Description

### 2.1 Product Perspective
FinTrack V1 is a **standalone, single-user web application** — a new build, not an extension of an existing system. It follows a classic client-server architecture: a REST API backend serving a browser-based frontend, backed by a relational database.

### 2.2 Product Functions (Summary)
- Expense CRUD (add, view, edit, delete)
- Dynamic category management (create, rename, delete/reassign)
- Predefined, required payment method on every expense
- Dashboard with totals, charts, and budget status
- Search, filter, and sort on expenses
- Budget goal setting (overall + per-category) with live tracking

### 2.3 User Classes
- **Single End User** — no roles, no permission tiers in V1 (login is out of scope).

### 2.4 Operating Environment
- **Backend:** Python 3.11+ runtime, REST API
- **Frontend:** Responsive web app (mobile browser + desktop browser)
- **Deployment:** Local or private deployment only (no public internet exposure in V1, per PRD Section 9)
- **Database:** Relational database (see Section 4.2)

### 2.5 Design & Implementation Constraints
- No hardcoded/dummy data at any layer — all data must come from the real database (PRD FR-30 / Section 9.1)
- Single fixed currency: ₹ (INR), 2 decimal places
- No authentication layer in V1 — API is not designed for public exposure
- Must be built so Phase 2 features (login, multi-device sync, custom payment methods) don't require a full rebuild

### 2.6 Assumptions & Dependencies
- Single-user, single-tenant database (no `user_id` partitioning required in V1, but schema should not actively block adding it later)
- Payment Method list is fixed in V1 (Cash, Card, UPI, Net Banking, Wallet) — not user-editable
- Budget goal defaults to monthly period

---

## 3. Technology Stack (V1)

This section specifies the mandated backend technology stack for FinTrack V1. All backend implementation must conform to this stack.

| Layer | Technology | Purpose / Notes |
|-------|-----------|------------------|
| **Web Framework** | **FastAPI** | Core API framework — handles routing, request/response validation via Pydantic, dependency injection |
| **ORM** | **SQLAlchemy 2.x** | Data access layer — models for Expense, Category, PaymentMethod, Budget; uses the modern 2.0-style declarative + `Session`/`AsyncSession` API (not legacy 1.x query style) |
| **Migrations** | **Alembic** | Schema version control — every schema change (new table, new column, new constraint) ships as an Alembic migration, never a manual DB edit |
| **ASGI Server** | **Uvicorn** | Runs the FastAPI app; used for both local development (`--reload`) and the private V1 deployment |
| **API Documentation** | **OpenAPI + Swagger UI** | Auto-generated from FastAPI route/schema definitions; Swagger UI (`/docs`) and ReDoc (`/redoc`) exposed for the dev/QA team to explore and test endpoints manually |
| **Request/Response Validation** | **Pydantic v2** (ships with FastAPI) | Schema validation for all incoming payloads (e.g. positive amount, no future date) and outgoing responses |
| **Database** | **PostgreSQL** | Confirmed for V1 (dev and deployment). Driver: `psycopg` (or `asyncpg` if using SQLAlchemy's async engine) |

### 3.1 Why This Stack Fits V1
- **FastAPI + Pydantic** gives request validation "for free" — directly enforces PRD rules like *"Amount must be a positive number"* and *"Date cannot be in the future"* (FR validation rules) at the API boundary, before data ever reaches the database.
- **SQLAlchemy 2.x** (not 1.x) is specified because its `Session`/`AsyncSession` + typed `Mapped[]` column style is the current long-term-supported pattern — avoids technical debt from day one, matching the PRD's "build a scalable foundation" goal (Section 4).
- **Alembic** directly satisfies the PRD's non-functional requirement that "Architecture should support later phases without major rework" — every V1 table (categories, payment methods, budgets) will need to evolve in Phase 2 (e.g. adding a `user_id` foreign key), and Alembic makes that a tracked, reversible migration instead of a manual ALTER TABLE.
- **Swagger UI** gives the QA team and Product Owner a way to manually exercise every endpoint without waiting on the frontend — supports the PRD's "Testability: every feature/module must be independently testable" requirement (Section 9).

### 3.2 Project Structure (Recommended)
```
fintrack-backend/
├── app/
│   ├── main.py                        # FastAPI app instance, mounts controllers
│   ├── controllers/                    # Route/endpoint layer — receives HTTP request, calls service, returns response
│   │   ├── expense_controller.py
│   │   ├── category_controller.py
│   │   ├── payment_method_controller.py
│   │   ├── budget_controller.py
│   │   └── dashboard_controller.py
│   ├── services/                        # Business logic layer — validation rules, orchestration, no direct DB access
│   │   ├── expense_service.py
│   │   ├── category_service.py
│   │   ├── payment_method_service.py
│   │   ├── budget_service.py
│   │   └── dashboard_service.py
│   ├── repositories/                     # Data access layer — all SQLAlchemy queries live here, nowhere else
│   │   ├── expense_repository.py
│   │   ├── category_repository.py
│   │   ├── payment_method_repository.py
│   │   └── budget_repository.py
│   ├── models/                             # SQLAlchemy 2.x ORM models
│   │   ├── expense.py
│   │   ├── category.py
│   │   ├── payment_method.py
│   │   └── budget.py
│   ├── schemas/                              # Pydantic request/response schemas
│   │   ├── expense_schema.py
│   │   ├── category_schema.py
│   │   ├── payment_method_schema.py
│   │   └── budget_schema.py
│   ├── core/                                   # Config, settings (env-driven), DB session setup
│   │   ├── config.py
│   │   └── db.py
│   └── __init__.py
├── alembic/
│   ├── versions/                                # Migration scripts (incl. payment-method seed migration)
│   └── env.py
├── alembic.ini
├── requirements.txt
├── Dockerfile                                    # Backend-only image
├── .env                                            # Backend environment variables (gitignored)
└── .env.example                                     # Backend env template (committed)

fintrack-frontend/
├── src/
│   └── ...                                           # Frontend app source (framework per frontend team's choice)
├── Dockerfile                                          # Frontend-only image
├── .env                                                  # Frontend environment variables (gitignored)
└── .env.example                                            # Frontend env template (committed)

docker-compose.yml                                          # Orchestrates backend + frontend + Postgres as separate services
```

### 3.3 Layered Architecture — Responsibility Rules

The backend strictly follows a **Controller → Service → Repository → Model** layering. Each layer has one job, and layers below never skip upward:

| Layer | Responsibility | Must NOT do |
|-------|-----------------|--------------|
| **Controller** | Receives the HTTP request (FastAPI route), validates request shape via Pydantic schema, calls the matching Service, returns the response | Must not contain business logic or direct DB/SQLAlchemy queries |
| **Service** | Business logic and validation rules (e.g. "amount must be positive", "category must exist before assigning", "payment method is required") | Must not build SQL/ORM queries directly — always goes through a Repository |
| **Repository** | All SQLAlchemy 2.x queries — `select()`, `insert()`, `update()`, `delete()` against the DB session | Must not contain business/validation logic |
| **Model** | SQLAlchemy 2.x ORM table definitions (`Mapped[]` columns, relationships, constraints) | Must not contain query logic |
| **Schema** | Pydantic request/response contracts — field types, required/optional, validators (e.g. positive amount, date not in future) | Must not touch the database |

This mirrors the file layout requested for `expense` (`expense_controller.py` → `expense_service.py` → `expense_repository.py` → `expense.py` model → `expense_schema.py`) and is repeated identically for `category`, `payment_method`, `budget`, and `dashboard`.

### 3.4 Containerization — Docker & Environment Files

Frontend and backend are **fully separate services** — separate Dockerfiles, separate `.env` files, orchestrated together via `docker-compose.yml`. Neither image bundles the other.

**Backend `Dockerfile` (indicative):**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Backend `.env.example`:**
```
DATABASE_URL=postgresql+psycopg://fintrack_user:fintrack_pass@db:5432/fintrack_db
APP_ENV=development
API_PORT=8000
```

**Frontend `.env.example`:**
```
VITE_API_BASE_URL=http://localhost:8000
```
*(Variable prefix depends on the frontend framework/build tool chosen — placeholder shown assumes a Vite-based setup.)*

**`docker-compose.yml` (indicative — three separate services):**
```yaml
services:
  db:
    image: postgres:16
    env_file: ./backend.env
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./fintrack-backend
    env_file: ./fintrack-backend/.env
    depends_on:
      - db
    ports:
      - "8000:8000"

  frontend:
    build: ./fintrack-frontend
    env_file: ./fintrack-frontend/.env
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

**Rules:**
- `.env` files are **never committed** — only `.env.example` templates are, per repo.
- Backend never reads a frontend env var and vice versa — each service only sees its own `.env` via `env_file` in Compose.
- `DATABASE_URL` is read via backend `core/config.py` (e.g. using `pydantic-settings`), never hardcoded in `db.py`.
- Alembic (`alembic/env.py`) reads the same `DATABASE_URL` from the backend `.env` — one source of truth for the DB connection string, no duplicated credentials.

---

## 4. System Architecture

### 4.1 High-Level Architecture
```
[ Browser (Frontend — separate Docker container) ]
              │  HTTP (Compose network / local private deployment)
              ▼
[ Uvicorn (ASGI Server) — Backend container ]
              │
              ▼
[ FastAPI Application ]
   ├── Controllers   (HTTP layer — request in, response out)
   ├── Services       (business logic & validation)
   ├── Repositories     (all SQLAlchemy 2.x queries)
   └── Pydantic Schemas   (request/response contracts)
              │
              ▼
[ Models (SQLAlchemy 2.x ORM) ]
              │
              ▼
[ PostgreSQL — separate container ]

  Schema evolution managed by → [ Alembic Migrations ]
  API contract exposed via   → [ OpenAPI Schema → Swagger UI @ /docs ]
```

### 4.2 Data Model (Core Entities)

**Expense**
| Field | Type | Constraint |
|-------|------|-----------|
| id | Integer (PK) | Auto-increment |
| title | String(50) | Required, max 50 chars |
| category_id | Integer (FK → Category) | Required |
| payment_method_id | Integer (FK → PaymentMethod) | **Required** (per updated PRD) |
| amount | Numeric(10,2) | Required, must be > 0 |
| date | Date | Required, must be ≤ today |
| notes | Text | Optional |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

**Category**
| Field | Type | Constraint |
|-------|------|-----------|
| id | Integer (PK) | Auto-increment |
| name | String | Required, unique |
| created_at | DateTime | Auto-set |

**PaymentMethod** *(predefined, seeded — see Section 3 above)*
| Field | Type | Constraint |
|-------|------|-----------|
| id | Integer (PK) | Auto-increment |
| name | String | Required, unique (seed data: Cash, Card, UPI, Net Banking, Wallet) |
| is_predefined | Boolean | True for all V1 rows (flag reserved for Phase 2 custom methods) |

**Budget**
| Field | Type | Constraint |
|-------|------|-----------|
| id | Integer (PK) | Auto-increment |
| category_id | Integer (FK → Category, nullable) | Null = overall budget |
| amount_limit | Numeric(10,2) | Required, > 0 |
| period | String | Default "monthly" |
| created_at | DateTime | Auto-set |

*Note: See Section 4.4 below for the full database migration and seeding strategy.*

### 4.4 Database Migration Strategy

PostgreSQL is the confirmed database for V1. All schema management goes through Alembic — no manual `CREATE TABLE` / `ALTER TABLE` against the database at any point, in dev or deployment.

| Migration | Purpose |
|-----------|---------|
| `0001_initial_schema` | Creates `expense`, `category`, `payment_method`, `budget` tables with all constraints (FKs, NOT NULL, unique) defined in Section 4.2 |
| `0002_seed_payment_methods` | **Data-seed migration** — inserts the five predefined payment methods (Cash, Card, UPI, Net Banking, Wallet) as rows, with `is_predefined = true` |
| `0003_seed_default_categories` *(optional, P2 per PRD FR-10)* | Seeds starter categories (Food, Transport, Rent, etc.) so the app isn't empty on first use — only if FR-10 is picked up in V1 |

**Rules for migrations:**
- Every migration must have a working `upgrade()` **and** `downgrade()` function — no one-way migrations.
- Seed-data migrations (`0002`, `0003`) use Alembic's `op.bulk_insert()` against a lightweight `sa.table()` definition — not the ORM model directly — so seeding stays stable even if the model changes later.
- Migrations are the only place seed/reference data is created. Nothing in `app/` (routers, CRUD, startup events) should insert default rows — this keeps FR-30 ("no hardcoded data in the application layer") satisfied while still guaranteeing the app isn't empty on first run.
- `alembic upgrade head` is a required step in the Run → Test → Deploy cycle (PRD Section 9.1) before each deployment.

### 4.5 Data Seeding — What's Needed for V1

| Data | Seed in V1? | Method |
|------|-------------|--------|
| Payment Methods (Cash, Card, UPI, Net Banking, Wallet) | **Yes — required** | Alembic migration `0002_seed_payment_methods` (fixed list, not user-editable per Section 2.6) |
| Default Categories (Food, Transport, Rent, etc.) | Optional — only if PRD FR-10 (P2) is included in V1 build | Alembic migration `0003_seed_default_categories`, if included |
| Expenses, Budgets, User-created Categories | **No** | These are always created live by the user through the API — never seeded, per FR-30 (no hardcoded/demo data) |

### 4.3 API Endpoints (V1 — indicative)

All endpoints are auto-documented via OpenAPI/Swagger at `/docs`. Each row below is served by its matching `*_controller.py`, which delegates to the matching `*_service.py`.

| Method | Endpoint | Maps to PRD Requirement |
|--------|----------|--------------------------|
| GET | `/health` | Non-functional: Reliability/monitoring |
| POST | `/expenses` | FR-2 (Add) |
| GET | `/expenses` (supports `?search=&category=&date_from=&date_to=&amount_min=&amount_max=&payment_method=&sort_by=`) | FR-3, FR-11–FR-16 |
| GET | `/expenses/{id}` | FR-3 |
| PUT | `/expenses/{id}` | FR-4 (Edit) |
| DELETE | `/expenses/{id}` | FR-5 (Delete, with confirmation handled client-side) |
| POST | `/categories` | FR-6 |
| PUT | `/categories/{id}` | FR-7 |
| DELETE | `/categories/{id}` | FR-8 (unused-check or reassign logic) |
| GET | `/categories` | FR-9 (includes expense count per category) |
| GET | `/payment-methods` | FR-31, FR-33 (includes usage count) |
| POST | `/budgets` | FR-26 |
| GET | `/budgets` | FR-27 |
| GET | `/dashboard/summary` | FR-17, FR-21 |
| GET | `/dashboard/charts/category` | FR-19 |
| GET | `/dashboard/charts/trend` | FR-20 |
| GET | `/dashboard/charts/payment-method` | FR-34/FR-35 |

---

## 5. Functional Requirements

*(Carried forward from PRD — see PRD Sections 7.1–7.9 for full detail, user stories, and priorities. This SRS references the same FR-IDs for traceability.)*

- **7.1 Navigation** — FR-1
- **7.2 Expense Fields & Validation** — field-level rules enforced via Pydantic schemas at the API layer
- **7.3 Expense CRUD** — FR-2 to FR-5
- **7.4 Category Management** — FR-6 to FR-10
- **7.4-A Payment Method Management** — FR-31 to FR-35 (predefined list, required assignment, usage view, dashboard chart)
- **7.5 Search, Filter & Sort** — FR-11 to FR-16
- **7.6 Dashboard** — FR-17 to FR-25, FR-35
- **7.7 Budget / Spending Goal** — FR-26 to FR-28
- **7.9 Data Integrity Principle** — FR-30

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | API responses for list/dashboard endpoints should return in a reasonable time at realistic V1 data volumes (single-user, thousands of rows) |
| **Validation** | All input validation (positive amount, no future date, required fields) enforced server-side via Pydantic schemas — never trust client-side validation alone |
| **API Documentation** | Every endpoint must be visible and testable via Swagger UI (`/docs`) without needing the frontend |
| **Migrations** | Every schema change must go through an Alembic migration — no direct manual schema edits |
| **Data Integrity** | No hardcoded/dummy data anywhere — predefined payment methods are seeded via migration, not hardcoded in application logic |
| **Testability** | Each router/CRUD module independently testable (e.g. via `pytest` + FastAPI's `TestClient`) before deployment |
| **Scalability** | Schema and API structure must not block Phase 2 additions (login/user scoping, custom payment methods, recurring expenses) |
| **Reliability** | `/health` endpoint required for basic uptime verification during local/private deployment |
| **Security (V1-scoped)** | No public internet exposure; no auth layer required, but API should not be designed in a way that makes adding auth (Phase 2) structurally difficult |

---

## 7. Definition of Done (Technical, V1)

- All entities (Expense, Category, PaymentMethod, Budget) implemented as SQLAlchemy 2.x models against **PostgreSQL**
- `alembic upgrade head` runs cleanly on a fresh, empty PostgreSQL database with no manual intervention
- Payment method seed migration (`0002_seed_payment_methods`) verified to insert exactly the five predefined methods, with no duplicate rows on repeated `upgrade`/`downgrade` cycles
- All schema changes tracked via Alembic migrations — no manual schema edits at any point
- All endpoints implemented in FastAPI, documented and testable via Swagger UI at `/docs`
- Server runs via Uvicorn in both dev (`--reload`) and deployed mode
- Every expense enforces a required, predefined payment method at the API layer (not just UI)
- Dashboard exposes a payment-method breakdown endpoint consumed by the frontend chart
- No hardcoded data in any endpoint response — verified against a freshly migrated, empty database

---

## 8. Out of Scope (V1) — Technical

- Authentication/authorization middleware
- Multi-tenant / `user_id` scoping
- Async task queues, background jobs, notifications
- Report export (PDF/Excel/CSV) generation
- Custom/editable payment methods (Phase 2)
