-- =============================================
-- TEST CASE: TC_EMP_02


-- 1. CHỤP ẢNH TRƯỚC KHI GỌI API (Postman: POST /api/employees?branch=HUE)

SELECT * FROM dbo.NhanVien WHERE MaNV = 'hue999';
GO

-- ... (Thực hiện gọi API POST trên Postman) ...

-- 2. CHỤP ẢNH SAU KHI GỌI API THÀNH CÔNG
-- Xác nhận nhân viên đã được thêm, cột TrangThai mặc định là 1
SELECT * FROM dbo.NhanVien WHERE MaNV = 'hue999';
GO
