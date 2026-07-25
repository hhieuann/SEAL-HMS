-- Judge and Mentor are event responsibilities of a Lecturer, not account roles.
-- Preserve existing guest-judge accounts by giving them a Lecturer profile first.
INSERT INTO lecturer (account_id, full_name, created_at, updated_at)
SELECT
    account_id,
    COALESCE(NULLIF(split_part(email, '@', 1), ''), 'Lecturer'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM account
WHERE role = 'GUEST_JUDGE'
ON CONFLICT (account_id) DO NOTHING;

UPDATE account
SET role = 'LECTURER',
    updated_at = CURRENT_TIMESTAMP
WHERE role = 'GUEST_JUDGE';
