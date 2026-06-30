DO $$
DECLARE
    i INT;
    v_account_id BIGINT;
    v_password_hash VARCHAR := '$2a$10$GizmKhAPCxrBD6gTN2SHA.RNX2B3C6umVfhedcbSdERD6Ox5SeYum'; -- BCrypt hash of '123456'
    v_proof_url VARCHAR := '/uploads/5ed62783-4338-4952-a30f-3904e5787924.png';
BEGIN
    -- Bạn có thể thay đổi số lượng account cần tạo ở đây (hiện tại tạo từ 2 đến 30)
    FOR i IN 2..30 LOOP
        
        -- 1. Insert vào bảng account (Status = ACTIVE)
        INSERT INTO account (email, password, role, status, created_at, updated_at)
        VALUES (
            'hoang' || i || '@gmail.com',
            v_password_hash,
            'STUDENT',
            'ACTIVE',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING account_id INTO v_account_id;

        -- 2. Insert vào bảng student
        INSERT INTO student (account_id, first_name, last_name, campus, created_at, updated_at, student_code, proof_url)
        VALUES (
            v_account_id,
            'Hoang',
            i::VARCHAR,
            'Ho Chi Minh',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            'SE' || (200000 + i)::VARCHAR,
            v_proof_url
        );

    END LOOP;
END $$;
