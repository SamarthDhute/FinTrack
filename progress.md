# FinTrack — Project Progress & Status Report

**Last Updated:** August 31, 2026  
**Status:** Phase 1 (MVP) ✅ Complete | Phase 2 (Authentication) ✅ Complete | Both Fully Tested

---

## 📌 Executive Summary

FinTrack is a secure personal expense tracking web application with JWT authentication and complete user data isolation:
- **Backend:** FastAPI + SQLAlchemy 2.x + PostgreSQL + Alembic + Pydantic v2 + SlowAPI + Authlib + BCrypt
- **Frontend:** React 18 + Vite + Vanilla CSS Design System + PWA + In-Memory Token Management

Both follow strict architectural boundaries. Backend enforces **Controller → Service → Repository → Model**. Frontend is fully integrated with HttpOnly refresh cookies, CSRF protection, silent token refreshing, and responsive UI.

---

## ✅ Completed Tasks

### Phase 1 (MVP) — Core Loop ✅
- [x] Full CRUD on expenses, dynamic categories, and budgets.
- [x] Predefined payment methods (Cash, Card, UPI, Net Banking, Wallet).
- [x] Dashboard with KPI metric cards, SVG donut, bar, and area trend charts.
- [x] Expense search, date/category/amount/payment-method multi-filter, sorting, and pagination.
- [x] Budget limits and live health calculation (on-track, near-limit, over-budget).
- [x] PWA offline caching and installation prompt.

### Phase 2 — Production-Ready Authentication ✅
- [x] **Database & Migrations:**
  - `0004_add_users_and_refresh_tokens.py`: Created `users` and `refresh_tokens` tables.
  - `0005_add_user_id_to_all_tables.py`: Added `user_id` FKs to `expenses`, `categories`, `budgets` with per-user unique category constraint `(name, user_id)`.
- [x] **Security Core:**
  - Native BCrypt password and refresh token hashing.
  - Short-lived HS256 JWT Access Tokens (15 min).
  - Long-lived Refresh Tokens (30 days) stored as hashes in DB, rotated on every refresh, delivered via `HttpOnly; SameSite=Lax` cookies.
  - Double-submit CSRF protection on refresh endpoint.
  - Signed password-reset tokens (1h TTL via `itsdangerous`) with dev console fallback & SMTP support.
  - SlowAPI rate limiting (5 req/min on `/auth/login`, 3 req/min on `/auth/forgot-password`).
- [x] **Data Isolation & Ownership:**
  - Injected `get_current_user` FastAPI dependency across all protected endpoints.
  - Enforced `WHERE user_id = :uid` on all queries and 403 Forbidden checks on cross-user resource access.
- [x] **Frontend Auth Integration:**
  - In-memory Access Token storage in `AuthContext.jsx` (never stored in localStorage).
  - Silent token refresh interval (every 12 mins) + automatic 401 interceptor & retry loop in `client.js`.
  - Glassmorphic `AuthPage.jsx` (Sign In / Register tabs, Google OAuth button), `ForgotPasswordPage.jsx`, and `ResetPasswordPage.jsx`.
  - Navbar user identity indicator and logout CTA.

---

## 📡 Active API Endpoints Reference

| Module | Method | Endpoint | Auth Required | Description |
|---|---|---|---|---|
| **System** | `GET` | `/health` | No | Health & uptime check |
| **Authentication** | `POST` | `/api/v1/auth/register` | No | Register new user + seed 10 default categories |
| | `POST` | `/api/v1/auth/login` | No (Rate limit: 5/min) | Login with email & password |
| | `POST` | `/api/v1/auth/refresh` | Cookie + CSRF | Silent refresh & rotate refresh token |
| | `POST` | `/api/v1/auth/logout` | Cookie | Logout current session |
| | `POST` | `/api/v1/auth/logout-all` | Bearer Token | Revoke all sessions across devices |
| | `GET` | `/api/v1/auth/me` | Bearer Token | Get current user profile |
| | `POST` | `/api/v1/auth/forgot-password` | No (Rate limit: 3/min) | Send password reset link |
| | `POST` | `/api/v1/auth/reset-password` | No | Reset password with signed token |
| | `POST` | `/api/v1/auth/change-password` | Bearer Token | Change password |
| | `GET` | `/api/v1/auth/google/authorize` | No | Google OAuth redirect |
| | `GET` | `/api/v1/auth/google/callback` | No | Google OAuth callback |
| **Categories** | `GET` | `/api/v1/categories` | Bearer Token | List user's categories with expense counts |
| | `POST` | `/api/v1/categories` | Bearer Token | Create new category for user |
| | `GET` | `/api/v1/categories/{id}` | Bearer Token | Get single category (scoped to user) |
| | `PUT` | `/api/v1/categories/{id}` | Bearer Token | Rename user's category |
| | `DELETE` | `/api/v1/categories/{id}` | Bearer Token | Delete category |
| **Payment Methods** | `GET` | `/api/v1/payment-methods` | No | List predefined payment methods |
| **Budgets** | `GET` | `/api/v1/budgets` | Bearer Token | List user's budgets with live spending status |
| | `POST` | `/api/v1/budgets` | Bearer Token | Set user's budget |
| | `PUT` | `/api/v1/budgets/{id}` | Bearer Token | Update user's budget limit |
| | `DELETE` | `/api/v1/budgets/{id}` | Bearer Token | Delete user's budget |
| **Expenses** | `GET` | `/api/v1/expenses` | Bearer Token | List user's expenses with filters |
| | `POST` | `/api/v1/expenses` | Bearer Token | Add new expense |
| | `GET` | `/api/v1/expenses/{id}` | Bearer Token | Get expense details (403 if not owner) |
| | `PUT` | `/api/v1/expenses/{id}` | Bearer Token | Edit expense (403 if not owner) |
| | `DELETE` | `/api/v1/expenses/{id}` | Bearer Token | Delete expense (403 if not owner) |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Bearer Token | User's total spend & recent expenses |
| | `GET` | `/api/v1/dashboard/charts/category` | Bearer Token | User's category spending chart |
| | `GET` | `/api/v1/dashboard/charts/payment-method` | Bearer Token | User's payment method chart |
| | `GET` | `/api/v1/dashboard/charts/trend` | Bearer Token | User's 30-day spending trend |

---

## 🧪 Test Suite Results

- **Backend Pytest (`tests/test_api.py`):** **7 / 7 PASSED (100%)**
  - Health check
  - Registration, duplicate check, and login
  - Refresh token rotation, CSRF validation, and single/all logout
  - Password management (forgot, reset, change)
  - Strict multi-user data isolation (User A vs User B)
  - Authenticated CRUD integration (expense, budget, dashboard reflection)
  - Unauthenticated 401 blocking
- **Frontend Production Build (`npm run build`):** **Built in 7.04s, 0 errors, PWA service worker generated.**

---

## 💡 Quick Start Commands

### Backend Server:
```powershell
cd e:\FinTrack\fintrack-backend
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
- Swagger UI Docs: `http://localhost:8000/docs`

### Backend Tests:
```powershell
cd e:\FinTrack\fintrack-backend
.venv\Scripts\pytest -v
```

### Frontend Dev Server:
```powershell
cd e:\FinTrack\fintrack-frontend
npm run dev
```
- App: `http://localhost:3000`
