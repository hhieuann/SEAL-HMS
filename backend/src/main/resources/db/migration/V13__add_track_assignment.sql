-- V13: Add track_assignment table to support assigning Lecturers as JUDGE or MENTOR for a Track

CREATE TABLE track_assignment (
    assignment_id  BIGSERIAL    PRIMARY KEY,
    track_id       BIGINT       NOT NULL REFERENCES track(track_id) ON DELETE CASCADE,
    lecturer_id    BIGINT       NOT NULL REFERENCES lecturer(lecturer_id) ON DELETE CASCADE,
    assignment_role VARCHAR(20) NOT NULL,
    created_at     TIMESTAMP,
    CONSTRAINT uq_track_lecturer_role UNIQUE (track_id, lecturer_id, assignment_role)
);
