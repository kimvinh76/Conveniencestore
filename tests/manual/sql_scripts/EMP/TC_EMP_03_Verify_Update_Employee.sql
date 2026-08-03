-- =============================================
-- TEST CASE: TC_EMP_03_01
-- DESCRIPTION: Kiểm tra cập nhật thông tin nhân viên thành công (Happy Case)
-- CHÚ Ý: Chạy script này trên Server Chi Nhánh (VD: HUE_SERVER - Store_H)
-- =============================================

USE [Store_H]; -- Thay bằng Store_SG hoặc Store_HN nếu test ở nhánh khác
GO

-- 1. CHỤP ẢNH TRƯỚC KHI GỌI API
-- Thay 'hue001' bằng mã nhân viên bạn định test trên Postman
-- Lưu ý các thông tin hiện tại (như HoTen, ChucVu, Email) để so sánh
SELECT 
    MaNV, 
    HoTen, 
    ChucVu, 
    Email,
    ChiNhanh,
    TrangThai 
FROM 
    dbo.NhanVien 
WHERE 
    MaNV = 'hue001';
GO

-- ... (Thực hiện gọi API PUT trên Postman: PUT /api/employees/hue001?branch=HUE) ...
-- ... (Body đổi HoTen thành tên mới hoặc đổi Email) ...

-- 2. CHỤP ẢNH SAU KHI GỌI API THÀNH CÔNG
-- Xác nhận thông tin HoTen, ChucVu hoặc Email đã thực sự thay đổi trong Database
SELECT 
    MaNV, 
    HoTen, 
    ChucVu, 
    Email,
    ChiNhanh,
    TrangThai 
FROM 
    dbo.NhanVien 
WHERE 
    MaNV = 'hue001';
GO
