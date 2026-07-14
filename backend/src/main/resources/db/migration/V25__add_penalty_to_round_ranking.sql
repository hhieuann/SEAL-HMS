ALTER TABLE round_ranking
ADD COLUMN penalty_points numeric(8,2) DEFAULT 0,
ADD COLUMN penalty_reason text;
