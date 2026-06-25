-- V10__add_registration_phase.sql
-- Thêm thông tin đăng ký (Registration Phase) và giới hạn số đội (Max Teams) cho Event

ALTER TABLE event
    ADD COLUMN registration_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN registration_end_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN max_teams INTEGER NOT NULL DEFAULT 50;
