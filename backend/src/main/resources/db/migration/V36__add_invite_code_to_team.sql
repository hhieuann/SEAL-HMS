-- Add invite_code column to team table for random 6-char join codes
ALTER TABLE team ADD COLUMN invite_code VARCHAR(6);
CREATE UNIQUE INDEX uq_team_invite_code ON team(invite_code);
