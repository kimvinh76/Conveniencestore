-- =============================================
-- TEST CASE: TC_EMP_03


USE [DDBMS]; -- Thay bằng tên DB Central của bạn
GO

-- 1. Giả lập Admin Toàn Bộ chọn xem chi nhánh SÀI GÒN trên Giao diện
-- Đối chiếu với kết quả trả về từ API: GET /api/employees?branch=SAIGON (Chạy bằng Token của ADMIN_TOAN_BO)
-- Mặc dù API móc xuống DB Sài Gòn, nhưng do gọi bằng Token ADMIN_TOAN_BO nên Node.js cho phép đi qua
SELECT 
    MaNV, 
    HoTen, 
    ChucVu, 
    ChiNhanh, 
    TrangThai
FROM 
    [SG_SERVER].[Store_SG].dbo.NhanVien
ORDER BY 
    MaNV;
GO
