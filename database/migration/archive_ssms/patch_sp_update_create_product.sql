USE [DDBMS]; -- Chạy trên Server CENTRAL
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- CẬP NHẬT: THÊM HÀNG HÓA MỚI (Hỗ trợ Danh mục, Thương hiệu, Barcode)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Central_ThemHangHoaMoi]
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100),
    @Gia DECIMAL(10,2),
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL,
    @MaDM VARCHAR(20) = NULL,
    @MaTH VARCHAR(20) = NULL,
    @Barcode VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@TenHang)), '') IS NULL
        THROW 50000, N'Tên hàng không được để trống!', 1;

    IF @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50000, N'Mã sản phẩm đã tồn tại tại Server Gốc!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia, MoTa, AnhSanPham, DonViTinh, TrangThai, MaDM, MaTH, Barcode)
        VALUES (@MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh, 1, @MaDM, @MaTH, @Barcode);

        -- Chèn Tồn Kho ban đầu (Số lượng = 0) cho 3 Chi nhánh
        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HUE')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HUE');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'SAIGON')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'SAIGON');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HANOI')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HANOI');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- CẬP NHẬT: SỬA HÀNG HÓA (Hỗ trợ Danh mục, Thương hiệu, Barcode, TrangThai)
-- =============================================
CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatHangHoa
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100) = NULL,
    @Gia DECIMAL(10,2) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL,
    @MaDM VARCHAR(20) = NULL,
    @MaTH VARCHAR(20) = NULL,
    @Barcode VARCHAR(50) = NULL,
    @TrangThai INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @Gia IS NOT NULL AND @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50001, N'Không tìm thấy sản phẩm để cập nhật!', 1;

    UPDATE dbo.HangHoa
    SET TenHang = COALESCE(NULLIF(LTRIM(RTRIM(@TenHang)), ''), TenHang),
        Gia = COALESCE(@Gia, Gia),
        MoTa = COALESCE(@MoTa, MoTa),
        AnhSanPham = COALESCE(@AnhSanPham, AnhSanPham),
        DonViTinh = COALESCE(@DonViTinh, DonViTinh),
        MaDM = COALESCE(@MaDM, MaDM),
        MaTH = COALESCE(@MaTH, MaTH),
        Barcode = COALESCE(@Barcode, Barcode),
        TrangThai = COALESCE(@TrangThai, TrangThai)
    WHERE MaSP = @MaSP;

    SELECT TOP 1 MaSP, TenHang, CAST(Gia AS DECIMAL(10,2)) AS Gia, MoTa, AnhSanPham, DonViTinh, TrangThai, MaDM, MaTH, Barcode
    FROM dbo.HangHoa
    WHERE MaSP = @MaSP;
END;
GO

-- =============================================
-- CẬP NHẬT: LẤY CHI TIẾT SẢN PHẨM THEO MÃ
-- (Chạy trên tất cả các server, phục vụ xem chi tiết hóa đơn cũ)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_HangHoaTheoMaSP]
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    SELECT TOP 1 
        hh.MaSP, 
        hh.TenHang, 
        CAST(hh.Gia AS DECIMAL(10,2)) AS Gia,
        hh.MoTa,
        hh.AnhSanPham,
        hh.DonViTinh,
        hh.TrangThai,
        hh.MaDM,
        dm.TenDM,
        hh.MaTH,
        th.TenTH,
        hh.Barcode
    FROM dbo.HangHoa hh
    LEFT JOIN dbo.DanhMuc dm ON hh.MaDM = dm.MaDM
    LEFT JOIN dbo.ThuongHieu th ON hh.MaTH = th.MaTH
    WHERE hh.MaSP = @MaSP;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachHangHoaKemTonKho]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        hh.MaSP AS productCode,
        hh.TenHang AS productName,
        CAST(hh.Gia AS DECIMAL(10,2)) AS unitPrice,
        hh.MoTa AS description,
        hh.AnhSanPham AS imageUrl,
        hh.DonViTinh AS unit,
        ISNULL(tk.SoLuongTon, 0) AS stock,
        CAST(hh.TrangThai AS BIT) AS active,
        hh.MaDM AS categoryCode,
        dm.TenDM AS categoryName,
        hh.MaTH AS brandCode,
        th.TenTH AS brandName,
        hh.Barcode AS barcode
    FROM dbo.HangHoa hh
    LEFT JOIN dbo.TonKho tk ON hh.MaSP = tk.MaSP AND tk.ChiNhanh = @ChiNhanh
    LEFT JOIN dbo.DanhMuc dm ON hh.MaDM = dm.MaDM
    LEFT JOIN dbo.ThuongHieu th ON hh.MaTH = th.MaTH
    ORDER BY hh.MaSP;
END
GO
