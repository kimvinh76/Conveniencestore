-- =============================================
-- TEST DATA SCRIPT: KỊCH BẢN TẠO TÀI KHOẢN TẠI CHI NHÁNH
-- Nơi chạy: SSMS (Kết nối CENTRAL hoặc HUE đều được vì NhanVien có ở khắp nơi)
-- =============================================

-- ==========================
-- 0. TẠO SẴN DATA NHÂN VIÊN MỚI TINH (Phòng trường hợp DB đã hết nhân viên trống)
-- ==========================
-- Đặt chữ TRY CATCH để lỡ chạy lại nhiều lần bị trùng khóa chính (MaNV) thì nó bỏ qua, không báo lỗi đỏ
BEGIN TRY
    INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh) 
    VALUES ('NV_TEST_HUE_01', N'Nhân Viên Test Huế', N'Nhân viên bán hàng', 'test.hue@gmail.com', 'HUE');
    
    INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh) 
    VALUES ('NV_TEST_SG_01', N'Nhân Viên Test Sài Gòn', N'Nhân viên bán hàng', 'test.sg@gmail.com', 'SAIGON');
END TRY
BEGIN CATCH
    -- Bỏ qua lỗi nếu nhân viên đã tồn tại
END CATCH;

-- ==========================
-- TÌM KIẾM DỮ LIỆU ĐỂ TEST
-- ==========================

-- 1. KỊCH BẢN 1 (HAPPY PATH): Tìm 1 nhân viên thuộc chi nhánh HUE chưa có tài khoản
-- Dùng mã MaNV này để Postman tạo acc với tư cách Admin Huế (ChiNhanh: "HUE")
SELECT  nv.MaNV, nv.HoTen, nv.ChiNhanh
FROM dbo.NhanVien nv
LEFT JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV
WHERE tk.TenDangNhap IS NULL AND nv.ChiNhanh = 'HUE'; 

-- 2. KỊCH BẢN 2 (BẢO MẬT CHÉO CHI NHÁNH): Tìm 1 nhân viên thuộc chi nhánh SAIGON
-- Dùng mã MaNV này + ChiNhanh "SAIGON" nhét vào Postman (Vẫn đang dùng Token Admin Huế)
-- Kỳ vọng: Postman văng lỗi 403 Forbidden chặn quyền.
SELECT TOP 1 nv.MaNV, nv.HoTen, nv.ChiNhanh
FROM dbo.NhanVien nv
LEFT JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV
WHERE tk.TenDangNhap IS NULL AND nv.ChiNhanh = 'SAIGON'; 

-- ==========================
-- KIỂM CHỨNG SAU KHI TEST HAPPY PATH THÀNH CÔNG (POSTMAN TRẢ VỀ 201)
-- ==========================

-- 3. CHỨNG MINH TÀI KHOẢN ĐÃ ĐƯỢC INSERT THÀNH CÔNG 
-- Thay 'nv_hue_moi' bằng cái username bạn vừa nhập trên Postman
-- Lưu ý: Cột Quyen sẽ tự động là NHAN_VIEN dù bạn cố tình truyền ADMIN_TOAN_BO
SELECT tk.MaNV, tk.TenDangNhap, tk.Quyen, nv.ChiNhanh, tk.TrangThai 
FROM dbo.TaiKhoan tk
INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
WHERE tk.TenDangNhap = 'nv_hue_moi';
