-- A judge can hold at most one score per criterion per submission. The service already
-- upserts, but this constraint prevents duplicate rows under concurrent grading requests.
-- Remove any pre-existing duplicates first (keep the lowest score_id) so the constraint applies.
DELETE FROM score s
USING score dup
WHERE s.submission_id = dup.submission_id
  AND s.judge_account_id = dup.judge_account_id
  AND s.criterion_id = dup.criterion_id
  AND s.score_id > dup.score_id;

ALTER TABLE score
ADD CONSTRAINT uq_score_submission_judge_criterion
UNIQUE (submission_id, judge_account_id, criterion_id);
