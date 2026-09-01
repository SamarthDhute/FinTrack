# Software Requirements Specification (SRS)
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0
**Last Updated:** August 31, 2026
**Based on:** FinTrack PRD v2.0
**Prepared for:** Development & QA Team
**Status:** Phase 1 ✅ Complete | Phase 2 (Authentication) 🔨 In Progress

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional, technical, and non-functional requirements for FinTrack — a personal expense tracking web application. It translates the Product Requirements Document (PRD) into a technical specification the backend and frontend teams can build, test, and deploy against.

**Version 2.0** extends the original V1 specification with a complete **Phase 2 Authentication** section covering JWT-based auth, Google OAuth 2.0, refresh token rotation, user data isolation, CSRF protection, and rate limiting.

### 1.2 Scope
- **Phase 1 (Complete):** Single-user expense tracking — CRUD, categories, budgets, dashboard, search/filter/sort.
- **Phase 2 (In Progress):** Secure multi-account authentication with JWT access + refresh tokens, Google OAuth, user-scoped data isolation, password management flows.

### 1.3 Intended Audience
- Backend developers (API, database, business logic)
- Frontend developers (UI, forms, auth flows)
- QA/Testing team
- Product Owner (for acceptance sign-off)

### 1.4 Definitions & Abbreviations
| Term | Meaning |
|------|---------|
| SRS | Software Requirements Specification |
| CRUD | Create, Read, Update, Delete |
| ORM | Object-Relational Mapping |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| AT | Access Token (short-lived, 15 min) |
| RT | Refresh Token (long-lived, 30 days) |
| CSRF | Cross-Site Request Forgery |
| OAuth | Open Authorization (2.0) |
| OIDC | OpenID Connect |
| P0/P1/P2 | Priority levels (P0 = must-have for this phase) |

### 1.5 References
- FinTrack PRD v2.0
- RFC 7519 (JSON Web Token)
- RFC 6749 (OAuth 2.0)
- OWASP Authentication Cheat Sheet

---

## 2. Overall Description

### 2.1 Product Perspective
FinTrack is a **client-server web application** following a REST API architecture. Phase 2 adds a stateless JWT authentication layer on top of the existing API, with server-side Refresh Token storage enabling session revocation.

### 2.2 Product Functions (Summary)

**Phase 1 (Existing):**
- Expense CRUD (add, view, edit, delete)
- Dynamic category management
- Predefined, required payment method on every expense
- Dashboard with totals, charts, and budget status
- Search, filter, and sort on expenses
- Budget goal setting (overall + per-category) with live tracking

**Phase 2 (New):**
- User registration (email + password)
- User login / logout / logout-all
- Google Sign-In (OAuth 2.0 / OIDC, backend-driven)
- JWT access + refresh token lifecycle management
- Forgot password / reset password / change password
- User data isolation — all existing APIs scoped per authenticated user

### 2.3 User Classes
- **Authenticated End User** — no roles, no admin, no RBAC in Phase 2. Every user has equal access to their own data only.

### 2.4 Operating Environment
- **Backend:** Python 3.11+ runtime, REST API
- **Frontend:** Responsive web app (mobile browser + desktop browser)
- **Deployment:** Local or private deployment (Phase 2); HTTPS required in production
- **Database:** PostgreSQL

### 2.5 Design & Implementation Constraints
- No hardcoded/dummy data at any layer
- Single fixed currency: ₹ (INR), 2 decimal places
- No RBAC / admin roles in Phase 2
- All JWT secrets and OAuth credentials must live in environment variables only — never in source code
- Refresh Tokens stored as BCrypt hashes in the database — raw tokens never persisted
- Access Token: stored in-memory on the frontend (JavaScript variable) — never in `localStorage`
- Refresh Token: delivered and stored in `HttpOnly; Secure; SameSite=Strict` cookie — never accessible to JavaScript
- Must follow existing Controller → Service → Repository → Model architecture (no new layers)

### 2.6 Assumptions & Dependencies
- Categories become per-user in Phase 2 (not global). Each new user gets a seeded copy of the 10 default categories on registration.
- Budget goals are per-user.
- Existing pre-Phase-2 rows in DB are assigned to a single seed user via Alembic migration — no data lost.
- Password reset email delivery uses an SMTP provider in production; a **console fallback** (prints token to server log) is acceptable for local development.
- Google OAuth requires a valid `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` from Google Cloud Console.

---

## 3. Technology Stack

### 3.1 Backend Stack (Full — Phase 1 + Phase 2)

| Layer | Technology | Purpose / Notes |
|-------|-----------|-----------------|
| **Web Framework** | **FastAPI** | Core API framework — routing, Pydantic validation, dependency injection |
| **ORM** | **SQLAlchemy 2.x** (synchronous `Session`) | Data access — `Mapped[]` typed columns, relationships |
| **Migrations** | **Alembic** | All schema changes tracked — no manual `ALTER TABLE` ever |
| **ASGI Server** | **Uvicorn** | `--reload` for dev; production mode for deployment |
| **API Docs** | **OpenAPI + Swagger UI** | `/docs` for dev/QA manual testing |
| **Validation** | **Pydantic v2** | Request/response contracts, field-level validators |
| **Database** | **PostgreSQL** | Driver: `psycopg` (sync) |
| **[Phase 2] JWT** | **`python-jose[cryptography]`** | HS256 JWT signing/validation |
| **[Phase 2] Password Hashing** | **`passlib[bcrypt]`** | BCrypt — plaintext passwords never stored |
| **[Phase 2] OAuth Client** | **`authlib`** | Google OAuth 2.0 / OIDC client |
| **[Phase 2] Rate Limiting** | **`slowapi`** | Limits-based middleware; applied to login + forgot-password |
| **[Phase 2] Reset Tokens** | **`itsdangerous`** | HMAC-signed, time-limited password-reset tokens (1h TTL) |
| **[Phase 2] Form Parsing** | **`python-multipart`** | Required for OAuth form submissions |
| **HTTP Client** | **`httpx`** | Used by authlib for token exchange; already in requirements |
| **Testing** | **`pytest` + FastAPI `TestClient`** | In-memory SQLite isolation per test session |

> **Note on sync vs async:** The existing codebase uses synchronous `Session` only (no `async`/`await`). Phase 2 follows the same pattern — no async is introduced.

### 3.2 Frontend Stack (Full — Phase 1 + Phase 2)

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + Vite 6 |
| **Styling** | Vanilla CSS (3 files: `index.css`, `components.css`, `pages.css`) |
| **Icons** | `lucide-react` v0.468 |
| **HTTP** | Native `fetch` via centralized `src/api/client.js` |
| **Charts** | Pure SVG (no external chart library) |
| **Auth State** | React Context (`AuthContext`) — in-memory access token |
| **Navigation** | Tab-based (`activeTab` state) — no React Router |
| **[Phase 2] Token Storage** | Access Token: in-memory JS variable; Refresh Token: HttpOnly cookie (managed by browser) |

### 3.3 Project Structure (Phase 2 Extended)

```
fintrack-backend/
├── app/
│   ├── main.py                        # FastAPI app, CORS, SlowAPI, router mounts
│   ├── controllers/
│   │   ├── auth_controller.py          # [NEW] All /auth/* endpoints
│   │   ├── expense_controller.py       # [MODIFY] + current_user dependency
│   │   ├── category_controller.py      # [MODIFY] + current_user dependency
│   │   ├── payment_method_controller.py
│   │   ├── budget_controller.py        # [MODIFY] + current_user dependency
│   │   └── dashboard_controller.py     # [MODIFY] + current_user dependency
│   ├── services/
│   │   ├── auth_service.py             # [NEW] All auth business logic
│   │   ├── expense_service.py          # [MODIFY] + user_id scoping + ownership checks
│   │   ├── category_service.py         # [MODIFY] + user_id scoping
│   │   ├── payment_method_service.py
│   │   ├── budget_service.py           # [MODIFY] + user_id scoping
│   │   └── dashboard_service.py        # [MODIFY] + user_id scoping
│   ├── repositories/
│   │   ├── user_repository.py          # [NEW] User CRUD + default category seeding
│   │   ├── refresh_token_repository.py # [NEW] RT CRUD + revocation
│   │   ├── expense_repository.py       # [MODIFY] + user_id filter on all queries
│   │   ├── category_repository.py      # [MODIFY] + user_id filter on all queries
│   │   ├── payment_method_repository.py
│   │   └── budget_repository.py        # [MODIFY] + user_id filter on all queries
│   ├── models/
│   │   ├── user.py                     # [NEW] User ORM model
│   │   ├── refresh_token.py            # [NEW] RefreshToken ORM model
│   │   ├── expense.py                  # [MODIFY] + user_id FK
│   │   ├── category.py                 # [MODIFY] + user_id FK
│   │   ├── payment_method.py
│   │   └── budget.py                   # [MODIFY] + user_id FK
│   ├── schemas/
│   │   ├── auth_schema.py              # [NEW] Register, Login, Token, User, ForgotPw, ResetPw, ChangePw
│   │   ├── expense_schema.py
│   │   ├── category_schema.py
│   │   ├── payment_method_schema.py
│   │   └── budget_schema.py
│   └── core/
│       ├── config.py                   # [MODIFY] + JWT_SECRET_KEY, GOOGLE_*, SMTP_*, FRONTEND_URL
│       ├── db.py
│       ├── security.py                 # [NEW] hash_pw, verify_pw, create_AT, create_RT, decode_AT, reset tokens
│       └── dependencies.py             # [NEW] get_current_user FastAPI dependency
├── alembic/
│   └── versions/
│       ├── 0001_initial_schema.py      ✅ existing
│       ├── 0002_seed_payment_methods.py ✅ existing
│       ├── 0003_seed_default_categories.py ✅ existing
│       ├── 0004_add_users_and_refresh_tokens.py  [NEW] Creates users + refresh_tokens tables + seed user
│       └── 0005_add_user_id_to_all_tables.py     [NEW] Adds user_id FK to expenses, budgets, categories
├── requirements.txt                    # [MODIFY] + 7 new deps
├── .env                                # gitignored
└── .env.example                        # [MODIFY] + JWT, Google, SMTP vars

fintrack-frontend/
└── src/
    ├── App.jsx                         # [MODIFY] + AuthProvider wrap + conditional auth render
    ├── contexts/
    │   └── AuthContext.jsx             # [NEW] Auth state, token refresh loop, login/logout/register
    ├── api/client.js                   # [MODIFY] + auth namespace + Bearer injection + 401 interceptor
    ├── pages/
    │   ├── AuthPage.jsx                # [NEW] Login + Register + Google Sign-In tabs
    │   ├── ForgotPasswordPage.jsx      # [NEW] Email input for password reset
    │   ├── ResetPasswordPage.jsx       # [NEW] New password form (reads ?token= from URL)
    │   ├── DashboardPage.jsx
    │   ├── ExpensesPage.jsx
    │   ├── BudgetsPage.jsx
    │   └── CategoriesPage.jsx
    ├── components/
    │   └── Navbar.jsx                  # [MODIFY] + user avatar + logout + change password option
    └── styles/
        ├── auth.css                    # [NEW] Auth page styles (glassmorphism card, Google button)
        ├── index.css
        ├── components.css
        └── pages.css
```

### 3.4 Layered Architecture — Responsibility Rules

The backend strictly follows **Controller → Service → Repository → Model** — unchanged for Phase 2. Auth is no exception:

| Layer | Responsibility | Must NOT do |
|-------|-----------------|--------------| 
| **Controller** | HTTP only — parse request, call Service, return response | No business logic, no DB queries |
| **Service** | All business rules (e.g. "email must not already exist", "old password must match before changing", ownership enforcement) | No direct DB/ORM queries |
| **Repository** | All SQLAlchemy queries | No business/validation logic |
| **Model** | SQLAlchemy table definitions | No query logic |
| **Schema** | Pydantic request/response contracts | No DB access |
| **`core/security.py`** | Pure crypto utilities (hash, verify, sign, decode) | No DB access, no HTTP concern |
| **`core/dependencies.py`** | FastAPI `Depends()` functions (extract + validate current user from JWT) | No business logic beyond token validation |

---

## 4. System Architecture

### 4.1 High-Level Architecture (Phase 2)

```
[ Browser ]
    │
    │  HTTP (with Authorization: Bearer <AT> header on protected requests)
    │  Cookie: refresh_token=<RT>; HttpOnly; Secure; SameSite=Strict
    │  Header: X-CSRF-Token: <csrf_token>  (on /auth/refresh only)
    ▼
[ Uvicorn — FastAPI Application ]
    │
    ├── SlowAPI Middleware (rate limiting on /auth/login, /auth/forgot-password)
    ├── CORSMiddleware (restricted origins in prod)
    │
    ├── /auth/*  (auth_controller → auth_service → user_repo / rt_repo / security)
    │
    └── /api/v1/* (all existing controllers + Depends(get_current_user))
         │
         ├── Controllers  → validate JWT via get_current_user dependency
         ├── Services      → enforce ownership (expense.user_id == current_user.id)
         └── Repositories  → all queries WHERE user_id = :uid
                │
                ▼
         [ PostgreSQL ]
              ├── users
              ├── refresh_tokens
              ├── expenses    (+ user_id FK)
              ├── categories  (+ user_id FK)
              ├── budgets     (+ user_id FK)
              └── payment_methods (global — no user_id)
```

### 4.2 Token Flow

```
REGISTRATION / LOGIN
─────────────────────
Client → POST /auth/register (or /auth/login)
Backend:
  1. Verify credentials / create user
  2. Generate AT (JWT, 15 min, HS256)
  3. Generate RT (random 32 bytes → bcrypt hash → store in DB)
  4. Set RT as HttpOnly cookie
  5. Set CSRF token as regular (non-HttpOnly) cookie
  6. Return AT + expires_in + csrf_token in JSON body

AUTHENTICATED REQUEST
──────────────────────
Client → GET /api/v1/expenses
  Header: Authorization: Bearer <AT>
Backend:
  1. get_current_user dependency: decode AT, verify sig + exp + claims
  2. Fetch user from DB
  3. Pass user.id to Service → filter all queries by user_id

SILENT TOKEN REFRESH (every 12 min in frontend)
─────────────────────────────────────────────────
Client → POST /auth/refresh
  Cookie: refresh_token=<raw_RT>  (sent automatically by browser)
  Header: X-CSRF-Token: <csrf_token>  (read from non-HttpOnly cookie)
Backend:
  1. Verify CSRF token matches
  2. Hash raw_RT → look up in DB → verify not revoked + not expired
  3. Revoke old RT (rotation)
  4. Issue new AT + new RT
  5. Set new RT cookie, return new AT

LOGOUT
───────
Client → POST /auth/logout
  Cookie: refresh_token=<raw_RT>
Backend:
  1. Hash raw_RT → look up in DB → mark revoked
  2. Clear RT cookie (Set-Cookie: refresh_token=; Max-Age=0)
  3. Return 200

LOGOUT-ALL
───────────
Client → POST /auth/logout-all
  Header: Authorization: Bearer <AT>
Backend:
  1. Validate AT → get user_id
  2. Revoke ALL RefreshTokens for this user_id
  3. Clear RT cookie
  4. Return 200

GOOGLE OAUTH FLOW
──────────────────
Client → GET /api/v1/auth/google/authorize → redirect to Google consent
Google → GET /api/v1/auth/google/callback?code=...
Backend:
  1. Exchange code for Google tokens (server-to-server via authlib)
  2. Validate ID token → extract verified email + google_id
  3. Find existing user by google_id OR email → link / create account
  4. Issue same AT + RT as regular login
  5. Redirect to FRONTEND_URL with AT in URL fragment (or via cookie)
```

### 4.3 Data Model — Phase 2 New Tables

**users**
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer PK | Auto-increment |
| email | String(255) | Required, unique, indexed |
| display_name | String(100) | Nullable |
| hashed_password | String | Nullable (null for Google-only accounts) |
| google_id | String(255) | Nullable, unique, indexed |
| is_verified | Boolean | Default False |
| is_active | Boolean | Default True |
| created_at | DateTime | Auto-set (UTC) |
| updated_at | DateTime | Auto-updated (UTC) |

**refresh_tokens**
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer PK | Auto-increment |
| user_id | Integer FK → users.id | CASCADE DELETE |
| token_hash | String(255) | BCrypt hash of raw RT; indexed |
| expires_at | DateTime | RT expiry (30 days from issue) |
| revoked | Boolean | Default False |
| device_hint | String(100) | Nullable (User-Agent substring) |
| created_at | DateTime | Auto-set (UTC) |

### 4.4 Data Model — Phase 2 Modifications to Existing Tables

**expenses** — add column:
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | Integer FK → users.id | NOT NULL, CASCADE DELETE, indexed |

**categories** — add column:
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | Integer FK → users.id | NOT NULL, CASCADE DELETE, indexed |
| name | String(100) | No longer globally unique — unique per (name, user_id) |

**budgets** — add column:
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | Integer FK → users.id | NOT NULL, CASCADE DELETE, indexed |

**payment_methods** — **unchanged** (global, no user_id)

### 4.5 Database Migration Strategy (All Phases)

| Migration | Purpose |
|-----------|---------|
| `0001_initial_schema` | ✅ Creates `expenses`, `categories`, `payment_methods`, `budgets` tables |
| `0002_seed_payment_methods` | ✅ Inserts 5 predefined payment methods |
| `0003_seed_default_categories` | ✅ Seeds 10 default categories (global, later reassigned) |
| `0004_add_users_and_refresh_tokens` | **[NEW]** Creates `users` + `refresh_tokens` tables; inserts seed user for existing data |
| `0005_add_user_id_to_all_tables` | **[NEW]** Adds `user_id` FK to `expenses`, `budgets`, `categories`; backfills to seed user; makes NOT NULL; updates `categories` uniqueness constraint to `(name, user_id)` |

**Rules (unchanged from Phase 1):**
- Every migration must have a working `upgrade()` **and** `downgrade()`.
- Seed/reference data goes in migrations — never in application startup code.
- `alembic upgrade head` is a required step before every deployment.

### 4.6 API Endpoints — Phase 2 (New)

All new endpoints are mounted under `/api/v1/auth`.

| Method | Endpoint | Rate Limit | Auth Required | Description |
|--------|----------|------------|---------------|-------------|
| POST | `/api/v1/auth/register` | — | No | Create account (email + password). Issues AT + RT. |
| POST | `/api/v1/auth/login` | 5 req/min | No | Authenticate (email + password). Issues AT + RT. |
| GET | `/api/v1/auth/google/authorize` | — | No | Redirect to Google consent screen |
| GET | `/api/v1/auth/google/callback` | — | No | Google OAuth callback — issues AT + RT |
| POST | `/api/v1/auth/refresh` | — | No (uses RT cookie) | Rotate RT + issue new AT. Requires `X-CSRF-Token` header. |
| POST | `/api/v1/auth/logout` | — | No (uses RT cookie) | Revoke current session RT + clear cookie |
| POST | `/api/v1/auth/logout-all` | — | **Yes** (AT) | Revoke all RTs for authenticated user |
| GET | `/api/v1/auth/me` | — | **Yes** (AT) | Return current user profile |
| POST | `/api/v1/auth/forgot-password` | 3 req/min | No | Send password reset link to email |
| POST | `/api/v1/auth/reset-password` | — | No | Reset password via signed token |
| POST | `/api/v1/auth/change-password` | — | **Yes** (AT) | Change password (must provide current password) |

### 4.7 API Endpoints — Phase 1 (Modified for Auth)

All existing endpoints now require a valid Access Token. The `get_current_user` FastAPI dependency is injected into every route.

| Method | Endpoint | Change |
|--------|----------|--------|
| GET/POST | `/api/v1/categories` | + `current_user` dep → service filters by `user_id` |
| GET/PUT/DELETE | `/api/v1/categories/{id}` | + ownership assertion (403 if not owner) |
| GET | `/api/v1/payment-methods` | **No change** — payment methods are global |
| GET/POST | `/api/v1/budgets` | + `current_user` dep → service filters by `user_id` |
| GET/PUT/DELETE | `/api/v1/budgets/{id}` | + ownership assertion |
| GET/POST | `/api/v1/expenses` | + `current_user` dep → service filters by `user_id` |
| GET/PUT/DELETE | `/api/v1/expenses/{id}` | + ownership assertion (returns 403 if expense belongs to another user) |
| GET | `/api/v1/dashboard/*` | + `current_user` dep → all aggregations scoped to `user_id` |
| GET | `/health` | **No change** — remains public |

### 4.8 Ownership Enforcement Rules

The following logic is applied uniformly in **every Service method** that operates on a user-specific resource:

1. Fetch record from repository by `id`.
2. If record not found → `404 Not Found`.
3. If `record.user_id != current_user.id` → `403 Forbidden` (do not reveal existence).
4. Proceed with the operation.

> **Critical:** The `user_id` used for scoping is always derived from the validated JWT via `get_current_user`. It is **never trusted from the request body, query parameters, or URL path**.

---

## 5. Functional Requirements

*(Phase 1 requirements FR-1 through FR-35 are unchanged — see PRD Sections 7.1–7.9 for full detail.)*

### 5.1 Phase 2 — Authentication Functional Requirements

#### FR-42: User Registration
- **Input:** `display_name` (optional), `email` (required, valid format), `password` (required, min 8 chars)
- **Processing:**
  - Validate email not already registered → 409 Conflict if duplicate
  - Hash password with BCrypt (cost factor ≥ 12)
  - Create `User` record with `is_verified=False`
  - Seed 10 default categories for the new user
  - Issue AT + RT
- **Output:** `{ access_token, token_type, expires_in, csrf_token }` + RT in HttpOnly cookie

#### FR-43: User Login
- **Input:** `email`, `password`
- **Processing:**
  - Look up user by email → 401 if not found (generic error — do not distinguish "email not found" from "wrong password")
  - Verify BCrypt hash → 401 if mismatch
  - Check `is_active=True` → 403 if deactivated
  - Issue AT + RT
- **Output:** Same as FR-42

#### FR-44: Google Sign-In
- **Trigger:** Frontend navigates to `GET /api/v1/auth/google/authorize`
- **Processing:**
  - Backend redirects to Google's OAuth consent page
  - Google redirects to `GET /api/v1/auth/google/callback?code=...`
  - Backend exchanges `code` for tokens via Google's token endpoint (server-to-server — `authlib`)
  - Backend validates ID token — extracts verified `email` + `google_id`
  - Look up user by `google_id` → found: login as that user
  - Look up user by `email` (no google_id) → found: link google_id + login
  - Neither found → create new account (no password set), seed default categories
  - Issue AT + RT
- **Output:** Redirect to `FRONTEND_URL/?at=<AT>&csrf=<csrf_token>` (frontend stores AT in memory)

#### FR-45: Logout (single session)
- **Input:** RT cookie
- **Processing:** Hash raw RT → look up in DB → mark `revoked=True` → clear cookie
- **Output:** `{ message: "Logged out successfully" }`

#### FR-46: Logout All Sessions
- **Input:** AT (Authorization header)
- **Processing:** Validate AT → get `user_id` → mark ALL non-expired RTs for that user as `revoked=True` → clear cookie
- **Output:** `{ message: "Logged out from all devices" }`

#### FR-47 + FR-48: Forgot Password / Reset Password
- **Forgot:** `POST /auth/forgot-password { email }`
  - Look up user → if not found, return 200 anyway (don't leak existence)
  - Generate `itsdangerous` HMAC-signed token (1h TTL) containing `email`
  - Send email with `FRONTEND_URL/reset-password?token=<token>` (or log to console in dev)
- **Reset:** `POST /auth/reset-password { token, new_password }`
  - Verify token signature + TTL → 400 if invalid/expired
  - Hash new password → update `User.hashed_password`
  - Revoke all RTs for the user (force re-login everywhere)
  - Return 200

#### FR-49: Change Password
- **Input:** `{ current_password, new_password }` + AT
- **Processing:** Verify current BCrypt hash → hash new password → update DB
- **Output:** 200

#### FR-50: Automatic Token Refresh
- **Frontend implementation:**
  - On app load: call `POST /auth/refresh` once to check for valid RT (silent re-auth)
  - Set up `setInterval` to refresh every 12 minutes (before 15 min AT expiry)
  - On any API call returning 401: attempt one refresh → retry → if still 401 → logout
- **Backend implementation:** `POST /auth/refresh`
  - Verify CSRF double-submit cookie
  - Hash raw RT → look up in DB → verify not revoked + not expired
  - Mark old RT as revoked (rotation)
  - Issue new AT + new RT
  - Return new AT + set new RT cookie

#### FR-51: User Data Isolation
- **Rule:** Every database query for user-specific resources (expenses, budgets, categories) **must** include `WHERE user_id = :current_user_id`
- **Enforcement layer:** Services (business logic) and Repositories (queries) — both scoped
- **Error responses:**
  - No AT provided → 401 Unauthorized
  - Invalid/expired AT → 401 Unauthorized
  - Valid AT but resource belongs to another user → **403 Forbidden**
  - Resource not found for this user → **404 Not Found**
- **Never trust `user_id` from client input** — always derive from JWT claims

---

## 6. Security Requirements

### 6.1 Password Security
- BCrypt with cost factor ≥ 12 (via `passlib[bcrypt]`)
- Minimum password length: 8 characters (enforced in Pydantic schema)
- Plaintext passwords **never** stored, returned in API responses, or printed to logs
- Login failure response is intentionally generic — never distinguish "email not found" from "wrong password" to prevent user enumeration

### 6.2 JWT Security
- Algorithm: HS256
- Signing secret: `JWT_SECRET_KEY` from environment only — never hardcoded, never committed to Git
- Required claims in every AT: `sub` (user_id), `email`, `exp`, `iat`, `type: "access"`
- Validate on every protected request: signature, `exp`, `type` claim
- AT TTL: 15 minutes
- RT TTL: 30 days

### 6.3 Refresh Token Security
- RT is a cryptographically random 32-byte value (URL-safe base64)
- Only BCrypt hash of RT is stored in the database
- RT delivered in `HttpOnly; Secure; SameSite=Strict` cookie — inaccessible to JavaScript
- RT rotation on every use: old RT immediately revoked, new RT issued
- Revoked or expired RTs rejected with 401
- On password reset: all existing RTs for the user are revoked

### 6.4 CSRF Protection
- Risk: a malicious site can trigger the user's browser to send the RT cookie to `/auth/refresh`
- Mitigation: **Double-Submit Cookie Pattern**
  - Server sets a second cookie `csrf_token=<random>` (non-HttpOnly, SameSite=Strict)
  - Frontend reads this cookie and sends `X-CSRF-Token: <value>` header on every call to `/auth/refresh`
  - Backend verifies header value matches cookie value — a cross-origin site cannot read the cookie value

### 6.5 Rate Limiting
- `slowapi` middleware applied to:
  - `POST /auth/login` — **5 requests/minute** per IP
  - `POST /auth/forgot-password` — **3 requests/minute** per IP
- Response: HTTP 429 Too Many Requests with `Retry-After` header

### 6.6 Google OAuth Security
- Authorization code exchange happens **server-to-server** (backend → Google token endpoint)
- ID token validated server-side (signature, `aud` claim matches `GOOGLE_CLIENT_ID`, `exp`)
- User info (email, google_id) extracted from validated ID token only — **never from frontend-provided data**
- `state` parameter used in OAuth flow to prevent CSRF on the callback endpoint

### 6.7 CORS Configuration
- Development: `allow_origins` includes `http://localhost:3000`, `http://localhost:5173`
- Production: restrict to exact frontend origin only (not `*`)
- `allow_credentials=True` required for cookie-based refresh endpoint

### 6.8 Environment Variables — New in Phase 2

```env
# Backend .env additions

# JWT (REQUIRED)
JWT_SECRET_KEY=<minimum 32-char random string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth (optional — leave empty to disable Google Sign-In)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Frontend URL (for password reset emails)
FRONTEND_URL=http://localhost:3000

# SMTP — optional (if empty, token is printed to server console log in dev)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@fintrack.local
```

---

## 7. Frontend Auth Integration

### 7.1 AuthContext

`src/contexts/AuthContext.jsx` wraps the entire app and provides:

```js
{
  user,           // { id, email, display_name } or null
  accessToken,    // string or null — stored in memory only
  isLoading,      // true while checking session on mount
  isAuthenticated,// boolean
  login(email, password) → Promise<void>,
  register(display_name, email, password) → Promise<void>,
  logout() → Promise<void>,
  logoutAll() → Promise<void>,
  refreshToken() → Promise<string>,  // returns new AT
}
```

### 7.2 API Client Modifications (`src/api/client.js`)

- New `auth` namespace: `login`, `register`, `refresh`, `logout`, `logoutAll`, `me`, `forgotPassword`, `resetPassword`, `changePassword`
- All protected requests include `Authorization: Bearer <accessToken>` header (injected via `AuthContext`)
- Refresh endpoint uses `credentials: 'include'` to send RT cookie
- Refresh endpoint sends `X-CSRF-Token` header (read from non-HttpOnly `csrf_token` cookie)
- **401 interceptor:** on any 401, attempt silent refresh → retry original request → if still 401, call `logout()`

### 7.3 App Shell Logic (`src/App.jsx`)

```jsx
if (isLoading) → <FullPageSpinner />
if (!isAuthenticated) → <AuthPage />
else → <MainLayout />
```

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | API responses for list/dashboard endpoints return in reasonable time at realistic V1 data volumes |
| **Validation** | All input validation enforced server-side via Pydantic — client-side validation is UX-only |
| **API Documentation** | Every endpoint (including all `/auth/*`) visible and testable via Swagger UI at `/docs` |
| **Migrations** | Every schema change goes through an Alembic migration — no direct manual schema edits |
| **Data Integrity** | No hardcoded/dummy data anywhere |
| **Testability** | Each module independently testable via `pytest` + `TestClient` before deployment |
| **Scalability** | Schema and API structure must not block Phase 3 additions |
| **Reliability** | `/health` endpoint required for uptime verification |
| **Security** | BCrypt hashing, JWT validation, RT rotation, CSRF protection, rate limiting — all must be active before deployment |
| **HTTPS** | Required in production. `Secure` flag on RT cookie enforces this. |

---

## 9. Testing Requirements

### 9.1 Backend Test Coverage (Phase 2)

Extend `tests/test_api.py` to cover:

| Test Case | Expected |
|-----------|----------|
| `POST /auth/register` with valid data | 201, returns AT |
| `POST /auth/register` with duplicate email | 409 Conflict |
| `POST /auth/login` with correct credentials | 200, returns AT, sets RT cookie |
| `POST /auth/login` with wrong password | 401 (generic message) |
| `GET /auth/me` with valid AT | 200, returns user profile |
| `GET /auth/me` with expired AT | 401 |
| `GET /auth/me` with no token | 401 |
| `POST /auth/refresh` with valid RT cookie | 200, new AT, new RT cookie |
| `POST /auth/refresh` with revoked RT | 401 |
| `POST /auth/refresh` without CSRF header | 403 |
| `POST /auth/logout` | 200, RT revoked |
| `POST /auth/logout-all` | 200, all RTs revoked |
| `GET /api/v1/expenses` without AT | 401 |
| `GET /api/v1/expenses` with AT | 200, returns only own expenses |
| `GET /api/v1/expenses/{other_user_expense_id}` with valid AT | 403 |
| `POST /auth/login` × 6 in 1 min | 429 Too Many Requests |
| `POST /auth/forgot-password` × 4 in 1 min | 429 Too Many Requests |
| `POST /auth/reset-password` with valid token | 200, password changed |
| `POST /auth/reset-password` with expired token | 400 |
| `POST /auth/change-password` with wrong current password | 400 |
| Two users — User A can't see User B's categories/budgets | 403/404 |

### 9.2 Run Commands

```powershell
# Backend — run all tests
cd e:\FinTrack\fintrack-backend
.venv\Scripts\pytest -v tests/

# Backend — run only auth tests
.venv\Scripts\pytest -v tests/ -k "auth"

# Backend — run server
.venv\Scripts\uvicorn app.main:app --reload --port 8000

# Apply new migrations
.venv\Scripts\alembic upgrade head

# Frontend — dev server
cd e:\FinTrack\fintrack-frontend
npm run dev
```

---

## 10. Definition of Done (Phase 2 — Technical)

- `users` and `refresh_tokens` tables created via Alembic migration `0004`
- `user_id` FK added to `expenses`, `categories`, `budgets` via Alembic migration `0005`
- Existing pre-auth data backfilled to seed user — `alembic upgrade head` runs cleanly on production DB
- All `/auth/*` endpoints implemented and documented in Swagger UI (`/docs`)
- AT (15 min, HS256) issued on register/login/refresh/Google callback
- RT (30 days) issued as HttpOnly cookie — never returned in JSON body
- RT rotation active — old RT revoked on every `/auth/refresh` call
- Revoked/expired RTs rejected with 401
- BCrypt hashing verified — no plaintext passwords in DB or logs
- `JWT_SECRET_KEY` only in `.env` — not in any source file or git history
- All existing endpoints return 401 without AT
- All existing endpoints return only the authenticated user's data
- Cross-user access to resources by ID returns 403
- CSRF double-submit cookie verification active on `/auth/refresh`
- Rate limiting active on `/auth/login` (5/min) and `/auth/forgot-password` (3/min)
- Google Sign-In backend flow implemented (disable gracefully if `GOOGLE_CLIENT_ID` not set)
- Forgot/Reset password flow works (console fallback in dev)
- Frontend `AuthContext` manages AT in memory, RT never touched by JS
- Frontend auto-refresh running (every 12 min)
- Frontend 401 interceptor → silent refresh → retry → logout
- All Phase 2 test cases passing
- `alembic downgrade` works cleanly for both `0004` and `0005`

---

## 11. Out of Scope (Phase 2) — Technical

- RBAC / admin roles / permission tiers
- Two-factor authentication (2FA / TOTP)
- Multi-tenant shared accounts (Phase 4)
- Async task queues / background jobs
- Report export (PDF/Excel/CSV) — Phase 3
- Custom/editable payment methods — Phase 3
- Income tracking — Phase 3
