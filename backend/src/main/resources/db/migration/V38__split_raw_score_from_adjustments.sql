-- Round scores used to be a single column that both scoring and penalties wrote to, so the
-- judged score was lost the moment a penalty was applied and the arithmetic could not be shown
-- to a team. Split it: raw_score is what the judges gave, score stays the value everything
-- ranks and displays, and it is now derived as raw_score - penalty_points + bonus_points.

ALTER TABLE round_ranking
    ADD COLUMN raw_score        NUMERIC(8, 2),
    ADD COLUMN bonus_points     NUMERIC(8, 2) DEFAULT 0,
    ADD COLUMN bonus_reason     VARCHAR(255),
    ADD COLUMN tie_break_reason VARCHAR(255);

-- Recover the judged score for existing rows: the old code stored score already net of the
-- penalty, so adding the penalty back reconstructs it.
UPDATE round_ranking
SET raw_score = COALESCE(score, 0) + COALESCE(penalty_points, 0)
WHERE raw_score IS NULL;

UPDATE round_ranking
SET bonus_points = 0
WHERE bonus_points IS NULL;
