-- ==========================================
-- FILE: verify_post_auth_login.sql
-- API: POST /api/auth/login
-- ==========================================

-- [CASE 1 - 9]: Đăng nhập với các trạng thái hợp lệ và không hợp lệ (Không cần SQL Setup)
-- Các case lỗi mật khẩu, bỏ trống, SQL Injection được xử lý trực tiếp ở Application Layer.

-- ==========================================
-- [CASE 10]: Đăng nhập bằng tài khoản đang bị khóa
-- ==========================================

-- [SETUP]: Chọn một nhân viên đang active (TrangThai = 1) để làm nạn nhân và khóa tài khoản
-- Chạy đoạn này TRƯỚC KHI chạy Runner
UPDATE dbo.TaiKhoan
SET TrangThai = 0
WHERE TenDangNhap = 'dang_thi_k_H010';

-- [VERIFY]: Chạy câu này trong lúc/sau khi test để chắc chắn tài khoản dưới DB đã bị khóa thật
SELECT MaNV, TenDangNhap, TrangThai 
FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'dang_thi_k_H010';
-- KỲ VỌNG DB: TrangThai = 0
-- KỲ VỌNG API: 403 Forbidden hoặc 401 Unauthorized

-- [TEARDOWN]: Mở khóa lại tài khoản sau khi test xong
-- Chạy đoạn này SAU KHI chạy Runner
UPDATE dbo.TaiKhoan
SET TrangThai = 1
WHERE TenDangNhap = 'dang_thi_k_H010';
