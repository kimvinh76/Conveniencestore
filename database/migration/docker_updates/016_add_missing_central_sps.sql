-- File: 016_add_missing_central_sps.sql
-- Description: Bổ sung các Store Procedure bị thiếu trên Central DB (Tồn kho, Phiếu nhập) để hỗ trợ API Frontend

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

---------------------------------------------------------
-- 1. DANH SÁCH TỒN KHO TRÊN CENTRAL
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachTonKho]
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy toàn bộ tồn kho trên Central DB (gom của mọi chi nhánh)
    -- Giống logic của nhánh nhưng không filter theo chi nhánh hiện tại
    SELECT t.MaSP, t.SoLuongTon, t.ChiNhanh
    FROM dbo.TonKho t
    INNER JOIN dbo.HangHoa h ON h.MaSP = t.MaSP
    WHERE (h.TrangThai = 1 OR t.SoLuongTon > 0)
    ORDER BY t.MaSP, t.ChiNhanh;
END;
GO

---------------------------------------------------------
-- 2. DANH SÁCH PHIẾU NHẬP TRÊN CENTRAL
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachPhieuNhap]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT pn.MaPN, pn.NgayNhap, pn.GhiChu, pn.MaNCC, pn.ChiNhanh AS ChiNhanhLap, 
           ncc.TenNCC,
           ISNULL((SELECT SUM(SoLuong * DonGiaNhap) FROM dbo.ChiTietPhieuNhap WHERE MaPN = pn.MaPN), 0) as TongTien
    FROM dbo.PhieuNhap pn
    LEFT JOIN dbo.NhaCungCap ncc ON pn.MaNCC = ncc.MaNCC
    ORDER BY pn.NgayNhap DESC;
END;
GO

---------------------------------------------------------
-- 3. CHI TIẾT PHIẾU NHẬP TRÊN CENTRAL
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachChiTietPhieuNhap]
    @MaPN VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ct.MaPN, ct.MaSP, h.TenHang, ct.SoLuong, ct.DonGiaNhap, 
           CAST(ct.SoLuong * ct.DonGiaNhap AS DECIMAL(18,2)) as ThanhTienNhap
    FROM dbo.ChiTietPhieuNhap ct
    INNER JOIN dbo.HangHoa h ON h.MaSP = ct.MaSP
    WHERE ct.MaPN = @MaPN
    ORDER BY ct.MaSP;
END;
GO
