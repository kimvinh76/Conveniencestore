-- File: 007_create_sp_local_account.sql
-- Description: Tạo SP usp_Local_DanhSachTaiKhoan (dùng chung cho tất cả node)
-- Phiên bản mới không hardcode ChiNhanh — lấy tất cả tài khoản trên node local

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- SP Danh sách tài khoản local (join với NhanVien để lấy HoTen + ChiNhanh)
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachTaiKhoan]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        tk.TenDangNhap, 
        tk.MaNV, 
        nv.HoTen, 
        tk.Quyen, 
        tk.TrangThai,
        nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    ORDER BY tk.TenDangNhap;
END;
GO
