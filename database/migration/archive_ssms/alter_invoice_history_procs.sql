-- ==========================================================
-- SCRIPT CẬP NHẬT STORE LỊCH SỬ HÓA ĐƠN VÀ CHI TIẾT
-- Chạy script này trên tất cả các Database Chi nhánh (Store_HN, Store_H, Store_SG)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. Cập nhật Store Lấy Danh sách Hóa đơn
ALTER PROCEDURE [dbo].[usp_Local_DanhSachHoaDon]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' 
        WHEN 'Store_HN' THEN 'HANOI' 
        WHEN 'Store_H' THEN 'HUE' 
        ELSE DB_NAME() 
    END;

    SELECT
        hd.MaHD,
        SUM(CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2))) AS TongTien,
        COUNT(ctd.MaSP) AS SoMon,
        hd.GhiChu,
        hd.NgayTao,
        hd.ChiNhanh,
        hd.MaNV,
        MAX(nv.HoTen) AS HoTenNhanVien,
        hd.MaKH,
        MAX(kh.HoTen) AS HoTenKhachHang
    FROM dbo.HoaDon hd
    LEFT JOIN dbo.ChiTietHoaDon ctd ON ctd.MaHD = hd.MaHD
    LEFT JOIN dbo.NhanVien nv ON nv.MaNV = hd.MaNV
    LEFT JOIN dbo.KhachHang kh ON kh.MaKH = hd.MaKH
    WHERE hd.ChiNhanh = @CurrentDBBranch OR DB_NAME() LIKE 'Central%'
    GROUP BY
        hd.MaHD, hd.GhiChu, hd.NgayTao, hd.ChiNhanh, hd.MaNV, hd.MaKH
    ORDER BY hd.NgayTao DESC;
END;
GO

-- 2. Cập nhật Store Xem Chi tiết Hóa đơn
ALTER PROCEDURE [dbo].[usp_Local_ChiTietHoaDon]
    @MaHD VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' 
        WHEN 'Store_HN' THEN 'HANOI' 
        WHEN 'Store_H' THEN 'HUE' 
        ELSE DB_NAME() 
    END;

    SELECT
        ctd.MaHD,
        ctd.MaSP,
        hh.TenHang,
        ctd.SoLuong,
        ctd.DonGia,
        CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2)) AS ThanhTien,
        hd.MaKH,
        kh.HoTen AS HoTenKhachHang
    FROM dbo.ChiTietHoaDon ctd
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = ctd.MaSP
    INNER JOIN dbo.HoaDon hd ON hd.MaHD = ctd.MaHD
    LEFT JOIN dbo.KhachHang kh ON kh.MaKH = hd.MaKH
    WHERE ctd.MaHD = @MaHD
      AND (hd.ChiNhanh = @CurrentDBBranch OR DB_NAME() LIKE 'Central%');
END;
GO
