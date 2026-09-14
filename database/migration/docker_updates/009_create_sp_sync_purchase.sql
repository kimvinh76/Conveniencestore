-- File: 009_create_sp_sync_purchase.sql
-- Description: SP đồng bộ Phiếu Nhập Hàng từ các chi nhánh về Central. Đồng thời CỘNG TỒN KHO tại Central.

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DongBoPhieuNhap]
    @MaPN VARCHAR(50),
    @ChiNhanhLap VARCHAR(10),
    @GhiChu NVARCHAR(255) = NULL,
    @MaNCC VARCHAR(50) = NULL,
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Kiểm tra đầu vào
    IF ISJSON(@ItemsJson) = 0 OR @ItemsJson IS NULL
        THROW 50000, N'Dữ liệu sản phẩm (JSON) không hợp lệ!', 1;
    IF NULLIF(LTRIM(RTRIM(@MaPN)), '') IS NULL 
        THROW 50000, N'Mã phiếu nhập không hợp lệ!', 1;

    -- Tránh insert trùng nếu retry
    IF EXISTS (SELECT 1 FROM dbo.PhieuNhap WHERE MaPN = @MaPN)
        RETURN;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Đọc danh sách hàng hóa từ JSON
        CREATE TABLE #TempItems (
            MaSP VARCHAR(50),
            SoLuong INT,
            DonGiaNhap DECIMAL(18,2)
        );

        INSERT INTO #TempItems (MaSP, SoLuong, DonGiaNhap)
        SELECT 
            LTRIM(RTRIM(MaSP)), 
            SoLuong, 
            ISNULL(DonGiaNhap, 0)
        FROM OPENJSON(@ItemsJson)
        WITH (
            MaSP VARCHAR(50) '$.productCode',
            SoLuong INT '$.quantity',
            DonGiaNhap DECIMAL(18,2) '$.price'
        );

        -- 2. Tính tổng tiền nhập
        DECLARE @TongTien DECIMAL(18,2) = 0;
        SELECT @TongTien = ISNULL(SUM(SoLuong * DonGiaNhap), 0) FROM #TempItems;

        -- 3. Lưu thông tin Phiếu Nhập (Sử dụng giờ Việt Nam)
        DECLARE @VNTime DATETIME = DATEADD(hour, 7, GETUTCDATE());
        
        INSERT INTO dbo.PhieuNhap (MaPN, NgayNhap, ChiNhanh, TongTien, GhiChu, MaNCC)
        VALUES (@MaPN, @VNTime, @ChiNhanhLap, @TongTien, @GhiChu, @MaNCC);

        -- 4. Lưu Chi Tiết Phiếu Nhập
        INSERT INTO dbo.ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
        SELECT @MaPN, MaSP, SoLuong, DonGiaNhap FROM #TempItems;

        -- 5. CỘNG TỒN KHO TRÊN CENTRAL
        -- Cập nhật số lượng cho những mã đã tồn tại
        UPDATE tk
        SET tk.SoLuongTon = tk.SoLuongTon + a.SoLuong
        FROM dbo.TonKho tk
        INNER JOIN (
            SELECT MaSP, SUM(SoLuong) as SoLuong FROM #TempItems GROUP BY MaSP
        ) a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @ChiNhanhLap;

        -- Thêm mới dòng tồn kho cho những mã chưa từng tồn tại ở chi nhánh đó
        INSERT INTO dbo.TonKho (MaSP, ChiNhanh, SoLuongTon)
        SELECT a.MaSP, @ChiNhanhLap, a.SoLuong
        FROM (
            SELECT MaSP, SUM(SoLuong) as SoLuong FROM #TempItems GROUP BY MaSP
        ) a
        LEFT JOIN dbo.TonKho tk ON a.MaSP = tk.MaSP AND tk.ChiNhanh = @ChiNhanhLap
        WHERE tk.MaSP IS NULL;

        DROP TABLE #TempItems;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
