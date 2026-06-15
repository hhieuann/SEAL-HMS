# Contributing — SEAL-HMS

> Read this before pushing anything. As leader, the repo owner enforces these rules via branch protection.

## Branch model (GitHub Flow)
- `main` — protected, always runnable. No direct pushes.
- Feature branches off `main`, short-lived, one feature each.

**Naming:** `feature/<scope>-<short-desc>` using the scope codes from the assessment.
Examples: `feature/AU-01-jwt-login`, `feature/EV-03-create-event`, `feature/JS-02-scoring`.
Also: `fix/...`, `chore/...`, `docs/...`.

## Commit messages (Conventional Commits)
`<type>: <short summary>` — types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
Example: `feat: add JWT login endpoint`.

## Pull Requests
1. Open a PR into `main`.
2. Run `./mvnw verify` (backend) and `npm run build` (frontend) **locally** first.
3. At least **1 reviewer approval** required before merge.
4. Keep PRs small.
5. Squash & merge.

## Before you open a PR
- `cd backend && ./mvnw verify` passes.
- `cd frontend && npm run lint && npm run build` passes.
- No secrets committed. No `application.yml` with real passwords.

## Backend module ownership (suggested)
- **Leader:** `config`, `auth`, `account`, `event` (the core others depend on)
- **Member B:** `team`, `submission`
- **Member C:** `judging`, `ranking`
- Shared later: `mentor`, `notification`, `prize`, `report`

> Define DTO/API contracts first (Swagger) so the frontend team can work in parallel.
