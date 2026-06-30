-- ============================================================
-- SEAL-HMS Database Cleanup Script
-- Xóa tất cả event + dữ liệu liên quan
-- Xóa tài khoản STUDENT, GUEST_JUDGE, STAFF
-- Chỉ giữ lại ADMIN và LECTURER
-- ============================================================
-- ⚠️  CẢNH BÁO: Script này XÓA VĨNH VIỄN dữ liệu!
--     Hãy backup database trước khi chạy.
-- ============================================================

BEGIN;

-- ===================== 1. XÓA DỮ LIỆU EVENT (theo thứ tự FK) =====================

-- 1a. Score (phụ thuộc submission, judge, criterion)
DELETE FROM score;

-- 1b. Submission (phụ thuộc round_ranking)
DELETE FROM submission;

-- 1c. Round Ranking (phụ thuộc team, round)
DELETE FROM round_ranking;

-- 1d. Prize (phụ thuộc event, team)
DELETE FROM prize;

-- 1e. Team Member (phụ thuộc team, account)
DELETE FROM team_member;

-- 1f. Team (phụ thuộc event, track, topic)
DELETE FROM team;

-- 1g. Track Assignment (phụ thuộc track, lecturer)
DELETE FROM track_assignment;

-- 1h. Mentor (phụ thuộc lecturer, track)
DELETE FROM mentor;

-- 1i. Judge (phụ thuộc lecturer, round)
DELETE FROM judge;

-- 1j. Topic (phụ thuộc track, round, event)
DELETE FROM topic;

-- 1k. Criterion (phụ thuộc round)
DELETE FROM criterion;

-- 1l. Track (phụ thuộc event, lecturer)
DELETE FROM track;

-- 1m. Round (phụ thuộc event)
DELETE FROM round;

-- 1n. Event-Lecturer junction
DELETE FROM event_lecturer;

-- 1o. Event
DELETE FROM event;

-- 1p. Chapter (standalone)
DELETE FROM chapter;

-- ===================== 2. XÓA TÀI KHOẢN KHÔNG CẦN THIẾT =====================

-- 2a. Student (phụ thuộc account) — xóa tất cả student profiles
DELETE FROM student;

-- 2b. Xóa account STUDENT, GUEST_JUDGE, STAFF
DELETE FROM account WHERE role IN ('STUDENT', 'GUEST_JUDGE');

-- ===================== 3. RESET SEQUENCES (optional) =====================

-- Reset auto-increment sequences về 1 cho sạch
ALTER SEQUENCE IF EXISTS score_score_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS submission_submission_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS round_ranking_round_ranking_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS prize_prize_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_member_member_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS team_team_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS track_assignment_assignment_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS mentor_mentor_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS judge_judge_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS topic_topic_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS criterion_criterion_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS track_track_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS round_round_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS event_event_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chapter_chapter_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS student_student_id_seq RESTART WITH 1;

COMMIT;

-- ===================== 4. KIỂM TRA KẾT QUẢ =====================
SELECT 'Remaining accounts:' AS info;
SELECT account_id, email, role, status FROM account ORDER BY account_id;
