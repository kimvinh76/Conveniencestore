USE [CentralDB];
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Xem tài khoản từ linked server (3 chi nhánh)
CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachTaiKhoanToanBo
AS
BEGIN
    SET NOCOUNT ON;

    -- Tài khoản Central trước
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'CENTRAL'

    UNION ALL

    -- Tài khoản từ HUE (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [HUE_SERVER].[Store_H].dbo.TaiKhoan tk
    INNER JOIN [HUE_SERVER].[Store_H].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'HUE'

    UNION ALL

    -- Tài khoản từ SAIGON (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [SG_SERVER].[Store_SG].dbo.TaiKhoan tk
    INNER JOIN [SG_SERVER].[Store_SG].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'SAIGON'

    UNION ALL

    -- Tài khoản từ HANOI (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [HN_SERVER].[Store_HN].dbo.TaiKhoan tk
    INNER JOIN [HN_SERVER].[Store_HN].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'HANOI'

    ORDER BY ChiNhanh, TenDangNhap;
END;
GO
