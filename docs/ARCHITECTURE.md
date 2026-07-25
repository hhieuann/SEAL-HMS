# Architecture

## Layers
```
React (Vite)  —  34 pages, role-gated by <ProtectedRoute>
   │  REST /api/v1/**  (JWT in the Authorization header)
   ▼
Controller  ──>  Service  ──>  Repository (Spring Data JPA)  ──>  PostgreSQL 18
        (DTO in/out)     (business rules)        (18 entities)      (22 tables)
   20 controllers      @Transactional          JpaRepository       Flyway V1..V37
   108 endpoints
```
- Controllers never expose entities — always DTOs (request/response).
- Services hold business rules and transactions (`@Transactional`).
- Repositories are interfaces extending `JpaRepository`.
- Every response is wrapped in the same envelope, `ApiResponse<T>` (see [API.md](API.md)).

## One request, end to end

Taking "a judge scores a submission" as the example, because it touches every layer:

```
1  Judge fills the scoring form                     JudgePanel.jsx
2  POST /api/v1/submissions/{id}/scores/grade       axios + JWT interceptor
3  JwtAuthenticationFilter validates the token      -> SecurityContext holds the email
4  @PreAuthorize("hasRole('LECTURER')")             coarse gate: is this a lecturer?
5  ScoreController hands over the DTO               never the entity
6  ScoreService.gradeSubmission(id, req, email)     identity comes from the token,
                                                    NOT from req.judgeAccountId
7    ├ is this lecturer the assigned JUDGE          fine-grained gate: the real
     │ for the submission's track?                  authorization check
     ├ does each criterion belong to this round?
     ├ is every score >= 0 and <= maxScore?
     └ upsert Score, then recompute RoundRanking
8  ScoreRepository / RoundRankingRepository         Spring Data JPA
9  PostgreSQL — unique (submission, judge, criterion) stops double-scoring
10 ApiResponse<List<ScoreResponse>> back to the FE
```

The pattern to notice: **step 4 asks "what kind of user is this?", step 7 asks "is this
particular user allowed to touch this particular row?"** Role annotations alone cannot answer the
second question, so it lives in the service.

## Package-by-feature
Each feature folder owns its `entity / repository / service / controller / dto`.
`common/` holds cross-cutting pieces (BaseEntity, ApiResponse, exceptions, enums).
`config/` holds Security, OpenAPI, JPA auditing, and the demo-account seeder.

Chosen over package-by-layer so several people can work in parallel without merge collisions —
a feature is one folder, not five scattered edits.

| Group | Packages |
|---|---|
| Identity | `auth`, `account`, `student`, `lecturer`, `staff` |
| Event setup | `event`, `round`, `track`, `topic`, `criterion` |
| Participation | `team`, `teammember`, `trackassignment` |
| Competition | `submission`, `score`, `roundranking` |
| Recognition | `chapter`, `prize` |
| Platform | `announcement`, `auditlog`, `common`, `config` |

## Domain model — the relationships that matter

```
Event 1─* Track 1─* Topic            Event 1─* Round 1─* Criterion
  │         │
  │         *                        Round 1─* RoundRanking *─1 Team
  │       Team *─1 Chapter                        │
  │         │                                     1
  │         *                                 Submission 1─* Score *─1 Account (judge)
  │      TeamMember *─1 Account
  │         │
  │         └─ mentor (join table, team_id unique) ─1 Lecturer
  │
  └─* TrackAssignment (track, lecturer, JUDGE|MENTOR)
```

Two details that carry business rules:
- `mentor` is a join table with **`team_id` unique** — that alone guarantees "one team, one mentor",
  while a lecturer may appear many times (one mentor, many teams).
- A judge is a row in `track_assignment`, so one lecturer can hold judge rows on several tracks.

## State machines → status columns
The State Transition Diagrams map directly to enums + a `status` column:
- `Event.status`  → `EventStatus`  (PLANNED, UPCOMING, ONGOING, COMPLETED, CANCELLED)
- `Round.status`  → `RoundStatus`  (CREATED, ACTIVE, SCORING, UNDER_REVIEW, COMPLETED)
- `Submission.status` → `SubmissionStatus` (DRAFT, LOCKED, SCORING, EVALUATED)
- `Team.status`   → `TeamStatus`   (CREATED, REGISTERED, CONFIRMED, IN_PROGRESS, COMPLETED, REJECTED, WITHDRAWN, DISQUALIFIED, ELIMINATED)
- `TeamMember.status` → `MemberStatus` (INVITED, ACCEPTED, DECLINED, WITHDRAWN)

Each transition is guarded in the service layer — illegal jumps (e.g. PLANNED → ONGOING without
UPCOMING, or starting an event below its minimum team count) are rejected with a `BusinessException`.

## Ranking (three levels)
- `computeRoundRanking(roundId)` — rank teams in a round, set `isPromoted` for the top N.
- Event level — each team's `eventScore` (Σ round scores) and `eventRank`.
- Chapter level — aggregate the chapter's placements (20/15/10) + `bonusPoint`, using dense ranking
  so equal totals share a rank.

Run on "finalize" actions; derived values are never edited directly. Details in
[FEATURES.md](FEATURES.md#ranking--three-levels).

## Authentication & authorization
Stateless JWT. `JwtAuthenticationFilter` validates the token and populates the `SecurityContext`.

Roles: **ADMIN, STAFF, LECTURER, STUDENT**. Judge and Mentor are per-event responsibilities of a
LECTURER (`AssignmentRole`), not account roles — a lecturer earns them through an assignment.
Admin & Staff are plain accounts distinguished by role (no profile tables), per supervisor's
instruction.

Two layers, as shown in the walkthrough above:
1. `@PreAuthorize("hasRole('…')")` on the controller — what kind of user.
2. An ownership/assignment check in the service — this user, this row. Identity is always read from
   the token, never from the request body.

## Testing
- **Backend:** 499 tests in 55 classes (JUnit 5 + Mockito). Service tests mock repositories;
  controller tests use `@WebMvcTest` slices with a shared `WebMvcTestSecurityConfig` so
  `@PreAuthorize` rules are actually exercised.
- **Coverage:** JaCoCo, 96.9% line / 87.7% branch, excluding `dto`, `entity`, `config` and
  controllers (they hold no business logic worth a coverage denominator).
- **Frontend:** 18 Vitest tests, focused on role-dependent rendering.

> Spring Boot 4 note: `@WebMvcTest` moved to `org.springframework.boot.webmvc.test.autoconfigure`
> and needs the `spring-boot-starter-webmvc-test` dependency. The slice instantiates
> `JwtAuthenticationFilter`, so a real `JwtService` bean must be provided, and `@WithMockUser` does
> not apply — use `.with(user("x").roles("ADMIN"))`.
