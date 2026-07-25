# SEAL Hackathon Management System (SEAL-HMS)

A monorepo platform to manage the **SEAL (Software Engineering Agile League)** hackathon at FPT University HCMC: account & role management, event/track/round configuration, team registration, per-round submissions, multi-judge scoring, and ranking (round → event → chapter).

## What the system does

A hackathon at SEAL runs as a pipeline, and the system covers every stage of it:

```
Admin sets up an event          Students form teams        Track draw            Each round
(tracks, rounds, criteria)  ->  (leader + members)     ->  (balanced,        ->  (submit -> judges
                                                            random)              score -> promote)
                                                                                      |
Chapter leaderboard    <-  Event ranking / prizes  <-  Final round  <---------------- +
(year-long, 20/15/10)
```

- **Events** hold *tracks* (parallel problem statements) and *rounds* (sequential elimination stages). Every round must define its scoring criteria, weighted to 100%.
- **Teams** register for an event, get drawn into a track, and submit once per round. Only the team leader may submit or update.
- **Judges** score submissions against the round's criteria; a team's round score is the weighted average across judges.
- **Ranking** happens at three levels: per round (source of truth) → per event (derived) → per chapter (year-long aggregate).

## Two ideas worth knowing before reading the code

**1. Judge and Mentor are jobs, not accounts.** There are only four account roles — `ADMIN`, `STAFF`, `LECTURER`, `STUDENT`. A lecturer *becomes* a judge or a mentor by being assigned to a track or a team for one event (`AssignmentRole`). The same lecturer can judge Track A of one hackathon and mentor a team in another.

**2. Judging and mentoring the same teams is blocked.** A lecturer who mentors a team cannot judge the track that team competes in, and vice versa — enforced on all three paths that could create the conflict (assigning a judge, assigning a mentor, moving a team to another track).

---

## Tech Stack

### Backend (`/backend`)
- **Spring Boot 4.0.6** on **Java 21 (LTS)**
- **Spring Data JPA / Hibernate** over **PostgreSQL** (see "Why JPA" below)
- **Flyway** for versioned DB migrations (incl. `spring-boot-flyway` — required on Spring Boot 4)
- **Spring Security 7 + JWT** (stateless), BCrypt password hashing
- **springdoc-openapi** (springdoc 3.x) — Swagger UI at `/swagger-ui.html`, OpenAPI JSON at `/v3/api-docs`
- Lombok, Bean Validation

### Frontend (`/frontend`)
- **React 19 + Vite 8**, React Router 7, Axios, lucide-react icons
- **Vitest + React Testing Library** (jsdom) for component tests
- ESLint 9 (flat config) — `npx eslint .` is clean of errors

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
This only creates an **empty** `seal_hms` database. **Docker does not create the tables** — Flyway does, automatically when the backend first starts: it replays every migration from `V1__init_schema.sql` up to the current `V37`, ending with 23 tables.

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
│   │   ├── config/       # Security, JPA auditing, OpenAPI, AdminSeeder
│   │   ├── auth/         # login/register + JWT
│   │   ├── account/ student/ lecturer/ staff/      # accounts & profiles
│   │   ├── event/ round/ track/ topic/ criterion/  # event configuration
│   │   ├── team/ teammember/ trackassignment/      # teams, draw, judge/mentor jobs
│   │   ├── submission/ score/ roundranking/        # submit, grade, rank
│   │   └── chapter/ prize/ announcement/ auditlog/ # awards & comms
│   ├── src/main/resources/
│   │   ├── application.yml / application-dev.yml
│   │   └── db/migration/    # V1 … V37 (Flyway)
│   └── src/test/java/...    # 55 test classes, 492 tests
├── docs/                 # ARCHITECTURE, FEATURES, API, DEVELOPMENT_RULES, TEST_GITFLOW
└── frontend/             # React + Vite SPA (34 pages)
```

**22 feature packages · 18 entities · 20 controllers · 108 REST endpoints.**

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
- `backend/src/main/resources/db/migration/` — the Flyway migrations that build the schema, `V1__init_schema.sql` through `V37`. ⚠️ Never edit an already-applied migration — add the next `V38__…` instead, or Flyway's checksum validation fails for everyone.

---

## Actors & features

Full breakdown in **[docs/FEATURES.md](docs/FEATURES.md)**. At a glance:

| Actor | Account role | What they do |
|-------|--------------|--------------|
| **Admin** | `ADMIN` | Approve accounts, create/configure events (tracks, rounds, criteria), run the track draw, assign judges & mentors, manage chapters, advance rounds, award prizes |
| **Event Staff** | `STAFF` | Same event operations as Admin, but only for events they are assigned to |
| **Judge** | `LECTURER` + `JUDGE` assignment on a track | Score submissions of teams in that track against the round criteria, then mark scoring complete |
| **Mentor** | `LECTURER` + `MENTOR` assignment on a team | Chat with and support the assigned teams |
| **Student** | `STUDENT` | Register for an event, create or join a team (leader submits), view scores, view the chapter leaderboard |

## Quality

| | |
|---|---|
| Backend tests | **492 passing** (55 classes, JUnit 5 + Mockito) |
| Backend coverage | **96.9% line · 87.7% branch** (JaCoCo; DTOs/entities/config excluded) |
| Frontend tests | **18 passing** (Vitest + React Testing Library) |
| Lint | `npx eslint .` — **0 errors** |
| Migrations | Flyway V1 → V37, validated on every boot |

Run them:
```powershell
cd backend  ; .\mvnw verify        # tests + JaCoCo report -> target/site/jacoco/index.html
cd frontend ; npx vitest run ; npx eslint . ; npm run build
```

## Security decisions worth pointing out

Identity always comes from the JWT, never from the request body — several holes were closed on that principle:

- Only a team's **leader** may create or update its submission; members are read-only.
- A judge's identity is taken from the token, so a `judgeAccountId` in the body cannot be used to score as somebody else. A DB unique constraint `(submission_id, judge_account_id, criterion_id)` prevents double-scoring.
- Grading additionally requires the lecturer to be the **assigned judge for that submission's track**.
- Creating a team makes the caller the leader; only `ADMIN`/`STAFF` may nominate a different leader.
- Mentor chat is restricted to the team's own members and its assigned mentor.

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
