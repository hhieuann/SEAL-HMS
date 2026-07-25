# Installation Guide

How to open, configure and run the SEAL-HMS source code on a clean machine.

The project is a **monorepo with two runnable parts**, so "running the system" means starting
three things: a PostgreSQL database, the Spring Boot backend, and the React frontend.

```
PostgreSQL 18 (Docker)          Spring Boot backend            React frontend
localhost:5433        <──────   localhost:8080       <──────   localhost:5173
                       JDBC                          REST/JWT
```

---

## 1. System requirements

| Tool | Version | Why it is needed | Where to get it |
|---|---|---|---|
| **JDK** | **21** (LTS) | The backend targets Java 21 (`<java.version>21</java.version>`). JDK 25 also works. | [Eclipse Temurin 21](https://adoptium.net/temurin/releases/?version=21) |
| **Node.js** | **20 LTS or newer** | Runs the Vite dev server and the frontend build | [nodejs.org](https://nodejs.org/) |
| **Docker Desktop** | current | Runs PostgreSQL 18 so every machine gets an identical database | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | current | Cloning the repository | [git-scm.com](https://git-scm.com/) |
| Maven | — | **Not required.** The repository ships the Maven wrapper (`mvnw`), which downloads Maven 3.9.9 on first run. | — |
| PostgreSQL (local) | 18 | Optional alternative to Docker | [postgresql.org](https://www.postgresql.org/download/) |

Disk: about 1.5 GB after the Maven and npm caches are populated.

Verify the prerequisites before continuing:

```powershell
java -version      # expect 21.x (or 25.x)
node -v            # expect v20.x or newer
docker --version
git --version
```

---

## 2. A note on NetBeans 8.2

**NetBeans 8.2 cannot open or run this project.** This is a limitation of that IDE version,
not of the source code:

| Requirement | NetBeans 8.2 (released 2016) |
|---|---|
| JDK 21 | Not supported — 8.2 targets JDK 8 |
| Spring Boot 4 / Maven 3.9 | Not supported by its bundled Maven integration |
| React + Vite frontend | No tooling for modern JavaScript module bundlers |
| Docker | No integration |

The project therefore uses a toolchain contemporary with Spring Boot 4. Two options, both of
which run the code exactly as submitted:

1. **Apache NetBeans 21 or newer** — the current, Apache-maintained continuation of NetBeans.
   It opens the backend as a standard Maven project and supports JDK 21. Use this if the IDE
   must be NetBeans. Setup is in [section 8.1](#81-apache-netbeans-21-or-newer).
2. **IntelliJ IDEA** (Community Edition is enough) or **VS Code** — what the team used.
   Setup in [sections 8.2 and 8.3](#82-intellij-idea).

Nothing about the build depends on an IDE: sections 3–7 run the whole system from the command
line, so the project can also be evaluated without opening any IDE at all.

---

## 3. Step 1 — Get the source code

```powershell
git clone https://github.com/hhieuann/SEAL-HMS.git
cd SEAL-HMS
```

Or, from the submitted archive, extract it and `cd` into the extracted `SEAL-HMS` folder.

Expected layout:

```
SEAL-HMS/
├── docker-compose.yml     # the PostgreSQL container
├── .env.example           # template for the three env files
├── backend/               # Spring Boot API (has mvnw / mvnw.cmd)
├── frontend/              # React + Vite SPA
└── docs/
```

---

## 4. Step 2 — Create the three environment files

Secrets are never committed, so three **gitignored** files must be created from
`.env.example`. Each is read by a different program:

| File to create | Read by | Keys that matter |
|---|---|---|
| `.env` (repository root) | docker-compose — builds the database container | `DB_*` |
| `backend/.env.properties` | Spring Boot — how the backend connects | `DB_*`, `JWT_*` |
| `frontend/.env.local` | Vite — where the API lives | `VITE_API_BASE_URL` |

**Windows (PowerShell)** — run from the repository root:

```powershell
copy .env.example .env
copy .env.example backend\.env.properties
copy .env.example frontend\.env.local
```

**macOS / Linux:**

```bash
cp .env.example .env
cp .env.example backend/.env.properties
cp .env.example frontend/.env.local
```

Now edit the values. Two rules decide whether the backend can reach the database:

1. **`DB_PASSWORD` must be identical** in `.env` and `backend/.env.properties`.
2. **If a PostgreSQL is already installed on this machine, it holds port 5432.** In that case
   set `DB_PORT=5433` in **both** files — docker-compose then maps host `5433` to the
   container's `5432`, so the two databases do not clash.

A working example (`.env` and `backend/.env.properties`):

```properties
DB_HOST=localhost
DB_PORT=5433
DB_NAME=seal_hms
DB_USERNAME=postgres
DB_PASSWORD=SealHms@2026

JWT_SECRET=replace_this_with_at_least_32_random_characters_xxxx
JWT_EXPIRATION_MS=86400000
```

And `frontend/.env.local`:

```properties
VITE_API_BASE_URL=http://localhost:8080
```

> Keep `JWT_SECRET` at 32 characters or more. The signing key is built with
> `Keys.hmacShaKeyFor(...)`, which rejects anything shorter than 256 bits, and the backend then
> fails to start.

---

## 5. Step 3 — Start the database

With Docker Desktop running:

```powershell
docker compose up -d
```

Confirm the container is healthy before continuing — the backend cannot start before the
database accepts connections:

```powershell
docker ps
# STATUS should read: Up ... (healthy)
```

This creates an **empty** `seal_hms` database. **Docker does not create the tables.** Flyway
does that on the backend's first start (section 6).

> Using a locally installed PostgreSQL instead? Create the database once —
> `CREATE DATABASE seal_hms;` — and point `backend/.env.properties` at its port.

---

## 6. Step 4 — Run the backend

```powershell
cd backend
.\mvnw spring-boot:run
```

On macOS / Linux use `./mvnw spring-boot:run`.

The first run downloads Maven 3.9.9 and the dependencies, so it takes a few minutes. Watch for
these lines, in this order:

```
o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "1 - init schema"
...
o.f.core.internal.command.DbMigrate : Successfully applied 35 migrations to schema "public", now at version v37
c.f.seal.hms.config.AdminSeeder     : Seeded default ADMIN 'admin@seal-hms.local' ...
o.s.boot.tomcat.TomcatWebServer     : Tomcat started on port 8080 (http)
c.fpt.seal.hms.SealHmsApplication   : Started SealHmsApplication in 4.7 seconds
```

Flyway has now built the schema — **23 tables** — and seeded four demo accounts. Verify:

```powershell
docker exec seal-hms-postgres psql -U postgres -d seal_hms -c "\dt"
```

The backend is up. Leave this terminal running.

---

## 7. Step 5 — Run the frontend

In a **second** terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite prints the URL:

```
  VITE v8.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Open <http://localhost:5173> in a browser. The system is running.

### Demo accounts

`AdminSeeder` creates these on first start. They are **local development defaults** — change
them before any real deployment.

| Role | Email | Password | Lands on |
|---|---|---|---|
| Admin | `admin@seal-hms.local` | `Admin@12345` | `/admin/dashboard` |
| Event Staff | `staff@seal-hms.local` | `Staff@12345` | `/expert/dashboard` |
| Lecturer (judge / mentor) | `lecturer@seal-hms.local` | `Lecturer@12345` | `/expert/dashboard` |
| Student | `student@seal-hms.local` | `Student@12345` | `/participant/events` |

A lecturer only sees a judging or mentoring workspace after an admin assigns them to a track
or a team — see [FEATURES.md](FEATURES.md).

---

## 8. Opening the project in an IDE

The backend is a plain Maven project and the frontend a plain npm project, so any IDE that
understands those two things will work. **Open `backend/` and `frontend/` as two separate
projects** — the repository root is not itself a Maven or npm project.

### 8.1 Apache NetBeans 21 or newer

1. Install **Apache NetBeans 21+** from <https://netbeans.apache.org/download/>.
2. Point it at JDK 21: edit `netbeans.conf` (in the NetBeans `etc/` folder) and set
   `netbeans_jdkhome="C:\Program Files\Java\jdk-21"`, or install the JDK before NetBeans so it
   is detected automatically.
3. **File → Open Project…** → select the `backend` folder. NetBeans recognises `pom.xml` and
   loads it as a Maven project.
4. Wait for "Resolving dependencies" to finish (status bar, bottom right).
5. Run it: right-click the project → **Custom → Goals…**, enter goal `spring-boot:run`, and
   run. Alternatively use the terminal from section 6 — the IDE is only an editor here.
6. For the frontend, use the terminal from section 7. NetBeans has no Vite integration; the
   dev server is started with `npm run dev`.

### 8.2 IntelliJ IDEA

1. **File → Open…** → select the `backend` folder (choose *Open as Project* when asked).
2. **File → Project Structure → SDK** → select JDK 21.
3. Wait for the Maven import, then run `SealHmsApplication` from the gutter arrow, or use the
   Maven tool window → Plugins → spring-boot → `spring-boot:run`.
4. **File → Open…** → `frontend` in a second window, then run `npm run dev` in its terminal.

### 8.3 Visual Studio Code

1. **File → Open Folder…** → the repository root works fine here.
2. Install the *Extension Pack for Java* and *Spring Boot Extension Pack*.
3. Set the JDK: Command Palette → `Java: Configure Java Runtime` → JDK 21.
4. Run the backend and frontend in two integrated terminals, per sections 6 and 7.

---

## 9. Verifying the installation

| What | Command / URL | Expected |
|---|---|---|
| Backend health | <http://localhost:8080/api/v1/events> | `{"success":true, ...}` |
| API documentation | <http://localhost:8080/swagger-ui.html> | Swagger UI listing 108 endpoints |
| Backend tests | `cd backend` → `.\mvnw test` | `BUILD SUCCESS` — 492 tests across 55 classes, 0 failures |
| Coverage report | `.\mvnw verify` → open `backend/target/site/jacoco/index.html` | 96.9% line, 87.7% branch |
| Frontend tests | `cd frontend` → `npx vitest run` | `Tests 18 passed (18)` |
| Frontend lint | `npx eslint .` | 0 errors |
| Frontend build | `npm run build` | `✓ built in …`, output in `frontend/dist` |

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Web server failed to start. Port 8080 was already in use.` | Another backend instance is still running | Find and stop it: `netstat -ano \| findstr :8080` then `taskkill /PID <pid> /F` |
| `Connection to localhost:5433 refused` | The backend started before PostgreSQL was ready, or Docker Desktop is not running | Start Docker Desktop, wait for `docker ps` to show `(healthy)`, then start the backend |
| `FATAL: database "seal_hms" does not exist` although Docker is up | A locally installed PostgreSQL holds port 5432 and shadows the container | Set `DB_PORT=5433` in **both** env files, then `docker compose down; docker compose up -d` |
| `password authentication failed for user "postgres"` | `DB_PASSWORD` differs between `.env` and `backend/.env.properties`. PostgreSQL only applies the password on first initialisation | Make them identical; if the volume already exists, recreate it: `docker compose down -v; docker compose up -d` |
| `Schema-validation: missing table [account]` | Flyway did not run, so Hibernate found no tables | Spring Boot 4 splits auto-configuration per technology: `pom.xml` needs `spring-boot-flyway` in addition to `flyway-core` (already included). Check the startup log for `Migrating schema`. |
| Backend starts, but the frontend shows `502` or network errors | The frontend was started before the backend | Reload the browser once the backend logs `Started SealHmsApplication` |
| Startup fails with a `WeakKeyException` from the JWT library | `JWT_SECRET` in `backend/.env.properties` is shorter than 32 characters | Replace it with a longer random string |
| `bad interpreter` when running `./mvnw` on macOS/Linux | Line endings were converted to CRLF | `git config core.autocrlf false` and re-clone; `.gitattributes` normally prevents this |
| pgAdmin shows no tables | Connected to a local PostgreSQL on 5432 instead of the container | Connect to host `localhost`, port = your `DB_PORT` (e.g. 5433), database `seal_hms` |

---

## 11. Stopping and resetting

```powershell
# stop the backend / frontend:  Ctrl+C in each terminal

docker compose down       # stop the database, keep the data
docker compose down -v    # stop the database AND erase all data
```

After `down -v`, the next backend start replays every Flyway migration and reseeds the demo
accounts — a clean database in one step, which is how the demonstration is prepared.
