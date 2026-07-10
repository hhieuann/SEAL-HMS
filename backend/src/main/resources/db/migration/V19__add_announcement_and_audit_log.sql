-- V19: Side flows requested in the final lecturer review (01/07):
--   announcement — BTC notices, optionally scoped to one event (NULL event_id = global)
--   audit_log    — trail of important admin/staff actions

CREATE TABLE announcement (
    announcement_id  BIGSERIAL PRIMARY KEY,
    event_id         BIGINT REFERENCES event(event_id) ON DELETE CASCADE,  -- NULL = global notice
    title            VARCHAR(200) NOT NULL,
    content          TEXT,
    created_by_email VARCHAR(255),
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);
CREATE INDEX idx_announcement_event ON announcement(event_id);

CREATE TABLE audit_log (
    audit_id    BIGSERIAL PRIMARY KEY,
    actor_email VARCHAR(255),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    detail      TEXT,
    created_at  TIMESTAMP
);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
