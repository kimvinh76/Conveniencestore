-- =============================================
-- TEST CASE: TC_EMP_01


USE [Store_H]; -- Thay bằng Store_SG hoặc Store_HN nếu test ở nhánh khác
GO

-- 1. Lấy toàn bộ danh sách nhân viên của chi nhánh Huế
-- Đối chiếu số lượng và thông tin với kết quả trả về từ API: GET /api/employees?branch=HUE
SELECT 
    MaNV, 
    HoTen, 
    ChucVu, 
    ChiNhanh, 
    TrangThai, 
    Email
FROM 
    dbo.NhanVien
WHERE 
    ChiNhanh = 'HUE';
GO
