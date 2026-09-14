USE [DDBMS] -- Thay thế bằng tên database thật nếu cần khi chạy thủ công
GO

/****** Object:  StoredProcedure [dbo].[usp_Local_DashboardTongQuan] ******/
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardTongQuan]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(1) FROM dbo.NhanVien WHERE ChiNhanh = @ChiNhanh) AS employeeCount,
        (SELECT COUNT(1) FROM dbo.HoaDon WHERE ChiNhanh = @ChiNhanh) AS invoiceCount,
        (
            SELECT ISNULL(SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))), 0)
            FROM dbo.HoaDon hd
            INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
            WHERE hd.ChiNhanh = @ChiNhanh
        ) AS revenue,
        (SELECT ISNULL(SUM(SoLuongTon), 0) FROM dbo.TonKho WHERE ChiNhanh = @ChiNhanh) AS totalStockUnits,
        (
            SELECT ISNULL(SUM(CASE WHEN SoLuongTon < 50 THEN 1 ELSE 0 END), 0)
            FROM dbo.TonKho
            WHERE ChiNhanh = @ChiNhanh
        ) AS lowStockProducts;
END;
GO

/****** Object:  StoredProcedure [dbo].[usp_Local_DashboardDoanhThu7Ngay] ******/
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardDoanhThu7Ngay]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Last7Days AS (
        SELECT CAST(DATEADD(DAY, v.n * -1, CAST(GETDATE() AS DATE)) AS DATE) AS Ngay
        FROM (VALUES (0), (1), (2), (3), (4), (5), (6)) v(n)
    )
    SELECT
        d.Ngay,
        ISNULL(SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))), 0) AS DoanhThu
    FROM Last7Days d
    LEFT JOIN dbo.HoaDon hd
      ON CAST(hd.NgayTao AS DATE) = d.Ngay
     AND hd.ChiNhanh = @ChiNhanh
    LEFT JOIN dbo.ChiTietHoaDon ct
      ON ct.MaHD = hd.MaHD
    GROUP BY d.Ngay
    ORDER BY d.Ngay;
END;
GO

/****** Object:  StoredProcedure [dbo].[usp_Local_DashboardTopTonKho] ******/
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardTopTonKho]
    @ChiNhanh VARCHAR(10),
    @TopN INT = 8
AS
BEGIN
    SET NOCOUNT ON;

    IF @TopN IS NULL OR @TopN <= 0
        SET @TopN = 8;

    SELECT TOP (@TopN)
        tk.MaSP,
        hh.TenHang,
        tk.SoLuongTon
    FROM dbo.TonKho tk
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = tk.MaSP
    WHERE tk.ChiNhanh = @ChiNhanh
    ORDER BY tk.SoLuongTon DESC, tk.MaSP;
END;
GO
