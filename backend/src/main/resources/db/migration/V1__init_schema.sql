-- V1__init_schema.sql  (PostgreSQL)  — SEAL-HMS initial schema
-- camelCase Java fields map to these snake_case columns automatically (Hibernate default).

CREATE TABLE account (
    account_id BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(30)  NOT NULL,                    -- ADMIN, STAFF, LECTURER, STUDENT, GUEST_JUDGE
    status     VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- ACTIVE, PENDING, DISABLED
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE chapter (
    chapter_id   BIGSERIAL PRIMARY KEY,
    chapter_name VARCHAR(150) NOT NULL,
    bonus_point  INT NOT NULL DEFAULT 0
);

CREATE TABLE student (
    student_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL UNIQUE REFERENCES account(account_id),
    first_name VARCHAR(100),
    last_name  VARCHAR(100),
    campus     VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE lecturer (
    lecturer_id BIGSERIAL PRIMARY KEY,
    account_id  BIGINT NOT NULL UNIQUE REFERENCES account(account_id),
    full_name   VARCHAR(150),
    department  VARCHAR(100),
    campus      VARCHAR(100),
    phone       VARCHAR(20),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE event (
    event_id    BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    type        VARCHAR(50),
    start_date  DATE,
    end_date    DATE,
    status      VARCHAR(20) NOT NULL DEFAULT 'PLANNED',  -- PLANNED, UPCOMING, ONGOING, COMPLETED, CANCELLED
    description TEXT,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE round (
    round_id        BIGSERIAL PRIMARY KEY,
    event_id        BIGINT NOT NULL REFERENCES event(event_id),
    round_name      VARCHAR(150),
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    promotion_top_n INT,
    status          VARCHAR(20) NOT NULL DEFAULT 'CREATED', -- CREATED, ACTIVE, SCORING, UNDER_REVIEW, COMPLETED
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE track (
    track_id    BIGSERIAL PRIMARY KEY,
    event_id    BIGINT NOT NULL REFERENCES event(event_id),
    lecturer_id BIGINT REFERENCES lecturer(lecturer_id),
    name        VARCHAR(150),
    description TEXT,
    max_teams   INT
);

CREATE TABLE mentor (
    mentor_id   BIGSERIAL PRIMARY KEY,
    lecturer_id BIGINT NOT NULL REFERENCES lecturer(lecturer_id),
    track_id    BIGINT NOT NULL REFERENCES track(track_id)
);

CREATE TABLE judge (
    judge_id    BIGSERIAL PRIMARY KEY,
    lecturer_id BIGINT NOT NULL REFERENCES lecturer(lecturer_id),  -- TODO: support guest judges (nullable + account_id)
    round_id    BIGINT NOT NULL REFERENCES round(round_id)
);

CREATE TABLE event_lecturer (
    lecturer_id BIGINT NOT NULL REFERENCES lecturer(lecturer_id),
    event_id    BIGINT NOT NULL REFERENCES event(event_id),
    PRIMARY KEY (lecturer_id, event_id)
);

CREATE TABLE topic (
    topic_id    BIGSERIAL PRIMARY KEY,
    track_id    BIGINT NOT NULL REFERENCES track(track_id),
    round_id    BIGINT REFERENCES round(round_id),
    topic_name  VARCHAR(200),
    description TEXT
);

CREATE TABLE criterion (
    criterion_id  BIGSERIAL PRIMARY KEY,
    round_id      BIGINT NOT NULL REFERENCES round(round_id),
    criteria_name VARCHAR(200),
    max_score     NUMERIC(6,2),
    weight        NUMERIC(5,2)
);

CREATE TABLE team (
    team_id     BIGSERIAL PRIMARY KEY,
    chapter_id  BIGINT REFERENCES chapter(chapter_id),
    topic_id    BIGINT REFERENCES topic(topic_id),
    track_id    BIGINT REFERENCES track(track_id),
    name        VARCHAR(150) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'CREATED', -- CREATED, REGISTERED, CONFIRMED, IN_PROGRESS, COMPLETED, REJECTED, WITHDRAWN, DISQUALIFIED
    event_score NUMERIC(8,2),   -- derived: SUM(round_ranking.score). Never edited by hand.
    event_rank  INT,            -- derived
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE team_member (
    member_id  BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES student(student_id),
    team_id    BIGINT NOT NULL REFERENCES team(team_id),
    is_leader  BOOLEAN NOT NULL DEFAULT FALSE,
    status     VARCHAR(20) NOT NULL DEFAULT 'INVITED', -- INVITED, ACCEPTED, DECLINED, WITHDRAWN
    CONSTRAINT uq_member UNIQUE (student_id, team_id)
);

CREATE TABLE round_ranking (
    round_ranking_id BIGSERIAL PRIMARY KEY,
    team_id          BIGINT NOT NULL REFERENCES team(team_id),
    round_id         BIGINT NOT NULL REFERENCES round(round_id),
    score            NUMERIC(8,2),
    rank             INT,
    is_promoted      BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_team_round UNIQUE (team_id, round_id)
);

CREATE TABLE submission (
    submission_id    BIGSERIAL PRIMARY KEY,
    round_ranking_id BIGINT NOT NULL REFERENCES round_ranking(round_ranking_id),
    submitted_by     BIGINT REFERENCES account(account_id),  -- which member (account) submitted
    submission_name  VARCHAR(200),
    description      TEXT,
    tech_stack_name  VARCHAR(200),
    github_url       VARCHAR(300),
    demo_url         VARCHAR(300),
    slide_url        VARCHAR(300),
    status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, LOCKED, SCORING, EVALUATED
    submitted_at     TIMESTAMP,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);

CREATE TABLE score (
    score_id      BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submission(submission_id),
    judge_id      BIGINT NOT NULL REFERENCES judge(judge_id),
    criterion_id  BIGINT NOT NULL REFERENCES criterion(criterion_id),
    score         NUMERIC(6,2),
    comment       TEXT
);

CREATE TABLE prize (
    prize_id   BIGSERIAL PRIMARY KEY,
    event_id   BIGINT NOT NULL REFERENCES event(event_id),
    team_id    BIGINT REFERENCES team(team_id),  -- null until awarded
    name       VARCHAR(150),
    rank       INT,
    value      NUMERIC(12,2),
    prize_type VARCHAR(50)
);

CREATE INDEX idx_round_event       ON round(event_id);
CREATE INDEX idx_track_event       ON track(event_id);
CREATE INDEX idx_submission_rr     ON submission(round_ranking_id);
CREATE INDEX idx_score_submission  ON score(submission_id);
CREATE INDEX idx_team_member_team  ON team_member(team_id);
