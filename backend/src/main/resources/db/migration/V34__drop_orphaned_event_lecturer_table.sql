-- V34: Drop orphaned event_lecturer table
-- The event_lecturer table from V1 is unused. The application uses event_staff for managing events.
DROP TABLE IF EXISTS event_lecturer;
