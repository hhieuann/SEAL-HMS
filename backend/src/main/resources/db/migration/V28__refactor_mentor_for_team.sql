-- V25: Drop incorrect ManyToMany team_mentor table, refactor mentor table for 1-1 Team-Mentor mapping

DROP TABLE IF EXISTS team_mentor;

-- The mentor table (from V1) looks like: mentor_id, lecturer_id, track_id.
-- We no longer assign mentors to tracks. Mentors are assigned to teams.
-- A team can only have 1 mentor, so team_id must be UNIQUE.

ALTER TABLE mentor DROP COLUMN IF EXISTS track_id;

-- Clear any legacy data since the schema meaning changed
TRUNCATE TABLE mentor;

ALTER TABLE mentor ADD COLUMN team_id BIGINT UNIQUE;
ALTER TABLE mentor ADD CONSTRAINT fk_mentor_team FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE CASCADE;
