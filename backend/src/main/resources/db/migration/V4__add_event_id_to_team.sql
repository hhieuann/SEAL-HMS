-- V4__add_event_id_to_team.sql
-- Add event_id to team table so that Teams can be queried by Event even before they are assigned a Track.

ALTER TABLE team 
ADD COLUMN event_id BIGINT REFERENCES event(event_id);

CREATE INDEX idx_team_event ON team(event_id);
