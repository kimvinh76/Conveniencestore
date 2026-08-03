

-- =============================================
-- BƯỚC 1: Lấy TrangThai HIỆN TẠI của tài khoản Nhân Viên trước khi Khóa
-- =============================================
-- Chạy lệnh này để xem TrangThai đang là 1 (Đang hoạt động) hay 0 (Bị khóa)
SELECT TenDangNhap, Quyen, ChiNhanh, tk.TrangThai 
FROM dbo.TaiKhoan tk
INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
WHERE TenDangNhap = 'hue015';

-- =============================================
-- BƯỚC 2: Gọi API trên Postman
-- =============================================
-- 1. Login bằng admin_tong
-- 2. Gọi PATCH /api/accounts/central/hue015/lock
--    Truyền Body: { "branch": "HUE" }
-- 3. Postman báo 200 OK "Account locked"

-- =============================================
-- BƯỚC 3: Kiểm chứng Mật khẩu đã BỊ KHÓA
-- =============================================
-- Chạy lại lệnh dưới đây. 
-- KẾT QUẢ KỲ VỌNG: Cột TrangThai phải đổi từ 1 thành 0!
SELECT TenDangNhap, Quyen, ChiNhanh, tk.TrangThai 
FROM dbo.TaiKhoan tk
INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
WHERE TenDangNhap = 'hue015';

-- =============================================
-- KỊCH BẢN MỞ KHÓA (UNLOCK) LÀM TƯƠNG TỰ
-- =============================================
-- Gọi API PATCH /api/accounts/central/hue015/unlock
-- Chạy lại lệnh SELECT trên, TrangThai phải đổi ngược lại từ 0 thành 1!
