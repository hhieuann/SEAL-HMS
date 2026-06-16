-- V3__clean_up_track_and_topic.sql
-- Remove redundant lecturer_id from track and round_id from topic

ALTER TABLE track DROP COLUMN lecturer_id;
ALTER TABLE topic DROP COLUMN round_id;
