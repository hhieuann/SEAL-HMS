-- V2__add_round_sequence.sql
-- Add sequence tracking to rounds (e.g., 1 = Preliminary, 2 = Finals)

ALTER TABLE round ADD COLUMN round_seq INT NOT NULL DEFAULT 1;
