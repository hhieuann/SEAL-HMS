CREATE TABLE team_mentor (
    team_id BIGINT NOT NULL,
    lecturer_id BIGINT NOT NULL,
    PRIMARY KEY (team_id, lecturer_id),
    CONSTRAINT fk_team_mentor_team FOREIGN KEY (team_id) REFERENCES team (team_id) ON DELETE CASCADE,
    CONSTRAINT fk_team_mentor_lecturer FOREIGN KEY (lecturer_id) REFERENCES lecturer (lecturer_id) ON DELETE CASCADE
);
