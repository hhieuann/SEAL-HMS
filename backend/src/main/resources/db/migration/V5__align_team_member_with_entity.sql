-- V5__align_team_member_with_entity.sql
-- The TeamMember entity was redesigned to be account-based with a MemberRole,
-- but the V1 team_member table is student-based with an is_leader flag.
-- Bring the table in line with the entity so Hibernate `validate` passes and inserts work.
-- (Idempotent guards so it is safe on DBs where ddl-auto may have added columns.)

ALTER TABLE team_member ADD COLUMN IF NOT EXISTS account_id BIGINT;
ALTER TABLE team_member ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';

-- student_id + is_leader are replaced by account_id + role; drop the old junction shape.
ALTER TABLE team_member DROP CONSTRAINT IF EXISTS uq_member;
ALTER TABLE team_member DROP COLUMN IF EXISTS student_id;
ALTER TABLE team_member DROP COLUMN IF EXISTS is_leader;

-- Integrity (safe to keep; the entity manages the relationship in JPA):
ALTER TABLE team_member
    ADD CONSTRAINT fk_team_member_account FOREIGN KEY (account_id) REFERENCES account(account_id);
ALTER TABLE team_member
    ADD CONSTRAINT uq_member_account UNIQUE (account_id, team_id);
