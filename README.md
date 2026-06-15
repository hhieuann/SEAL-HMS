# SEAL Hackathon Management System (SEAL-HMS)

A monorepo platform to manage the **SEAL (Software Engineering Agile League)** hackathon at FPT University HCMC: account & role management, event/track/round configuration, team registration, per-round submissions, multi-judge scoring, and ranking (round → event → chapter).

---

## Tech Stack

### Backend (`/backend`)
- **Spring Boot 4.0.6** on **Java 21 (LTS)**
- **Spring Data JPA / Hibernate** over **PostgreSQL** (see "Why JPA" below)
- **Flyway** for versioned DB migrations
- **Spring Security 7 + JWT** (stateless), BCrypt password hashing
- **springdoc-openapi** (Swagger UI) — ⚠️ TODO: not wired yet, the dependency is commented out in `pom.xml` pending a Spring Boot 4-compatible springdoc version
- Lombok, Bean Validation

### Frontend (`/frontend`)
- **React 18 + Vite**, React Router, Axios
- ESLint + Prettier

> **Switching Java 21 → 25:** the team assessment lists Java 25 (also an LTS with first-class Spring Boot 4 support). To switch, change `<java.version>` in `backend/pom.xml`. We default to 21 because it has the widest tooling/library support across machines.

---

## Design decisions (and where we differ from other teams)
- **JPA, not raw JDBC.** Our DB has ~18 related entities. JPA removes huge amounts of boilerplate, maps relationships cleanly, and (crucially) every `@Entity` needs an `@Id` — which is why every table, including the `team_member` junction, has a primary key. Raw JDBC gives more control but far more hand-written SQL and bug surface; not worth it for a CRUD-heavy management app.
- **PostgreSQL.** Strong relational features; swappable to MySQL by changing the driver, URL, and Hibernate dialect.
- **Package-by-feature**, not package-by-layer — easier to split work across the team without merge collisions.
- **Three ranking levels are distinct:** `RoundRanking` (per round, source of truth) → `Team.eventScore`/`eventRank` (per hackathon, derived) → Chapter ranking (year-long aggregate + `bonusPoint`). Derived values are computed in a `RankingService`, never edited by hand.

---

## Getting Started

### Prerequisites
- **JDK 21** (Temurin)
- **Node.js 20+**
- **PostgreSQL 18** — or just run it via Docker (recommended, see below)
- **Git** (+ **Docker** if you use the containerized database)

### 1. Environment
Copy the template to all three places (same values everywhere so they match):
```bash
cp .env.example .env                        # used by docker-compose
cp .env.example backend/.env.properties     # used by the backend (DB + JWT)
cp .env.example frontend/.env.local         # used by Vite (VITE_API_BASE_URL)
```

### 2. Database
**Option A — Docker (recommended, everyone gets the same PostgreSQL 18):**
```bash
docker compose up -d            # starts postgres:18 on localhost:5432
```
**Option B — local PostgreSQL 18:** create the database manually:
```sql
CREATE DATABASE seal_hms;
```
Either way, Flyway runs `backend/src/main/resources/db/migration/V1__init_schema.sql`
automatically on first backend start — no manual schema script needed.

### 3. Run
```bash
# Backend  -> http://localhost:8080  (Swagger: /swagger-ui.html)
cd backend && ./mvnw spring-boot:run

# Frontend -> http://localhost:5173
cd frontend && npm install && npm run dev
```

> The Maven wrapper (`backend/mvnw`, `mvnw.cmd`, `.mvn/`) is committed, so `./mvnw` works out of the box — no local Maven install required.

---

## Repository Structure
```text
SEAL-HMS/
├── docker-compose.yml    # PostgreSQL 18 for local dev (shared by the team)
├── .env.example          # copy -> .env, backend/.env.properties, frontend/.env.local
├── backend/              # Spring Boot API (JPA + PostgreSQL)
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
├── docs/                 # DEVELOPMENT_RULES.md, ARCHITECTURE.md
└── frontend/             # React + Vite SPA
```

---

## Team workflow
Feature branch -> Pull Request into `main` -> **1 review** -> squash-merge.
Protect `main` (Settings -> Branches): require a pull request + 1 approval before merging.
No CI/CD by design — we keep the focus on the core business flow. Just run `./mvnw verify` and `npm run build` **locally** before pushing.

## Troubleshooting (local setup)

**`FATAL: database "seal_hms" does not exist` even though Docker is up**
You probably have a **native PostgreSQL** installed on Windows holding port **5432**, which shadows the Docker container (the backend hits the native one). Check: `Get-NetTCPConnection -LocalPort 5432`. Fix: run the Docker DB on **5433** — set `DB_PORT=5433` in **both** the root `.env` and `backend/.env.properties`, then `docker compose down && docker compose up -d`. (Or stop the native service: `Stop-Service postgresql-x64-18`.)

**`password authentication failed for user "postgres"`**
Root `.env` and `backend/.env.properties` must use the **same** `DB_PASSWORD`. Postgres only applies the password on first init — if you change it after the volume exists, recreate it: `docker compose down -v && docker compose up -d`.

**Flyway doesn't run / `Schema-validation: missing table [account]`**
Spring Boot 4 split auto-configuration into per-tech modules, so `flyway-core` alone does **not** run migrations — `pom.xml` must also include `org.springframework.boot:spring-boot-flyway` (already added). Without it the migration is silently skipped and Hibernate `validate` then fails on the missing tables.

## License
Private, academic use — Software Engineering Dept., FPT University HCMC.
