# AGENTS.md — FinTrack

Rules for any AI coding agent (or contributor) working on this codebase. These apply to every task, every file, every session — no exceptions unless the user explicitly overrides one in the moment.

---

## 1. Architecture

- **Follow Controller → Service → Repository → Model architecture** for every feature (see SRS Section 3.3).
  - **Controller** — HTTP layer only. Receives request, validates shape via Pydantic schema, calls a Service, returns response. No business logic, no direct DB/SQLAlchemy calls.
  - **Service** — All business logic and validation rules live here. Never builds SQL/ORM queries directly — always calls a Repository.
  - **Repository** — All SQLAlchemy 2.x queries live here, and nowhere else. Synchronous `Session` only (no `async`/`await` — see SRS Section 3.1).
  - **Model** — SQLAlchemy ORM table definitions only. No query logic.
  - **Schema** — Pydantic request/response contracts only. Never touches the database.
- Every new entity/feature gets the same five files: `*_controller.py`, `*_service.py`, `*_repository.py`, model file, schema file — matching the existing `expense` structure.
- Do not collapse layers "for convenience" (e.g. querying the DB directly inside a Controller) even for a quick fix.

## 2. Secrets & Environment

- **Never hardcode secrets** — no DB passwords, API keys, tokens, or credentials in source code, config files, or comments. Read them from environment variables via `app/core/config.py` (backend) or the frontend's env loader.
- **Never commit or expose `.env` files, API keys, secrets, or credentials.**
  - Only `.env.example` (with placeholder values) is ever committed.
  - Before any commit, verify no real `.env`, key, or credential is staged.
  - If a secret is accidentally exposed (committed, printed in logs, pasted in chat), flag it immediately and treat it as compromised — don't just quietly remove it.

## 3. Database Changes

- **Never modify the database schema without a migration.** Every new table, column, constraint, or index change goes through an Alembic migration — no manual `CREATE TABLE`/`ALTER TABLE` against the database, in dev or production.
- Every migration must have a working `upgrade()` **and** `downgrade()`.
- Seed/reference data (e.g. predefined payment methods) is inserted via a migration, never hardcoded in application startup code.

## 4. Dependencies

- **Don't introduce a new dependency (library, package, service) without justification.** Before adding one:
  - State what problem it solves that the current stack (FastAPI, SQLAlchemy 2.x, Alembic, Uvicorn, Pydantic, PostgreSQL) doesn't already solve.
  - Confirm it doesn't duplicate something already in use.
  - Get explicit go-ahead before adding it to `requirements.txt` / `package.json`.

## 5. Git & Version Control

- **Don't commit or push without permission.** Prepare the change, show what will be committed, and wait for explicit approval before running `git commit` or `git push`.
- This applies even to small fixes, formatting changes, or "obvious" corrections.

## 6. Working Style

- **Break large tasks into small, verifiable steps.** Complete and verify one step before starting the next — don't chain multiple unverified changes together.
- **If a requirement is ambiguous or underspecified, ask a clarifying question instead of assuming.** Don't guess at business logic, field names, validation rules, or scope — especially anything touching money, data integrity, or schema.
- **Keep status updates concise.** Every update should cover only:
  - What was done
  - What's next
  - What needs input (if anything)
  - No filler, no restating the whole task history each time.

---

*This file governs agent behavior on the FinTrack codebase. It complements, and does not replace, the PRD and SRS — architecture, tech stack, and feature details live there.*
