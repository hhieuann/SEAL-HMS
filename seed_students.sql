-- Seed 18 student accounts (chuong1 -> chuong18)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  i INT;
  new_account_id BIGINT;
  student_codes TEXT[] := ARRAY[
    'SE170001','SE170002','SE170003','SE170004','SE170005','SE170006',
    'SE170007','SE170008','SE170009','SE170010','SE170011','SE170012',
    'SE170013','SE170014','SE170015','SE170016','SE170017','SE170018'
  ];
BEGIN
  FOR i IN 1..18 LOOP
    -- Skip if email already exists
    IF NOT EXISTS (SELECT 1 FROM account WHERE email = 'chuong' || i || '@gmail.com') THEN
      INSERT INTO account (email, password, role, status, created_at, updated_at)
      VALUES (
        'chuong' || i || '@gmail.com',
        crypt('chuong' || i, gen_salt('bf', 10)),
        'STUDENT',
        'ACTIVE',
        NOW(),
        NOW()
      )
      RETURNING account_id INTO new_account_id;

      INSERT INTO student (account_id, first_name, last_name, campus, student_code, created_at, updated_at)
      VALUES (
        new_account_id,
        'Chuong',
        i::TEXT,
        'Ho Chi Minh',
        student_codes[i],
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;

-- Verify result
SELECT a.account_id, a.email, a.role, a.status, s.first_name, s.last_name, s.campus, s.student_code
FROM account a
JOIN student s ON a.account_id = s.account_id
WHERE a.email LIKE 'chuong%@gmail.com'
ORDER BY a.account_id;
