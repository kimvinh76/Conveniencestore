-- ==========================================================
-- BỔ SUNG CẬP NHẬT STORE: usp_Local_TaoHoaDonNhieuDong
-- (Chạy trên các Database Chi Nhánh: Store_HN, Store_H, Store_SG)

-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[usp_Local_TaoHoaDonNhieuDong]
    @MaHD VARCHAR(50),
    @MaNV VARCHAR(50),
    @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    
    IF @ChiNhanhLap <> 'SAIGON'
        THROW 50000, N'Procedure local chỉ cho phép @ChiNhanhLap tương ứng với chi nhánh hiện tại.', 1;

    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL
        THROW 50000, N'Mã hóa đơn không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ItemsJson)), '') IS NULL
        THROW 50000, N'Danh sách món hàng không được để trống!', 1;

  
    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = 'SAIGON')
        THROW 50001, N'Nhân viên không tồn tại ở chi nhánh này!', 1;

    DECLARE @Items TABLE (
        MaSP VARCHAR(50) NOT NULL,
        SoLuong INT NOT NULL,
        DonGia DECIMAL(10,2) NULL
    );

    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT
        LTRIM(RTRIM(MaSP)),
        SoLuong,
        DonGia
    FROM OPENJSON(@ItemsJson)
    WITH (
        MaSP VARCHAR(50) '$.MaSP',
        SoLuong INT '$.SoLuong',
        DonGia DECIMAL(10,2) '$.DonGia'
    );

    IF NOT EXISTS (SELECT 1 FROM @Items)
        THROW 50002, N'Danh sách món hàng rỗng hoặc sai định dạng JSON!', 1;

    IF EXISTS (
        SELECT 1 FROM @Items
        WHERE NULLIF(LTRIM(RTRIM(MaSP)), '') IS NULL OR SoLuong IS NULL OR SoLuong <= 0
    )
        THROW 50003, N'Mỗi dòng món phải có MaSP và SoLuong > 0!', 1;

   
    -- LOGIC MỚI: CHẶN TẠO HÓA ĐƠN CHO SẢN PHẨM ĐÃ BỊ XÓA MỀM (Ngừng kinh doanh)

    IF EXISTS (
        SELECT 1 FROM @Items i
        INNER JOIN dbo.HangHoa h ON h.MaSP = i.MaSP
        WHERE h.TrangThai = 0
    )
    BEGIN
        THROW 50006, N'Hóa đơn chứa sản phẩm đã bị ngừng kinh doanh (Xóa mềm)! Không thể bán.', 1;
    END;

    BEGIN TRY
        BEGIN TRANSACTION;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
            FROM @Items
            GROUP BY MaSP
        )
        SELECT 1
        FROM Agg a
        LEFT JOIN dbo.HangHoa h ON h.MaSP = a.MaSP
        WHERE COALESCE(NULLIF(a.DonGia, 0), h.Gia, 0) <= 0;

        IF @@ROWCOUNT > 0
            THROW 50004, N'Không xác định được đơn giá cho một hoặc nhiều sản phẩm!', 1;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong
            FROM @Items
            GROUP BY MaSP
        )
        SELECT 1
        FROM Agg a
      
        LEFT JOIN dbo.TonKho t ON t.MaSP = a.MaSP AND t.ChiNhanh = 'SAIGON'
        WHERE t.SoLuongTon IS NULL OR t.SoLuongTon < a.SoLuong;

        IF @@ROWCOUNT > 0
            THROW 50005, N'Kho cục bộ không đủ số lượng cho một hoặc nhiều sản phẩm!', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.HoaDon WHERE MaHD = @MaHD)
        
            INSERT INTO dbo.HoaDon (MaHD, GhiChu, ChiNhanh, MaNV)
            VALUES (@MaHD, @GhiChu, 'SAIGON', @MaNV);

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
            FROM @Items
            GROUP BY MaSP
        )
        INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia)
        SELECT
            @MaHD,
            a.MaSP,
            a.SoLuong,
            COALESCE(NULLIF(a.DonGia, 0), h.Gia)
        FROM Agg a
        JOIN dbo.HangHoa h ON h.MaSP = a.MaSP;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong
            FROM @Items
            GROUP BY MaSP
        )
        UPDATE t
        SET t.SoLuongTon = t.SoLuongTon - a.SoLuong
        FROM dbo.TonKho t
        JOIN Agg a ON a.MaSP = t.MaSP
     
        WHERE t.ChiNhanh = 'SAIGON';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
