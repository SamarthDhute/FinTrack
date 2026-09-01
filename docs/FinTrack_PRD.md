# Product Requirements Document (PRD)
## FinTrack — Personal Expense Tracker

**Document Version:** 2.0
**Last Updated:** August 31, 2026
**Status:** Phase 1 (V1/MVP) ✅ Complete | Phase 2 (Authentication) 🔨 In Progress

---

## 1. Overview / Introduction

**Product Name:** FinTrack

**Summary:** FinTrack is a personal finance web app that lets a user log daily expenses, organize them into self-created categories, and instantly see the impact on totals, charts, and a live budget — turning scattered notes/spreadsheet habits into one simple, searchable place to track spending.

Authentication (Phase 2) extends this into a **secure, multi-account web application** where each user has a private, isolated view of their own data, protected by JWT-based authentication with Google Sign-In support.

---

## 2. Problem Statement

Most people don't track their expenses properly. They either forget to log them, or rely on tools like notes apps and spreadsheets that are hard to search, filter, or understand at a glance.

Because of this, they can't easily answer three simple questions:
- "How much have I spent?"
- "Where is my money going?"
- "Am I within my budget, or over it?"

FinTrack solves this by giving the user one simple place to log expenses and instantly see the impact on their total spending and budget.

**Phase 2 extends this** with a secure login system so users can access their personal expense history from any device, with full confidence that no one else can see or modify their data.

---

## 3. Why Keep V1 (MVP) Small?

V1 focuses only on the core loop:

> **Log an expense → See it reflected in totals & charts → Track budget left**

Phase 2 builds authentication on top of this validated core, following the same principle: implement one concern fully and correctly before moving to the next.

---

## 4. Goals

| Goal | Why It Matters |
|------|------------------|
| Add an expense in under 30 seconds | Easy logging = user actually keeps using it |
| Show spending visually | Helps the user understand "where money is going" without extra effort |
| Show a live remaining budget | Turns tracking into real budgeting, not just note-taking |
| Make old expenses easy to find | A log is useless if you can't search or filter it later |
| Build a scalable foundation | Later phases (Section 13) should not require rebuilding the core |
| **[Phase 2] Secure user accounts** | Each user's financial data is private, isolated, and accessible only to them |
| **[Phase 2] Seamless sign-in experience** | Google OAuth reduces friction — no new password required to get started |

**Success Metrics:**
- Number of expenses logged per active user per week
- % of users who set a budget goal
- Time taken to add a single expense (target: under 30 seconds)
- Search/filter usage frequency
- User retention after 30 days
- **[Phase 2]** Registration conversion rate (visited → registered)
- **[Phase 2]** Login success rate (no unauthorized data leakage incidents)

---

## 5. Target Audience

**Who this is for:**
- One person who wants to manually track their own personal spending
- Budget-conscious users trying to control overspending
- Users who want visual/report-based insight into where their money goes

**Not for (V1 / Phase 2):**
- Teams or families sharing one account
- Businesses
- Advanced investment/finance tracking

---

## 6. Scope

### Phase 1 (V1/MVP) — ✅ Complete

**✅ Implemented:**
- Full CRUD on expenses (Add / View / Edit / Delete)
- Categories the user creates and manages themselves
- Dashboard with total spend + charts (donut + bar + area/trend)
- Search, filter, and sort on expenses (usable together)
- Budget goal setting (overall + per-category) with live remaining-balance tracking
- Responsive navigation (hamburger menu: Dashboard, Expenses, Budgets, Categories)
- Field validation (positive amount, no future-dated expenses)
- Predefined Payment Method module (required field on every expense, dashboard breakdown)
- Empty, loading, and error states for all screens
- Single fixed currency display (₹ / INR, 2 decimal places)
- PWA support (offline banner, install prompt)

### Phase 2 (Authentication) — 🔨 In Progress

**✅ In-Scope (Phase 2):**
- User Registration (email + password)
- User Login / Sign In (email + password)
- Sign In with Google (OAuth 2.0 / OpenID Connect)
- Logout (single session)
- Logout from all devices / sessions
- Forgot Password (email-based reset link)
- Reset Password (via signed token)
- Change Password (when authenticated)
- Email verification on registration
- JWT-based authentication (short-lived Access Token + long-lived Refresh Token)
- Refresh Token rotation + server-side revocation
- Automatic silent token refresh in the frontend
- **User data isolation** — every user sees only their own data
- CSRF protection on cookie-based endpoints
- Rate limiting on login and password-reset endpoints
- Secure HttpOnly cookie storage for Refresh Token (never in localStorage)
- BCrypt password hashing (plaintext passwords never stored or logged)
- Google account linking (create account if new, link if email already exists)

**❌ Still Out-of-Scope (Phase 2):**
- RBAC / admin roles
- Two-factor authentication (2FA)
- Teams or family shared accounts
- Recurring or auto-scheduled expenses
- Multiple currencies
- Bank / UPI / SMS auto-import
- Income tracking
- Notifications / reminders
- Report export (PDF/Excel/CSV)

---

## 7. Functional Requirements & User Stories

### 7.1 Navigation

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR-1 | Hamburger menu with sections: **Dashboard**, **Expenses**, **Budgets**, **Categories** | P0 | As a user, I want a simple menu so I can move between sections easily. |
| **FR-40** | **When not authenticated, show a Login/Register screen instead of the main app** | **P0** | **As a new visitor, I want to see a login/register page so I can create an account or sign in.** |
| **FR-41** | **Navbar shows logged-in user's name/avatar and a Logout button** | **P0** | **As a logged-in user, I want to see my identity and be able to log out easily.** |

### 7.2 Expense Fields & Validation

When adding an expense, the user fills in:
- **Title** — short description (e.g. "Groceries")
- **Category** — dynamic; pick an existing one or create a new one (per-user in Phase 2)
- **Amount** — how much was spent (displayed as ₹ with 2 decimal places)
- **Date** — defaults to today, can be changed
- **Notes** (optional) — any extra detail
- **Payment Method** (required) — chosen from a predefined list

| Validation Rule | Why |
|------------------|-----|
| Amount must be a positive number | Prevents bad data from skewing totals and charts |
| Date cannot be in the future | Keeps the log honest to actual spending |
| Title is required, max 50 characters | Keeps expense list scannable |
| Payment Method is required | Ensures every expense can be broken down by payment method |

### 7.3 Expense CRUD

| ID | Action | Description | Priority | User Story |
|----|--------|--------------|----------|------------|
| FR-2 | Add | Create a new expense entry | P0 | As a user, I want to quickly add an expense so that logging spending doesn't feel like a chore. |
| FR-3 | View | See all logged expenses in a paginated list | P0 | As a user, I want to view my past expenses so I can review my spending history. |
| FR-4 | Edit | Update any field of an existing expense | P0 | As a user, I want to edit my past expenses so my records stay accurate. |
| FR-5 | Delete | Remove an expense, with a confirmation step | P0 | As a user, I want to delete an expense (with confirmation) so I don't lose data by accident. |

### 7.4 Category Management

Categories are dynamic — the user builds their own list. **Phase 2: Categories are per-user — each user has their own independent list.**

| ID | Action | Description | Priority | User Story |
|----|--------|--------------|----------|------------|
| FR-6 | Create | Add a new category by name while logging an expense, or from the category list | P0 | As a user, I want to create my own categories so my spending is organized the way I actually think about it. |
| FR-7 | Edit | Rename an existing category | P0 | As a user, I want to rename a category so I can keep my organization consistent over time. |
| FR-8 | Delete | Remove a category — only if unused, or cascade linked expenses with a warning | P0 | As a user, I want to safely delete a category without accidentally losing expense data. |
| FR-9 | View | See the list of categories along with how many expenses use each one | P1 | As a user, I want to see how many expenses are in each category so I understand my category usage. |
| FR-10 | Default Categories | Ship with 10 common starter categories per new user on registration | P2 | As a new user, I want to see some starter categories so the app feels usable from day one. |

### 7.4-A Payment Method Management

Payment Method is a **predefined, fixed list** (not user-editable in V1/Phase 2) and is **required** on every expense.

**Predefined list:** Cash, Card, UPI, Net Banking, Wallet

| ID | Action | Description | Priority | User Story |
|----|--------|--------------|----------|------------|
| FR-31 | Predefined List | Ship with a fixed list of payment methods | P0 | As a user, I want ready-made payment method options so I don't have to set anything up. |
| FR-32 | Required Assignment | Every expense must have a payment method before it can be saved | P0 | As a user, I want payment method to always be captured so my breakdown by method is complete. |
| FR-33 | View | See the list of payment methods along with how many expenses use each one | P1 | As a user, I want to see how many expenses fall under each payment method. |
| FR-34 | Dashboard Breakdown | Dashboard shows a chart of total spend by payment method | P0 | As a user, I want to see how much I spend via Cash vs Card vs UPI. |

### 7.5 Search, Filter & Sort

| ID | Capability | Details | Priority | User Story |
|----|------------|---------|----------|------------|
| FR-11 | Search | By title or notes text | P1 | As a user, I want to search my expenses by title or note so I can quickly find a specific transaction. |
| FR-12 | Filter — Date Range | e.g. this week, this month | P0 | As a user, I want to filter expenses by date range so I can review a specific period. |
| FR-13 | Filter — Category | Isolate spend on a specific category | P0 | As a user, I want to filter by category so I can see how much I spent in one area. |
| FR-14 | Filter — Amount Range | Narrow down to a spend bracket | P1 | As a user, I want to filter by amount range to find larger or smaller transactions. |
| FR-15 | Filter — Payment Method | Filter by payment method | P1 | As a user, I want to filter by payment method so I can see how I paid for things. |
| FR-16 | Sort | By amount, date, or category | P1 | As a user, I want to sort my expenses to quickly scan the highest, most recent, or grouped entries. |

### 7.6 Dashboard

| ID | Requirement | Why | Priority | User Story |
|----|-------------|-----|----------|------------|
| FR-17 | Total amount spent (overall, and current month) | The single most-asked question: "how much did I spend?" | P0 | As a user, I want to see my total spend so I immediately know where I stand. |
| FR-18 | Quick view of recent expenses | Snapshot without opening the full list | P0 | As a user, I want to see my recent expenses on the dashboard. |
| FR-19 | Donut chart — spending by category | Instantly shows where money is going | P0 | As a user, I want to see a category breakdown chart. |
| FR-20 | Area/line chart — spending over time | Reveals patterns and spikes | P0 | As a user, I want to see my spending trend over time. |
| FR-21 | Budget status vs goal | Turns the dashboard into a budgeting tool | P0 | As a user, I want to see my budget status on the dashboard. |
| FR-22 | Daily/Weekly/Monthly report views | Analyze spending across different time periods | P0 | As a user, I want to view my expenses broken down by day, week, and month. |
| FR-23 | Month-over-month comparison with % change | Tells the user if they're improving | P1 | As a user, I want to compare this month to last month. |
| FR-24 | Top categories by spend, ranked | Surfaces the biggest spending areas | P1 | As a user, I want to see my top spending categories. |
| FR-25 | Average daily/weekly spend | Gives a normalized sense of spending pace | P2 | As a user, I want to see my average spend. |
| FR-35 | Payment method breakdown chart | Shows which payment method the user relies on most | P0 | As a user, I want to see my spending split by payment method. |

### 7.7 Budget / Spending Goal

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR-26 | Set an overall monthly budget goal and per-category budget limits | P0 | As a user, I want to set a budget goal so I can catch overspending early. |
| FR-27 | Live remaining-balance tracking as expenses are added | P0 | As a user, I want to see my remaining budget update live. |
| FR-28 | Alert/status indicator when nearing or exceeding a limit | P1 | As a user, I want to be warned when I'm close to or over a budget limit. |

### 7.8 Authentication (Phase 2)

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| **FR-42** | **User Registration with email + password** | **P0** | **As a new user, I want to create an account with my email so I can securely store my expenses.** |
| **FR-43** | **User Login with email + password** | **P0** | **As a returning user, I want to log in with my email and password to access my data.** |
| **FR-44** | **Sign In with Google (OAuth 2.0)** | **P0** | **As a user, I want to sign in with my Google account so I don't need a new password.** |
| **FR-45** | **Logout (single session)** | **P0** | **As a user, I want to log out so my session is securely ended on this device.** |
| **FR-46** | **Logout from all devices** | **P1** | **As a user, I want to log out from all devices so I can revoke access if my device is lost.** |
| **FR-47** | **Forgot Password — email-based reset** | **P0** | **As a user who forgot their password, I want to receive a reset link by email.** |
| **FR-48** | **Reset Password via signed token** | **P0** | **As a user, I want to set a new password securely using a time-limited link.** |
| **FR-49** | **Change Password while authenticated** | **P1** | **As a logged-in user, I want to change my password without logging out.** |
| **FR-50** | **Automatic silent token refresh** | **P0** | **As a user, I want my session to stay active without being interrupted by unexpected logouts.** |
| **FR-51** | **User data isolation — own data only** | **P0** | **As a user, I want to be absolutely certain no one else can see or modify my expenses, budgets, or categories.** |

### 7.9 Data Export (Nice-to-Have)

| ID | Requirement | Why | Priority | User Story |
|----|-------------|-----|----------|------------|
| FR-29 | Export expenses (filtered or full) as CSV/PDF/Excel | Backup and analysis outside the app | P2 | As a user, I want to export my expenses so I can back them up or analyze them outside the app. |

### 7.10 Data Integrity Principle

| ID | Requirement | Priority | User Story |
|----|-------------|----------|------------|
| FR-30 | No hardcoded/demo data at any stage — all data is dynamically created, stored, and fetched from the real data layer | P0 | As a new user, I want to see an honest empty state built from real, dynamically generated data. |

---

## 8. Key User Flows

| Flow | Steps |
|------|-------|
| 🟢 Register | Auth page → Register tab → Enter name + email + password → Account created → 10 default categories seeded → Redirected to Dashboard |
| 🟢 Login | Auth page → Login tab → Enter email + password → Access Token issued → Dashboard loaded |
| 🟢 Google Sign-In | Auth page → "Sign in with Google" → Google consent screen → Callback → Account created/linked → Dashboard loaded |
| 🟢 Forgot Password | Login page → "Forgot Password?" → Enter email → Check email (or server log in dev) → Click reset link → Enter new password → Login |
| 🟢 Add an expense | Expenses → Add New → Fill form (pick or create a category) → Save → Expense appears in list, dashboard totals update |
| 🟢 Check spending | Dashboard → See total spent, charts, and budget status |
| 🟢 Find a past expense | Expenses → Search / Filter / Sort → Find it → Edit or Delete |
| 🟢 Set a budget goal | Set spending limit → Dashboard shows remaining balance, updates live as expenses are added |
| 🟢 Logout | Navbar → Logout → Session revoked → Redirected to Auth page |

---

## 9. Non-Functional Requirements

- **Performance:** Dashboard and reports must load with real, database-driven data (no hardcoded/static values) at any data volume.
- **Scalability:** Architecture should support later phases (Section 13) without major rework.
- **Data Integrity:** No hardcoded or dummy data in any phase — see Section 9.1.
- **Testability:** Every feature/module must be independently testable before deployment.
- **Reliability:** Each phase must be fully functional (run → test → deploy) before the next phase begins.
- **[Phase 2] Security:**
  - BCrypt for password hashing — plaintext passwords never stored, logged, or returned in responses.
  - JWT secrets stored in environment variables only — never hardcoded, never committed to Git.
  - Access Tokens: HS256-signed, 15-minute TTL.
  - Refresh Tokens: 30-day TTL, stored as BCrypt hash in DB, rotated on every use.
  - Refresh Token delivered via `HttpOnly; Secure; SameSite=Strict` cookie — never exposed to JavaScript.
  - CSRF double-submit cookie protection on all cookie-based endpoints.
  - Rate limiting: 5 requests/minute on `/auth/login`, 3 requests/minute on `/auth/forgot-password`.
  - Google token validation performed server-side only — no client-provided Google tokens trusted.
  - All user-specific resources (expenses, budgets, categories) scoped to the authenticated user in every query.
  - **401** for unauthenticated requests, **403** for authenticated-but-unauthorized (e.g. accessing another user's expense by ID).
- **[Phase 2] HTTPS:** Required in production. All sensitive cookies (`Secure` flag) enforce this.
- **[Phase 2] CORS:** Restricted to known frontend origins in production.
- **Deployment (V1/Phase 2):** Local or private deployment.

### 9.1 Development Principle (Applies to All Phases)

> **No hardcoded/dummy data in any phase.** All data (expenses, categories, budgets, reports) must be dynamically created, stored, and fetched from the actual data layer (database/API), even in early phases. Every phase must independently follow the **Run → Test → Deploy** cycle before moving to the next phase.

---

## 10. Definition of Done

### Phase 1 (V1/MVP) — ✅ Complete
- User can Add, View, Edit, and Delete expenses
- Categories are dynamic — user can create, edit, and delete their own
- Dashboard shows total spend, a recent-expenses snapshot, and 3 charts (donut, bar, area)
- Expenses section supports search + filters + sort options, usable together
- User can set a budget goal and see a live remaining balance with status (on track/near limit/over budget)
- Navigation works between Dashboard, Expenses, Budgets, and Categories
- Amount and date fields are validated (positive amount, no future dates)
- Every expense has a required Payment Method (from the predefined list)
- No hardcoded/demo data anywhere
- Deployed and tested end-to-end

### Phase 2 (Authentication) — 🔨 In Progress
- User can register, login, and logout securely
- Google Sign-In works via OAuth 2.0 backend callback flow
- Forgot Password / Reset Password flow works (console fallback in dev, SMTP in prod)
- Change Password works for authenticated users
- Access Token (15 min) + Refresh Token (30 days, HttpOnly cookie) issued on login/register
- Refresh Token rotates on every use; revoked tokens are rejected
- Logout revokes the current session's Refresh Token
- Logout-all revokes all Refresh Tokens for the user
- All existing APIs (expenses, budgets, categories, dashboard) require a valid Access Token
- Each API returns only data belonging to the authenticated user
- Accessing another user's resource by ID returns 403
- CSRF protection active on all cookie-using endpoints
- Rate limiting active on login and forgot-password endpoints
- Passwords are BCrypt-hashed; plaintext never stored or returned
- JWT secret is environment-variable-only
- All tests passing (registration, login, Google flow, data isolation, token lifecycle)

---

## 11. Assumptions & Risks

**Assumptions:**
- One fixed currency (₹ INR) — no multi-currency support in V1/Phase 2
- Budget goal defaults to monthly
- Expense date should be today or earlier (not future-dated)
- Local or private deployment for V1/Phase 2
- Payment Method list is fixed/predefined (Cash, Card, UPI, Net Banking, Wallet)
- Categories are per-user in Phase 2 — each user has an isolated list with 10 default starters on registration
- Existing pre-Phase-2 data (if any) will be assigned to a seed user via Alembic migration — no data lost

**Risks:**
- Google OAuth setup requires manual console.cloud.google.com configuration by the developer
- Email delivery (password reset) in production requires an SMTP provider — console fallback used in dev
- CSRF tokens add a small amount of frontend complexity (must pass `X-CSRF-Token` header on cookie-based calls)
- Refresh Token rotation means a race condition is possible on concurrent requests — handled by DB-level uniqueness on token hash
- Scope creep if later-phase features get pulled into Phase 2

---

## 12. Stakeholders

- Product Owner
- Development Team
- QA/Testing Team
- End Users (primary feedback source for each phase)

---

## 13. Future Scope — Phase-wise Roadmap

| Phase | Theme | Features | Run-Test-Deploy Requirement |
|-------|-------|----------|------------------------------|
| **Phase 1 (V1 / MVP)** ✅ | Core Loop | Full expense CRUD, dynamic categories, dashboard with charts, search/filter/sort, budget goal with live balance, navigation | Build with live data layer, unit + integration test, deploy as standalone working app |
| **Phase 2 (Auth)** 🔨 | Login, Security & Sync | JWT auth (register/login/logout), Google OAuth, refresh token rotation, user data isolation, forgot/reset password, CSRF protection, rate limiting | Each feature tested against real stored data, deployed as an update to Phase 1 app |
| **Phase 3** | Convenience & Export | Income tracking, recurring expenses (rent, subscriptions, EMI), receipt photo upload, custom/editable payment methods, multiple wallets/accounts, report export (PDF/Excel/CSV) | Each feature tested against real stored data, deployed as an update to Phase 2 app |
| **Phase 4** | Social/Sharing | Split expenses (roommates/friends), shared budgets, multi-user/family accounts | Multi-user data flow tested for accuracy before deployment |
| **Phase 5** | Smart & Advanced | Savings goals, multi-currency support, AI-based spend prediction, auto-categorization, bank/UPI/SMS auto-import, budget notifications, calendar heatmap, year-view trends | AI/ML and integration modules tested independently, then deployed with monitoring |
| **Phase 6** | Security & Personalization | Biometric lock, 2FA, cloud backup, custom themes, reminders/notifications | Security features tested for edge cases before deployment |
| **Phase 7** | Monetization | Free vs Premium plans, ads (free tier) | Payment/subscription flow tested in sandbox before production deployment |

---

## 14. Dependencies

- Database/backend for persistent storage of expenses, categories, budgets
- **[Phase 2]** JWT library (`python-jose`) for token signing and validation
- **[Phase 2]** `passlib[bcrypt]` for password hashing
- **[Phase 2]** `authlib` for Google OAuth 2.0 client
- **[Phase 2]** `slowapi` for rate limiting
- **[Phase 2]** `itsdangerous` for signed password-reset tokens
- **[Phase 2]** Google Cloud Console OAuth 2.0 credentials (developer must configure)
- **[Phase 2]** SMTP provider for password-reset emails in production (console fallback for dev)
- Export library for CSV/PDF/Excel (Phase 3)
- Notification system (budget alerts, reminders — Phase 6)
- Payment gateway (Phase 7, for premium plans)

---

## 15. Timeline (Illustrative — to be finalized with dev team)

| Phase | Status | Estimated Duration |
|-------|--------|----------------------|
| Phase 1 (V1 / MVP) | ✅ Complete | — |
| Phase 2 (Authentication) | 🔨 In Progress | To be defined based on team capacity |
| Phase 3 | 🔜 Planned | To be defined post Phase 2 review |
| Phase 4 | 🔜 Planned | To be defined post Phase 3 review |
| Phase 5 | 🔜 Planned | To be defined post Phase 4 review |
| Phase 6 | 🔜 Planned | To be defined post Phase 5 review |
| Phase 7 | 🔜 Planned | To be defined post Phase 6 review |

*Note: Each phase's timeline should only be finalized after the previous phase is successfully run, tested, and deployed.*
