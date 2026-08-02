-- BƯỚC 1: Chọn một nhân viên đang active (TrangThai = 1) để làm nạn nhân
-- Ghi chú lại TenDangNhap để lát nữa test trên Postman
SELECT TOP 1 MaNV, TenDangNhap, Quyen, TrangThai 
FROM dbo.TaiKhoan 
WHERE TrangThai = 1 
  AND Quyen NOT IN ('ADMIN_TOAN_BO', 'ADMIN_CHI_NHANH');

-- BƯỚC 2: Dùng lệnh SQL để khóa mỏm tài khoản này (Giả lập thao tác của Admin)
UPDATE dbo.TaiKhoan
SET TrangThai = 0
WHERE TenDangNhap = 'dang_thi_k_H010';

-- BƯỚC 3: Mở Postman lên, chạy API Đăng nhập với tài khoản 'nhanvien_test'.
-- => KỲ VỌNG: Postman trả về HTTP 401 hoặc 403 báo "Tài khoản đã bị khóa".

SELECT MaNV, TenDangNhap, TrangThai 
FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'dang_thi_k_H010';

-- =============================================
-- BƯỚC 4 (TEARDOWN - PHỤC HỒI DỮ LIỆU SAU KHI TEST XONG)

UPDATE dbo.TaiKhoan
SET TrangThai = 1
WHERE TenDangNhap = 'dang_thi_k_H010';
