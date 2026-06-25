-- V11__add_eliminated_teams_to_round.sql
-- Thêm cột eliminated_teams cho Round để lưu trữ số đội bị loại

ALTER TABLE round ADD COLUMN eliminated_teams INTEGER;
