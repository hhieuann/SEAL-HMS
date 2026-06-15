# Contributing — SEAL-HMS

> Read this before you push. We follow the **R2S Gitflow** and the **R2S commit-message standard**. The leader enforces these via branch protection.

## Branch model (Gitflow)

| Branch | Purpose | Branch from | Merge into |
|--------|---------|-------------|------------|
| `main` | Stable, release-ready production code | — | — |
| `develop` | Integration of everyone's work | `main` | `main` (via `release/*`) |
| `feature/*` | One feature each, short-lived | `develop` | `develop` |
| `release/*` | Release prep (version bump, last fixes) | `develop` | `main` + `develop` |
| `hotfix/*` | Urgent production fix | `main` | `main` + `develop` |

**Day to day you only use `feature/*` branched off `develop`.** Never commit directly to `main` or `develop`.

**Naming:** `feature/<SCOPE>-<short-desc>` using the assessment scope codes.
Examples: `feature/AU-01-jwt-login`, `feature/EV-03-create-round`, `feature/JS-02-scoring`. Also `fix/...`, `hotfix/...`, `release/v1.0.0`.

## Daily flow (feature)
```bash
# 1) Always start from the latest develop
git checkout develop
git pull origin develop

# 2) Create your feature branch
git checkout -b feature/AU-01-jwt-login

# 3) Work → stage → commit → push
git add .
git commit -m "feat(auth): add JWT login endpoint"
git push -u origin feature/AU-01-jwt-login

# 4) Open a Pull Request: feature/... -> develop, get 1 approval, then merge.
```
> Always `git pull origin develop` before branching to avoid conflicts.

## Commit message standard
Format: **`<type>(<scope>): <short description>`** — `scope` = the module/feature touched.

| type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature / add / update / enhance behavior | `feat(team): add invite-member endpoint` |
| `fix` | Bug, logic error, or UI fix | `fix(login): correct error message on failure` |
| `refactor` | Restructure, no behavior change (SOLID/DRY/KISS, rename) | `refactor(ranking): extract scoring helper` |
| `perf` | Performance / optimization | `perf(score): optimize weighted-sum query` |
| `style` | Formatting / whitespace only (Prettier) | `style(codebase): apply Prettier` |
| `docs` | Docs or code comments | `docs(readme): update setup steps` |
| `test` | Add / update tests | `test(ranking): add top-N unit tests` |
| `build` | Build system (Maven, Docker, deps) | `build(maven): add staging profile` |
| `chore` | Minor tasks, no business logic (config, rename, bump) | `chore(deps): bump spring-boot` |
| `ci` | CI/CD pipeline | `ci(github): add build check` |
| `revert` | Revert a previous commit | `revert: "feat(auth): add login"` |
| `merge` | Merge a branch | `merge(feature/login): integrate into develop` |
| `release` | Merge in preparation for release/deploy | `release: v1.0.0 to main` |
| `review` / `fixreview` | Add review notes / apply review fixes | `fixreview(team): address review comments` |

Keep the description imperative and short (≤ ~70 chars).

## Pull Requests
1. **Target `develop`** for features/fixes. Only `release/*` and `hotfix/*` target `main`.
2. Before opening: `cd backend && ./mvnw verify` and `cd frontend && npm run lint && npm run build` pass locally.
3. **≥ 1 reviewer approval** required. Keep PRs small and focused.
4. No secrets / no real passwords in committed files (`.env*` are gitignored).

## Branch protection (leader sets once)
Settings → Branches → protect **`main`** and **`develop`**: require a Pull Request + 1 approval before merge.

## Backend module ownership (suggested — matches the task plan)
- **Leader (BE):** `config`, `auth`, `account`, `event`, `round`, `ranking`
- **BE Member 2:** `track`/`topic`, `criterion`, `team`, `team_member`, `prize`
- **BE Member 3:** `submission`, `judge`, `score`, team approval, unit tests
- **FE Member 1 / 2:** auth pages, admin config UI, team/submission/judge/ranking UIs

> Define DTO/API contracts (Swagger) early so the frontend can work in parallel.

## Handy commands
```bash
git branch -a                                            # list all branches
git branch -d feature/x; git push origin --delete feature/x   # delete a merged branch
git stash; git stash pop                                 # park / restore work in progress
git fetch origin; git reset --hard origin/develop        # ⚠ discard local changes, match remote
```
