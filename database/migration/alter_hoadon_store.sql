-- ==========================================================
-- SCRIPT CẬP NHẬT BẢNG HOADON VÀ STORE TAOHOADON
-- Chạy script này trên tất cả các Database Chi nhánh (Store_HN, Store_H, Store_SG)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. THÊM CỘT MaKH VÀO BẢNG HoaDon
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'MaKH' AND Object_ID = Object_ID(N'dbo.HoaDon')
)
BEGIN
    ALTER TABLE dbo.HoaDon
    ADD MaKH VARCHAR(50) NULL CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY (MaKH) REFERENCES dbo.KhachHang(MaKH);
    PRINT N'Đã thêm cột MaKH vào bảng HoaDon.';
END
ELSE
BEGIN
    PRINT N'Cột MaKH đã tồn tại trong bảng HoaDon.';
END
GO

-- 2. CẬP NHẬT STORE TẠO HÓA ĐƠN
ALTER PROCEDURE [dbo].[usp_Local_TaoHoaDonNhieuDong]
    @MaHD VARCHAR(50),
    @MaNV VARCHAR(50),
    @MaKH VARCHAR(50) = NULL,
    @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' 
        WHEN 'Store_HN' THEN 'HANOI' 
        WHEN 'Store_H' THEN 'HUE' 
        ELSE DB_NAME() 
    END;

    -- Kiểm tra nếu truyền sai ChiNhanhLap so với DB hiện tại
    IF @ChiNhanhLap <> @CurrentDBBranch AND DB_NAME() NOT LIKE 'Central%'
    BEGIN
        THROW 50000, N'Lỗi: Procedure local chỉ cho phép tạo hóa đơn đúng với chi nhánh của Server hiện tại.', 1;
    END

    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL
        THROW 50000, N'Mã hóa đơn không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ItemsJson)), '') IS NULL
        THROW 50000, N'Danh sách món hàng không được để trống!', 1;

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

    -- LOGIC MỚI: CHẶN SẢN PHẨM BỊ XÓA MỀM
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
        LEFT JOIN dbo.TonKho tk ON tk.MaSP = a.MaSP AND tk.ChiNhanh = @ChiNhanhLap
        WHERE ISNULL(tk.SoLuongTon, 0) < a.SoLuong;

        IF @@ROWCOUNT > 0
            THROW 50005, N'Tồn kho không đủ cho một hoặc nhiều sản phẩm!', 1;

        INSERT INTO dbo.HoaDon (MaHD, MaNV, MaKH, GhiChu, NgayTao, ChiNhanh)
        VALUES (@MaHD, @MaNV, @MaKH, @GhiChu, GETDATE(), @ChiNhanhLap);

        INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia)
        SELECT 
            @MaHD,
            a.MaSP,
            a.SoLuong,
            COALESCE(NULLIF(a.DonGia, 0), h.Gia)
        FROM (
            SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
            FROM @Items
            GROUP BY MaSP
        ) a
        INNER JOIN dbo.HangHoa h ON h.MaSP = a.MaSP;

        UPDATE tk
        SET tk.SoLuongTon = tk.SoLuongTon - a.SoLuong
        FROM dbo.TonKho tk
        INNER JOIN (
            SELECT MaSP, SUM(SoLuong) AS SoLuong
            FROM @Items
            GROUP BY MaSP
        ) a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @ChiNhanhLap;

        -- [LOGIC MỚI] Tính điểm tích lũy cho Khách Hàng (Tỷ lệ 10.000 VNĐ = 1 điểm)
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            DECLARE @TongTien DECIMAL(18,2) = 0;
            DECLARE @DiemCong INT = 0;
            
            -- Lấy tổng tiền thực tế của các món hàng
            SELECT @TongTien = SUM(a.SoLuong * COALESCE(NULLIF(a.DonGia, 0), h.Gia)) 
            FROM (
                SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
                FROM @Items
                GROUP BY MaSP
            ) a
            INNER JOIN dbo.HangHoa h ON h.MaSP = a.MaSP;
            
            -- Tính điểm cộng (Chia 10,000 và làm tròn xuống thành số nguyên)
            SET @DiemCong = CAST(@TongTien / 10000 AS INT);

            -- Cộng điểm thẳng vào bảng Khách hàng
            IF @DiemCong > 0
            BEGIN
                UPDATE dbo.KhachHang
                SET DiemTichLuy = DiemTichLuy + @DiemCong
                WHERE MaKH = @MaKH;
            END
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
