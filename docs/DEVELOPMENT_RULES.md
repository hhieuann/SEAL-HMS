# Development Rules

## Coding standards
- Java: camelCase fields → Hibernate maps to snake_case columns automatically (e.g. `eventScore` → `event_score`).
- Never return entities from controllers; map to DTOs.
- Never store plaintext passwords; always BCrypt.
- Never commit secrets. Config values come from env vars (`backend/.env.properties`).
- One enum per status; persist with `@Enumerated(EnumType.STRING)`.

## Database
- Migrations only via Flyway (`db/migration/V{n}__desc.sql`). Never edit an applied migration — add a new one.
- `spring.jpa.hibernate.ddl-auto=validate` (NEVER `update` on the shared repo).
- Every table has a primary key (yes, including `team_member` → `member_id` + `UNIQUE(student_id, team_id)`).
- Add `created_at` / `updated_at` via `BaseEntity` + JPA auditing.

## Known TODO / decisions to confirm with supervisor
- **Guest judges:** current `judge` table links to `lecturer`. External (guest) judges aren't lecturers — if needed, make `judge.lecturer_id` nullable and add `judge.account_id`.
- **Event scoring rule:** confirm whether `eventScore` = sum of all rounds, final-round only, or weighted (qualification vs final use different criteria).
- **Chapter ranking:** PDF says "highest achievement of teams" → likely MAX of a chapter's teams + `bonusPoint`. Confirm.

## Definition of Done
- Endpoint documented in Swagger, DTO-based, validated.
- Service has unit tests for business rules (scoring/ranking especially).
- PR reviewed, squash-merged. Run `./mvnw verify` and `npm run build` locally before pushing.
