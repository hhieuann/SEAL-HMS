CREATE TABLE mentor_message (
    message_id SERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    sender_account_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mentor_message_team FOREIGN KEY (team_id) REFERENCES team (team_id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_message_sender FOREIGN KEY (sender_account_id) REFERENCES account (account_id) ON DELETE CASCADE
);
