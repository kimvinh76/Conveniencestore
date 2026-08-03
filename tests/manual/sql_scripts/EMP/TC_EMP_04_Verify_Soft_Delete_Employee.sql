-- =============================================
-- TEST CASE: TC_EMP_05
-- DESCRIPTION: Kiểm tra Xóa mềm nhân viên & Tự động khóa tài khoản

-- ==========================================
-- BƯỚC 1: CHẠY TRÊN SERVER CHI NHÁNH (VD: HUE_SERVER)
-- ==========================================
USE [Store_H]; 
GO

-- Ảnh 1.1: Trạng thái trước khi xóa (Kỳ vọng TrangThai = 1)
SELECT MaNV, HoTen, TrangThai 
FROM dbo.NhanVien 
WHERE MaNV = 'H015'; -- Sửa lại mã NV bạn đang test
GO

-- ... (Gọi API trên Postman: DELETE /api/employees/H015?branch=HUE) ...

-- Ảnh 1.2: Trạng thái sau khi xóa (Kỳ vọng TrangThai = 0 - Bị xóa mềm)
SELECT MaNV, HoTen, TrangThai 
FROM dbo.NhanVien 
WHERE MaNV = 'H015';
GO


-- ==========================================
-- BƯỚC 2: ĐỔI SANG CHẠY TRÊN SERVER TRUNG TÂM (CENTRAL)
-- ==========================================
USE [DDBMS]; 
GO

-- Ảnh 2.1: Kỳ vọng bảng TaiKhoan ở Central cũng đã tự động bị khóa (TrangThai = 0)
SELECT TenDangNhap, TrangThai
FROM dbo.TaiKhoan 
WHERE MaNV = 'H015';
GO
