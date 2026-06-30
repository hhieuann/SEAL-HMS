-- Tạo 5 team còn lại (Team 2-6) cho chuong4-chuong18
-- team_member không có created_at/updated_at, team có

DO $$
DECLARE
  event_id_val BIGINT := 1;
  t_id BIGINT;

  teams    TEXT[]    := ARRAY['Team 2','Team 3','Team 4','Team 5','Team 6'];
  leaders  BIGINT[]  := ARRAY[11, 14, 17, 20, 23];
  member2s BIGINT[]  := ARRAY[12, 15, 18, 21, 24];
  member3s BIGINT[]  := ARRAY[13, 16, 19, 22, 25];
  i INT;
BEGIN
  -- Rename existing Team 1 for clarity
  UPDATE team SET name = 'Team 1' WHERE team_id = 3;

  FOR i IN 1..5 LOOP
    -- Remove stale memberships if any
    DELETE FROM team_member
    WHERE account_id IN (leaders[i], member2s[i], member3s[i]);

    -- Create team
    INSERT INTO team (event_id, name, status, created_at, updated_at)
    VALUES (event_id_val, teams[i], 'CREATED', NOW(), NOW())
    RETURNING team_id INTO t_id;

    -- Leader
    INSERT INTO team_member (team_id, account_id, role, status)
    VALUES (t_id, leaders[i],  'LEADER', 'ACCEPTED');

    -- Member 2
    INSERT INTO team_member (team_id, account_id, role, status)
    VALUES (t_id, member2s[i], 'MEMBER', 'ACCEPTED');

    -- Member 3
    INSERT INTO team_member (team_id, account_id, role, status)
    VALUES (t_id, member3s[i], 'MEMBER', 'ACCEPTED');
  END LOOP;
END $$;

-- Kết quả
SELECT t.team_id, t.name AS team_name,
       a.email, tm.role AS member_role
FROM team t
JOIN team_member tm ON t.team_id = tm.team_id
JOIN account a ON tm.account_id = a.account_id
WHERE a.email LIKE 'chuong%@gmail.com'
ORDER BY t.team_id, tm.role DESC;
