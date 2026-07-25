# Architecture

## Layers
```
React (Vite)
   │  REST /api/v1/**  (JWT in Authorization header)
   ▼
Controller  ──>  Service  ──>  Repository (Spring Data JPA)  ──>  PostgreSQL
        (DTO in/out)     (business rules)        (entities)
```
- Controllers never expose entities — always DTOs (request/response).
- Services hold business rules and transactions (`@Transactional`).
- Repositories are interfaces extending `JpaRepository`.

## Package-by-feature
Each feature folder owns its `entity / repository / service / controller / dto`.
`common/` holds cross-cutting pieces (BaseEntity, ApiResponse, exceptions, enums).
`config/` holds Security, OpenAPI, JPA auditing.

## State machines → status columns
The State Transition Diagrams map directly to enums + a `status` column:
- `Event.status`  → `EventStatus`  (PLANNED, UPCOMING, ONGOING, COMPLETED, CANCELLED)
- `Round.status`  → `RoundStatus`  (CREATED, ACTIVE, SCORING, UNDER_REVIEW, COMPLETED)
- `Submission.status` → `SubmissionStatus` (DRAFT, LOCKED, SCORING, EVALUATED)
- `Team.status`   → `TeamStatus`   (CREATED, REGISTERED, CONFIRMED, IN_PROGRESS, COMPLETED, REJECTED, WITHDRAWN, DISQUALIFIED)
- `TeamMember.status` → `MemberStatus` (INVITED, ACCEPTED, DECLINED, WITHDRAWN)

Each transition should be guarded in the service layer (reject illegal jumps, e.g. DRAFT→COMPLETED).

## Ranking (three levels)
`RankingService` exposes:
- `computeRoundRanking(roundId)`  — rank teams in a round, set `isPromoted` for top N.
- `computeEventRanking(eventId)`  — set each team's `eventScore` (Σ round scores) and `eventRank`.
- `computeChapterRanking()`       — aggregate chapter teams' results + `bonusPoint`.
Run on "finalize" actions; never let derived values be edited directly.

## Authentication
Stateless JWT. `JwtAuthenticationFilter` validates the token and sets the `SecurityContext`.
Authorize with `@PreAuthorize("hasRole('ADMIN')")` etc. Roles: ADMIN, STAFF, LECTURER, STUDENT. Judge and Mentor are per-event responsibilities of a LECTURER (see `AssignmentRole`), not account roles.
Admin & Staff are plain accounts distinguished by role (no profile tables) — per supervisor's instruction.
