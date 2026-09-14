-- File: 010_patch_sync_invoice_inventory.sql
-- Description: Cập nhật Store Procedure đồng bộ Hóa đơn (Thêm logic TRỪ TỒN KHO tại Central)

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DongBoHoaDon]
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

    -- BƯỚC 1: ĐỌC MẢNG HÀNG HÓA
    DECLARE @Items TABLE (MaSP VARCHAR(50) NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(15,2) NULL);
    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT LTRIM(RTRIM(MaSP)), SoLuong, DonGia 
    FROM OPENJSON(@ItemsJson) 
    WITH (MaSP VARCHAR(50) '$.MaSP', SoLuong INT '$.SoLuong', DonGia DECIMAL(15,2) '$.DonGia');

    BEGIN TRY
        BEGIN TRANSACTION;

        -- BƯỚC 2: TÍNH TỔNG TIỀN GỐC
        UPDATE i SET i.DonGia = COALESCE(NULLIF(i.DonGia, 0), h.Gia) 
        FROM @Items i INNER JOIN dbo.HangHoa h ON i.MaSP = h.MaSP;

        DECLARE @TongTienGoc DECIMAL(15,2) = 0;
        SELECT @TongTienGoc = ISNULL(SUM(SoLuong * DonGia), 0) FROM @Items;

        -- BƯỚC 3: XỬ LÝ MẢNG KHUYẾN MÃI
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

            UPDATE p 
            SET p.LoaiKhuyenMai = k.LoaiKhuyenMai, p.PhanTramGiam = k.PhanTramGiam, 
                p.SoTienGiamTrucTiep = k.SoTienGiamTrucTiep, p.GiamToiDa = k.GiamToiDa, p.ChoPhepCongDon = k.ChoPhepCongDon
            FROM @Promos p
            INNER JOIN dbo.KhuyenMai k ON p.MaKM = k.MaKM;

            UPDATE @Promos
            SET SoTienGiam = CASE 
                WHEN LoaiKhuyenMai = 'PERCENTAGE' THEN 
                    CASE WHEN GiamToiDa IS NOT NULL AND (@TongTienGoc * PhanTramGiam / 100) > GiamToiDa THEN GiamToiDa ELSE (@TongTienGoc * PhanTramGiam / 100) END
                WHEN LoaiKhuyenMai = 'FIXED' THEN SoTienGiamTrucTiep ELSE 0 END;
        END

        -- BƯỚC 4: TÍNH TIỀN THANH TOÁN
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

        -- BƯỚC 5: LƯU VÀO DATABASE BẢNG HÓA ĐƠN
        DECLARE @VNTime DATETIME = DATEADD(hour, 7, GETUTCDATE());
        -- Tránh lưu trùng nếu retry
        IF NOT EXISTS (SELECT 1 FROM dbo.HoaDon WHERE MaHD = @MaHD)
        BEGIN
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

            -- [BỔ SUNG VÀO BẢN VÁ 010]: TRỪ TỒN KHO TẠI CENTRAL (Đồng bộ số lượng Tồn kho với Chi nhánh)
            UPDATE tk SET tk.SoLuongTon = tk.SoLuongTon - a.SoLuong
            FROM dbo.TonKho tk 
            INNER JOIN (SELECT MaSP, SUM(SoLuong) AS SoLuong FROM @Items GROUP BY MaSP) a ON tk.MaSP = a.MaSP
            WHERE tk.ChiNhanh = @ChiNhanhLap;

            -- BƯỚC 6: XỬ LÝ ĐIỂM KHÁCH HÀNG (TẠI CENTRAL)
            IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
            BEGIN
                IF @DiemSuDung > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE MaKH = @MaKH;
                DECLARE @DiemCong INT = CAST(@TongTienThanhToan / 10000 AS INT); 
                IF @DiemCong > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy + @DiemCong WHERE MaKH = @MaKH;
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
