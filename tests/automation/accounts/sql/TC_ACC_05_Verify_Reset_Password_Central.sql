SELECT TenDangNhap, MatKhau 
FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'hue015';

-- =============================================
-- BƯỚC 2: Gọi API trên Postman
-- =============================================
-- 1. Login bằng admin_tong
-- 2. Gọi PATCH /api/accounts/central/nv_hue_moi/reset-password
--    Truyền Body: { "branch": "HUE" }
-- 3. Postman báo 200 OK "Password reset successfully"

-- =============================================
-- BƯỚC 3: Kiểm chứng Mật khẩu đã BỊ THAY ĐỔI
-- =============================================
-- Chạy lại lệnh này, so sánh cột MatKhau. 
-- KẾT QUẢ KỲ VỌNG: Đoạn mã Hash bắt buộc phải thay đổi thành một dải ký tự hoàn toàn mới!
SELECT TenDangNhap, MatKhau 
FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'hue015';
