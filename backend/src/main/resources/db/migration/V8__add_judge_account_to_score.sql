-- V8: Account-based scoring. Judges grade directly with their account instead of a
-- dedicated judge row, so add judge_account_id and relax the legacy judge_id (V1 made
-- it NOT NULL) — otherwise inserting a score fails on the unset judge_id column.
ALTER TABLE score ADD COLUMN IF NOT EXISTS judge_account_id BIGINT REFERENCES account(account_id);
ALTER TABLE score ALTER COLUMN judge_id DROP NOT NULL;
