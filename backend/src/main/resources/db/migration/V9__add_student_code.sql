-- Student code (e.g. "SE161234"). Unique per student; nullable so existing rows stay
-- valid, while registration requires it for new STUDENT accounts (enforced in the service).
ALTER TABLE student ADD COLUMN IF NOT EXISTS student_code VARCHAR(20);
ALTER TABLE student ADD CONSTRAINT uq_student_code UNIQUE (student_code);
