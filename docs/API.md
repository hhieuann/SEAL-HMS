# SEAL-HMS API (v1) — Frontend reference

> Contract for the **currently implemented** endpoints (auth + account). More modules
> (event, team, submission, judging, ranking, prize) appear here and in Swagger as they are built.
>
> **Live & interactive:** Swagger UI `http://localhost:8080/swagger-ui.html` · OpenAPI JSON `http://localhost:8080/v3/api-docs`

## Conventions
- **Base URL:** `http://localhost:8080` (FE reads it from `VITE_API_BASE_URL`). Everything is under `/api/v1`.
- **Content-Type:** `application/json` for requests with a body.
- **Auth:** JWT Bearer. Log in → copy `data.token` → send header `Authorization: Bearer <token>` on protected calls.

### Standard response envelope
Every response (success or error) has this shape:
```json
{ "success": true, "message": "OK", "data": { }, "timestamp": "2026-06-16T15:30:00Z" }
```
| field | meaning |
|-------|---------|
| `success` | `true` on 2xx, `false` on error |
| `message` | human-readable message / error reason |
| `data` | the payload (object, array, string, or `null` on error) |
| `timestamp` | server time (ISO-8601) |

### Enums
| Enum | Values |
|------|--------|
| `Role` | `ADMIN`, `STAFF`, `LECTURER`, `STUDENT` |
| `AssignmentRole` | `JUDGE`, `MENTOR` — a LECTURER's per-event responsibility |
| `AccountStatus` | `ACTIVE`, `PENDING`, `DISABLED` |

> Role mapping: **Event Coordinator** ≈ `ADMIN`/`STAFF`. New accounts start as `STUDENT` + `PENDING` and must be approved.

### Auth flow (FE example, axios)
```js
// 1) login
const { data } = await api.post('/api/v1/auth/login', { email, password });
const token = data.data.token;            // note: envelope -> data.data
localStorage.setItem('token', token);

// 2) attach on every protected request
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
```

---

## Endpoint summary
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/auth/register` | public | Register an account (starts `PENDING`) |
| POST | `/api/v1/auth/login` | public | Log in, get JWT |
| GET | `/api/v1/accounts/me` | any logged-in | Current user's email |
| GET | `/api/v1/accounts` | ADMIN / STAFF | List accounts (`?status=` optional) |
| GET | `/api/v1/accounts/{id}` | ADMIN / STAFF | Get one account |
| PATCH | `/api/v1/accounts/{id}/approve` | ADMIN / STAFF | `PENDING → ACTIVE` |
| PATCH | `/api/v1/accounts/{id}/status` | ADMIN / STAFF | Set status |
| PATCH | `/api/v1/accounts/{id}/role` | **ADMIN only** | Change role |

---

## Auth

### POST `/api/v1/auth/register`  · public
Request:
```json
{ "email": "student1@fpt.edu.vn", "password": "student123", "role": "STUDENT" }
```
- `email` — required, valid email. `password` — required, ≥ 6 chars. `role` — optional (defaults `STUDENT`).

Response `200`:
```json
{ "success": true, "message": "Registered",
  "data": { "id": 2, "email": "student1@fpt.edu.vn", "role": "STUDENT", "status": "PENDING" },
  "timestamp": "2026-06-16T15:30:00Z" }
```

### POST `/api/v1/auth/login`  · public
Request:
```json
{ "email": "admin@seal-hms.local", "password": "Admin@12345" }
```
Response `200`:
```json
{ "success": true, "message": "OK",
  "data": { "token": "eyJhbGciOiJIUzI1NiJ9...", "role": "ADMIN" },
  "timestamp": "2026-06-16T15:30:00Z" }
```
Wrong email/password → `400` `{ "success": false, "message": "Invalid email or password", "data": null, ... }`.

---

## Account
All `/accounts/**` calls (except `/me` which only needs login) require an **ADMIN/STAFF** token; `…/role` needs **ADMIN**.

### GET `/api/v1/accounts/me`  · any logged-in user
Response `200`: `data` is the email string.
```json
{ "success": true, "message": "OK", "data": "admin@seal-hms.local", "timestamp": "..." }
```

### GET `/api/v1/accounts`  · ADMIN/STAFF
Optional query `?status=PENDING` (or `ACTIVE` / `DISABLED`). Response `200`: `data` is an array.
```json
{ "success": true, "message": "OK",
  "data": [
    { "id": 1, "email": "admin@seal-hms.local", "role": "ADMIN", "status": "ACTIVE" },
    { "id": 2, "email": "student1@fpt.edu.vn", "role": "STUDENT", "status": "PENDING" }
  ],
  "timestamp": "..." }
```

### GET `/api/v1/accounts/{id}`  · ADMIN/STAFF
Response `200`: single `AccountResponse` in `data`. Missing id → `404`.

### PATCH `/api/v1/accounts/{id}/approve`  · ADMIN/STAFF
No body. `PENDING → ACTIVE`.
```json
{ "success": true, "message": "Account approved",
  "data": { "id": 2, "email": "student1@fpt.edu.vn", "role": "STUDENT", "status": "ACTIVE" }, "timestamp": "..." }
```
If the account is not `PENDING` → `400` `"Only PENDING accounts can be approved (current: ACTIVE)"`.

### PATCH `/api/v1/accounts/{id}/status`  · ADMIN/STAFF
Request:
```json
{ "status": "DISABLED" }
```
Response `200`: updated `AccountResponse`. `status` is required and must be a valid `AccountStatus`.

### PATCH `/api/v1/accounts/{id}/role`  · ADMIN only
Request:
```json
{ "role": "STAFF" }
```
Response `200`: updated `AccountResponse`. A `STAFF` token here → `403`.

---

## Error responses
| HTTP | When | Body `message` example |
|------|------|------------------------|
| `400` | validation / business rule | `"password: must be at least 6 chars"`, `"Email already registered: ..."` |
| `401` | missing/invalid/expired token on a protected endpoint | (Spring Security) |
| `403` | logged in but lacking the required role | (e.g. STAFF calling `…/role`) |
| `404` | resource not found | `"Account not found: 99"` |

All errors use the same envelope with `success: false`, `data: null`.

---

## Test accounts
- **Seeded admin (Event Coordinator):** `admin@seal-hms.local` / `Admin@12345` (created automatically on first run; **change the password**).
- Register your own `STUDENT`/`LECTURER` via `/auth/register`, then approve it with the admin token.

## Status
- ✅ Implemented: **auth** (register/login), **account** (approval, status, role).
- 🔜 Next (will appear in Swagger when built): event, round, track, criterion, team, submission, judge, score, ranking, prize.
