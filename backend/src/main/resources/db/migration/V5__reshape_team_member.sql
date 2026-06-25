-- Xóa bỏ constraint cũ
ALTER TABLE team_member DROP CONSTRAINT IF EXISTS uq_member;

-- Xóa bỏ các cột cũ không còn tương thích với Entity mới
ALTER TABLE team_member DROP COLUMN IF EXISTS student_id;
ALTER TABLE team_member DROP COLUMN IF EXISTS is_leader;

-- Thêm các cột mới chuẩn theo Entity TeamMember (Account-based + Enum Role)
ALTER TABLE team_member ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES account(account_id);
ALTER TABLE team_member ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'MEMBER';

-- Tạo lại constraint đảm bảo 1 tài khoản chỉ được tham gia 1 lần vào cùng 1 đội
ALTER TABLE team_member ADD CONSTRAINT uq_member UNIQUE (account_id, team_id);
