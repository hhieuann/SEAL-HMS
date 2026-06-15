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

## Module ownership (2 BE + 2 FE)

The backend splits into two **cohesive halves** with a clean handoff at the **submission**. Each BE owns a connected slice, and there is exactly one well-defined interface between you — so you rarely touch each other's code, and bugs are easy to locate.

### BE-1 — Leader (you): Foundation + Evaluation
`common`, `config` (security, JPA, exceptions, **enums**) · `auth`, `account` (+ lecturer/student profiles, approval, roles) · `judge`, `score` (judging) · `round_ranking`, `RankingService`, `prize` (results)
> You own the shared foundation everyone builds on **plus** the hardest business logic: weighted scoring → ranking → top-N promotion → prizes.

### BE-2 — second BE: Competition setup + Participation
`event`, `round`, `track`, `topic`, `criterion` (configure the contest) · `team`, `team_member`, `chapter`, `mentor` (registration + approval) · `submission` (submit per round + deadline validation)
> You own everything that **produces the data to be evaluated**: a configured contest, registered teams, and their submissions.

### The interface between the two BEs (agree this first!)
- **BE-2 produces → BE-1 consumes:** the `event/round/track/criterion` config, `team`, and `submission`.
- **BE-1 writes back:** `score`, `round_ranking`, `team.eventScore`/`eventRank`, `prize`.
- Nail down the **DTO / API shapes at this boundary first** (Swagger), then both work in parallel and only sync here.
- Shared `enums` / `BaseEntity` / `ApiResponse` live in `common` (BE-1 owns; change via a small PR so BE-2 isn't surprised).

> Prefer to own the config side instead of scoring? You two can swap the BE-1/BE-2 halves — the seam stays the same.

### FE pairing (2 FE)
- **FE-1 ↔ BE-2:** login/register pages, Admin config UI (Event/Round/Track/Criterion), team registration UI.
- **FE-2 ↔ BE-1:** submission UI, judge scoring UI, ranking + prize UI.

> Define DTO/API contracts (Swagger) early so each FE can build against their BE counterpart in parallel.

## Handy commands
```bash
git branch -a                                            # list all branches
git branch -d feature/x; git push origin --delete feature/x   # delete a merged branch
git stash; git stash pop                                 # park / restore work in progress
git fetch origin; git reset --hard origin/develop        # ⚠ discard local changes, match remote
```
