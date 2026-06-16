# SEAL Hackathon Management System (SEAL-HMS)

A monorepo platform to manage the **SEAL (Software Engineering Agile League)** hackathon at FPT University HCMC: account & role management, event/track/round configuration, team registration, per-round submissions, multi-judge scoring, and ranking (round → event → chapter).

---

## Tech Stack

### Backend (`/backend`)
- **Spring Boot 4.0.6** on **Java 21 (LTS)**
- **Spring Data JPA / Hibernate** over **PostgreSQL** (see "Why JPA" below)
- **Flyway** for versioned DB migrations (incl. `spring-boot-flyway` — required on Spring Boot 4)
- **Spring Security 7 + JWT** (stateless), BCrypt password hashing
- **springdoc-openapi** (Swagger UI) — ⚠️ TODO: not wired yet, the dependency is commented out in `pom.xml` pending a Spring Boot 4-compatible springdoc version
- Lombok, Bean Validation

### Frontend (`/frontend`)
- **React 18 + Vite**, React Router, Axios
- ESLint + Prettier

> **Switching Java 21 → 25:** the team assessment lists Java 25 (also an LTS with first-class Spring Boot 4 support). To switch, change `<java.version>` in `backend/pom.xml`. We default to 21 for the widest tooling support across machines.

---

## Design decisions
- **JPA, not raw JDBC.** ~18 related entities; JPA removes boilerplate and maps relationships cleanly. Every `@Entity` needs an `@Id` — which is why every table, including the `team_member` junction, has a primary key.
- **PostgreSQL.** Strong relational features; swappable to MySQL by changing the driver, URL, and Hibernate dialect.
- **Package-by-feature**, not package-by-layer — easier to split work without merge collisions.
- **Three ranking levels:** `RoundRanking` (per round, source of truth) → `Team.eventScore`/`eventRank` (per hackathon, derived) → Chapter ranking (year-long aggregate + `bonusPoint`). Derived values come from a `RankingService`, never edited by hand.

---

## Getting Started

### Prerequisites
- **JDK 21** (Temurin) · **Node.js 20+** · **Git**
- **Docker Desktop** (recommended — everyone gets the same PostgreSQL 18). A local PostgreSQL 18 also works.

### 1. Environment files (do this first)
Three **gitignored** env files drive the app. Each teammate creates their own from `.env.example`; they are **never committed** (they hold secrets).

| File | Read by | Keys that matter |
|------|---------|------------------|
| `.env` (repo root) | `docker-compose` (the DB container) | `DB_*` |
| `backend/.env.properties` | Spring Boot backend | `DB_*`, `JWT_*` |
| `frontend/.env.local` | Vite frontend | `VITE_API_BASE_URL` |

Create them — **PowerShell (Windows):**
```powershell
copy .env.example .env
copy .env.example backend\.env.properties
copy .env.example frontend\.env.local
```
(macOS/Linux: use `cp` instead of `copy`.)

**Two rules so the backend can reach the database:**
1. `DB_PASSWORD` must be **identical** in `.env` and `backend/.env.properties`.
2. If a **local PostgreSQL already uses port 5432**, set `DB_PORT=5433` in **both** files. docker-compose then maps host `5433` → container `5432`, so the Docker DB won't clash. (See [Troubleshooting](#troubleshooting-local-setup).)

### 2. Start the database (Docker — recommended)
```powershell
docker compose up -d        # postgres:18 on the host port from DB_PORT (5432 or 5433)
```
This only creates an **empty** `seal_hms` database. **Docker does not create the tables** — Flyway does, automatically when the backend first starts (it runs `backend/src/main/resources/db/migration/V1__init_schema.sql` → 18 tables).

> Prefer a local PostgreSQL? Create the DB once (`CREATE DATABASE seal_hms;`) and point `backend/.env.properties` at it.

### 3. Run
```powershell
# Backend  ->  http://localhost:8080
cd backend
.\mvnw spring-boot:run

# Frontend ->  http://localhost:5173   (second terminal)
cd frontend
npm install
npm run dev
```
On first backend start the log should show `Migrating schema "public" to version "1"` then `Started SealHmsApplication`. Verify the tables:
```powershell
docker exec seal-hms-postgres psql -U postgres -d seal_hms -c "\dt"
```

> The Maven wrapper (`backend/mvnw`, `mvnw.cmd`, `.mvn/`) is committed, so `.\mvnw` works without a local Maven install.

---

## Repository Structure
```text
SEAL-HMS/
├── docker-compose.yml    # PostgreSQL 18 for local dev (shared by the team)
├── .env.example          # copy -> .env, backend/.env.properties, frontend/.env.local
├── .gitattributes        # normalize line endings (keeps mvnw LF on all OSes)
├── backend/              # Spring Boot API (JPA + PostgreSQL)
│   ├── mvnw, mvnw.cmd, .mvn/     # Maven wrapper (committed)
│   ├── src/main/java/com/fpt/seal/hms/
│   │   ├── common/       # BaseEntity, ApiResponse, exceptions, enums
│   │   ├── config/       # Security, JPA auditing, OpenAPI
│   │   ├── auth/         # login/register + JWT
│   │   ├── account/      # SAMPLE feature (entity→repo→service→controller)
│   │   └── (event, team, submission, judging, ranking, ... = TODO)
│   ├── src/main/resources/
│   │   ├── application.yml / application-dev.yml
│   │   └── db/migration/V1__init_schema.sql
│   └── pom.xml
├── docs/                 # ARCHITECTURE.md, DEVELOPMENT_RULES.md
└── frontend/             # React + Vite SPA
```

---

## Key files & folders — what each is for (read this!)

New to the repo? Here is what the important scaffolding files do and **why they exist**, so nobody deletes one by mistake.

### Environment files — there are **two** DB config files *on purpose*
| File | Who reads it | What it holds | Committed? |
|------|--------------|---------------|-----------|
| `.env` (repo root) | **docker-compose** | DB name/user/password + host port → builds the Postgres **container** | ❌ gitignored |
| `backend/.env.properties` | **Spring Boot** (via `application.yml` → `config.import`) | DB connection (`DB_*`) **+ `JWT_SECRET`** → how the **backend connects** | ❌ gitignored |
| `frontend/.env.local` | **Vite** | `VITE_API_BASE_URL` (where the API lives) | ❌ gitignored |
| `.env.example` | you | the template you copy the 3 files above from | ✅ committed |

> ⚠️ **Do NOT delete `backend/.env.properties` just because `.env` exists.** They feed **different programs**: `.env` configures the *database container*, `.env.properties` tells the *backend* how to connect (and holds the JWT secret). docker-compose never reads the backend file, and Spring never reads the root `.env`. The `DB_PASSWORD` must be **identical** in both. All env files are gitignored — every member creates their own from `.env.example`.

### Maven wrapper — `mvnw`, `mvnw.cmd`, `.mvn/`
Lets anyone build/run the backend **without installing Maven manually**. `mvnw` = macOS/Linux, `mvnw.cmd` = Windows. Running `.\mvnw spring-boot:run` auto-downloads the exact Maven version pinned in `.mvn/wrapper/maven-wrapper.properties`, so the whole team uses the same version. **These are committed on purpose** — always use `.\mvnw`, not a separately-installed `mvn`.

### `.gitattributes` — line-ending safety
Forces consistent line endings in Git. Most importantly it keeps `mvnw` (a shell script) as **LF**; otherwise Windows would save it as CRLF and `./mvnw` would fail with `bad interpreter` for teammates on macOS/Linux. Leave it as-is.

### `.gitignore` — what never gets pushed to GitHub
Excludes build output (`target/`, `node_modules/`), **all secret/env files** (`.env`, `*.env.properties`, `.env.local`), IDE folders (`.idea/`, `.vscode/`), logs, and local tooling (`.claude/`, `.worktrees/`, `*.orig`). If you create a file that shouldn't be shared, add it here.

### Other important files
- `docker-compose.yml` — defines the PostgreSQL 18 container (the shared dev database).
- `backend/pom.xml` — backend dependencies (Spring Boot, JPA, Flyway + `spring-boot-flyway`, JWT…).
- `backend/src/main/resources/application.yml` — Spring config (datasource, JPA `validate`, Flyway, JWT). `application-dev.yml` adds verbose SQL logging for the `dev` profile.
- `backend/src/main/resources/db/migration/V1__init_schema.sql` — the Flyway migration that **creates the 18 tables**. ⚠️ Never edit an already-applied migration — add a new `V2__…`, `V3__…` instead.

---

## Git workflow
Full rules in **[CONTRIBUTING.md](CONTRIBUTING.md)**. In short:
- Branches: `main` (stable) · `develop` (integration) · `feature/*` · `release/*` · `hotfix/*`.
- Branch a feature off **`develop`**, open a PR back into `develop`, get **1 review**, then merge.
- Commits: `<type>(<scope>): <description>` — e.g. `feat(auth): add login endpoint`.
- Before pushing: `cd backend && .\mvnw verify` and `cd frontend && npm run build` pass locally.
- Protect **`main`** and **`develop`** (Settings → Branches): require a PR + 1 approval.

No CI/CD by design — focus on the core business flow; verify locally before pushing.

---

## Troubleshooting (local setup)

**`FATAL: database "seal_hms" does not exist` even though Docker is up**
You probably have a **native PostgreSQL** on Windows holding port **5432**, which shadows the Docker container (the backend hits the native one). Check: `Get-NetTCPConnection -LocalPort 5432`. Fix: run the Docker DB on **5433** — set `DB_PORT=5433` in **both** the root `.env` and `backend/.env.properties`, then `docker compose down; docker compose up -d`. (Or stop the native service: `Stop-Service postgresql-x64-18`.)

**`password authentication failed for user "postgres"`**
Root `.env` and `backend/.env.properties` must use the **same** `DB_PASSWORD`. Postgres only applies the password on first init — if you change it after the volume exists, recreate it: `docker compose down -v; docker compose up -d`.

**Flyway doesn't run / `Schema-validation: missing table [account]`**
Spring Boot 4 split auto-configuration into per-tech modules, so `flyway-core` alone does **not** run migrations — `pom.xml` must also include `org.springframework.boot:spring-boot-flyway` (already added). Without it the migration is silently skipped and Hibernate `validate` then fails on the missing tables.

**In pgAdmin I don't see the tables**
Connect to the **Docker** server: host `localhost`, port = your `DB_PORT` (e.g. **5433**), then open database **`seal_hms`** → Schemas → public → Tables. A native-PostgreSQL connection on **5432** is a *different* server and won't contain `seal_hms`.

## License
Private, academic use — Software Engineering Dept., FPT University HCMC.
