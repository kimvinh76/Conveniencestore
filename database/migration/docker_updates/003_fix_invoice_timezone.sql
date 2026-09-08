-- File: 003_fix_invoice_timezone.sql
-- Description: Cập nhật Store Tạo Hóa Đơn với múi giờ Việt Nam (UTC+7) và cấu hình SET QUOTED_IDENTIFIER ON chuẩn xác

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Local_TaoHoaDonNhieuDong]
    @MaHD VARCHAR(50), 
    @MaNV VARCHAR(50), 
    @MaKH VARCHAR(50) = NULL, 
    @GhiChu NVARCHAR(255) = NULL,
    @ChiNhanhLap VARCHAR(10), 
    @ItemsJson NVARCHAR(MAX), 
    @PromosJson NVARCHAR(MAX) = NULL, 
    @DiemSuDung INT = 0
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

    IF @ChiNhanhLap <> @CurrentDBBranch AND DB_NAME() NOT LIKE 'Central%' 
        THROW 50000, N'Lỗi: Chi nhánh lập không khớp!', 1;
    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL 
        THROW 50000, N'Mã hóa đơn rỗng!', 1;
    IF @DiemSuDung < 0 
        THROW 50000, N'Số điểm sử dụng không hợp lệ!', 1;

    -- BƯỚC 1: ĐỌC MẢNG HÀNG HÓA
    DECLARE @Items TABLE (MaSP VARCHAR(50) NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(15,2) NULL);
    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT LTRIM(RTRIM(MaSP)), SoLuong, DonGia 
    FROM OPENJSON(@ItemsJson) 
    WITH (MaSP VARCHAR(50) '$.MaSP', SoLuong INT '$.SoLuong', DonGia DECIMAL(15,2) '$.DonGia');

    IF NOT EXISTS (SELECT 1 FROM @Items) 
        THROW 50002, N'Danh sách món hàng rỗng!', 1;
    IF EXISTS (SELECT 1 FROM @Items WHERE NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL OR SoLuong <= 0) 
        THROW 50003, N'SoLuong phải > 0', 1;
    IF EXISTS (SELECT 1 FROM @Items i INNER JOIN dbo.HangHoa h ON h.MaSP = i.MaSP WHERE h.TrangThai = 0) 
        THROW 50006, N'Hóa đơn chứa sản phẩm bị Xóa mềm!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- BƯỚC 2: KHÓA BẢNG KHÁCH HÀNG
        DECLARE @DiemHienCo INT = 0;
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            IF @DiemSuDung > 0 
            BEGIN
                SELECT @DiemHienCo = DiemTichLuy FROM dbo.KhachHang WITH (UPDLOCK, HOLDLOCK) WHERE MaKH = @MaKH;
                IF @DiemSuDung > @DiemHienCo THROW 50009, N'Số điểm muốn dùng vượt quá số điểm khách đang có!', 1;
            END
        END
        ELSE
        BEGIN
            IF @DiemSuDung > 0 THROW 50010, N'Chỉ Khách hàng thành viên mới được dùng điểm!', 1;
        END

        -- BƯỚC 3: TÍNH TỔNG TIỀN GỐC
        UPDATE i SET i.DonGia = COALESCE(NULLIF(i.DonGia, 0), h.Gia) 
        FROM @Items i INNER JOIN dbo.HangHoa h ON i.MaSP = h.MaSP;

        DECLARE @TongTienGoc DECIMAL(15,2) = 0;
        SELECT @TongTienGoc = ISNULL(SUM(SoLuong * DonGia), 0) FROM @Items;

        -- BƯỚC 4: XỬ LÝ MẢNG KHUYẾN MÃI
        DECLARE @Promos TABLE (
            MaKM VARCHAR(20), LoaiKhuyenMai VARCHAR(20), PhanTramGiam DECIMAL(5,2), 
            SoTienGiamTrucTiep DECIMAL(15,2), GiamToiDa DECIMAL(15,2), ChoPhepCongDon BIT, SoTienGiam DECIMAL(15,2) DEFAULT 0
        );
        DECLARE @SoLuongMaKM INT = 0;

        IF @PromosJson IS NOT NULL AND LTRIM(RTRIM(@PromosJson)) <> ''
        BEGIN
            INSERT INTO @Promos (MaKM) 
            SELECT LTRIM(RTRIM(MaKM)) 
            FROM OPENJSON(@PromosJson) WITH (MaKM VARCHAR(20) '$.MaKM');

            SELECT @SoLuongMaKM = COUNT(*) FROM @Promos;

            -- Khóa bảng KM bằng UPDLOCK
            UPDATE p 
            SET p.LoaiKhuyenMai = k.LoaiKhuyenMai, p.PhanTramGiam = k.PhanTramGiam, 
                p.SoTienGiamTrucTiep = k.SoTienGiamTrucTiep, p.GiamToiDa = k.GiamToiDa, p.ChoPhepCongDon = k.ChoPhepCongDon
            FROM @Promos p
            INNER JOIN dbo.KhuyenMai k WITH (UPDLOCK, HOLDLOCK) ON p.MaKM = k.MaKM
            WHERE k.TrangThai = 1 AND DATEADD(hour, 7, GETUTCDATE()) BETWEEN k.NgayBatDau AND k.NgayKetThuc 
              AND @TongTienGoc >= k.DonHangToiThieu AND (k.SoLuongGioiHan IS NULL OR k.SoLuongDaDung < k.SoLuongGioiHan); 

            IF EXISTS (SELECT 1 FROM @Promos WHERE LoaiKhuyenMai IS NULL) 
                THROW 50007, N'Có mã KM không hợp lệ hoặc hết lượt!', 1;
            IF @SoLuongMaKM > 1 AND EXISTS (SELECT 1 FROM @Promos WHERE ChoPhepCongDon = 0) 
                THROW 50008, N'Lỗi: Mã KM Độc Quyền!', 1;

            UPDATE @Promos
            SET SoTienGiam = CASE 
                WHEN LoaiKhuyenMai = 'PERCENTAGE' THEN 
                    CASE WHEN GiamToiDa IS NOT NULL AND (@TongTienGoc * PhanTramGiam / 100) > GiamToiDa THEN GiamToiDa ELSE (@TongTienGoc * PhanTramGiam / 100) END
                WHEN LoaiKhuyenMai = 'FIXED' THEN SoTienGiamTrucTiep ELSE 0 END;
        END

        -- BƯỚC 5: TÍNH TIỀN THANH TOÁN
        DECLARE @TongSoTienGiam DECIMAL(15,2) = 0, @TongTienThanhToan DECIMAL(15,2) = 0;
        SELECT @TongSoTienGiam = ISNULL(SUM(SoTienGiam), 0) FROM @Promos;
        DECLARE @SoTienGiamTuDiem DECIMAL(15,2) = @DiemSuDung * 100;

        SET @TongTienThanhToan = @TongTienGoc - @TongSoTienGiam - @SoTienGiamTuDiem;
        IF @TongTienThanhToan < 0 
        BEGIN
            SET @SoTienGiamTuDiem = @SoTienGiamTuDiem + @TongTienThanhToan; 
            SET @DiemSuDung = CEILING(@SoTienGiamTuDiem / 100.0);
            SET @TongTienThanhToan = 0;
        END

        -- BƯỚC 6: CHỐNG DÀNH GIẬT TỒN KHO
        ;WITH Agg AS (SELECT MaSP, SUM(SoLuong) AS SoLuong FROM @Items GROUP BY MaSP)
        SELECT 1 FROM Agg a
        LEFT JOIN dbo.TonKho tk WITH (UPDLOCK, HOLDLOCK) ON tk.MaSP = a.MaSP AND tk.ChiNhanh = @ChiNhanhLap
        WHERE ISNULL(tk.SoLuongTon, 0) < a.SoLuong;
        IF @@ROWCOUNT > 0 THROW 50005, N'Tồn kho không đủ!', 1;

        -- BƯỚC 7: LƯU VÀO DATABASE BẢNG HÓA ĐƠN (Múi giờ VN UTC+7)
        DECLARE @VNTime DATETIME = DATEADD(hour, 7, GETUTCDATE());
        INSERT INTO dbo.HoaDon (MaHD, MaNV, MaKH, GhiChu, NgayTao, ChiNhanh, TongTienGoc, TongSoTienGiam, TongTienThanhToan, DiemDaDung, SoTienGiamTuDiem)
        VALUES (@MaHD, @MaNV, @MaKH, @GhiChu, @VNTime, @ChiNhanhLap, @TongTienGoc, @TongSoTienGiam, @TongTienThanhToan, @DiemSuDung, @SoTienGiamTuDiem);

        IF @SoLuongMaKM > 0
        BEGIN
            INSERT INTO dbo.ChiTietKhuyenMaiHoaDon (MaHD, MaKM, SoTienGiam) 
            SELECT @MaHD, MaKM, SoTienGiam FROM @Promos;
            
            UPDATE k SET k.SoLuongDaDung = k.SoLuongDaDung + 1 
            FROM dbo.KhuyenMai k INNER JOIN @Promos p ON k.MaKM = p.MaKM;
        END

        INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia) 
        SELECT @MaHD, MaSP, SoLuong, DonGia FROM @Items;

        -- BƯỚC 8: TRỪ TỒN KHO 
        UPDATE tk SET tk.SoLuongTon = tk.SoLuongTon - a.SoLuong
        FROM dbo.TonKho tk 
        INNER JOIN (SELECT MaSP, SUM(SoLuong) AS SoLuong FROM @Items GROUP BY MaSP) a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @ChiNhanhLap;

        -- BƯỚC 9: XỬ LÝ ĐIỂM
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            IF @DiemSuDung > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE MaKH = @MaKH;
            DECLARE @DiemCong INT = CAST(@TongTienThanhToan / 10000 AS INT); 
            IF @DiemCong > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy + @DiemCong WHERE MaKH = @MaKH;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
