-- V33: Drop orphaned judge table and its references
-- The judge table from V1 is no longer used since V13 introduced track_assignment for scoring roles.
-- The score table still had a legacy judge_id column pointing to it from V1 (deprecated in V8).
ALTER TABLE score DROP COLUMN IF EXISTS judge_id;
DROP TABLE IF EXISTS judge;
