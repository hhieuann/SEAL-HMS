-- V14__decouple_topic_track.sql

-- Add event_id to topic table
ALTER TABLE topic ADD COLUMN event_id BIGINT;

-- Add foreign key constraint for event_id
ALTER TABLE topic ADD CONSTRAINT topic_event_id_fkey FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE;

-- We need to populate event_id for existing topics before we can make it NOT NULL (optional, but good practice if we wanted to enforce it).
-- We can do this by joining with the track table.
UPDATE topic
SET event_id = track.event_id
FROM track
WHERE topic.track_id = track.track_id;

-- Now make track_id optional
ALTER TABLE topic ALTER COLUMN track_id DROP NOT NULL;

-- Ideally, event_id should be NOT NULL now that it is populated.
ALTER TABLE topic ALTER COLUMN event_id SET NOT NULL;
