-- File: 001_create_sp_sync_product.sql
-- Description: Tạo Stored Procedure để đồng bộ dữ liệu Sản phẩm từ Central xuống các Chi nhánh một cách an toàn (Atomicity & UPSERT)

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Branch_DongBoThemHangHoa
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100),
    @Gia DECIMAL(10, 2),
    @MoTa NVARCHAR(500),
    @AnhSanPham VARCHAR(255),
    @DonViTinh NVARCHAR(50),
    @MaDM VARCHAR(20),
    @MaTH VARCHAR(20),
    @Barcode VARCHAR(50),
    @TrangThai INT,
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRAN;
        
        -- 1. Nếu chưa tồn tại thì thêm vào HangHoa
        IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        BEGIN
            INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia, MoTa, AnhSanPham, DonViTinh, TrangThai, MaDM, MaTH, Barcode)
            VALUES (@MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh, @TrangThai, @MaDM, @MaTH, @Barcode);
        END

        -- 2. Nếu chưa tồn tại trong TonKho của chi nhánh này thì khởi tạo Tồn = 0
        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = @ChiNhanh)
        BEGIN
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) 
            VALUES (@MaSP, 0, @ChiNhanh);
        END
        
        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Branch_DongBoCapNhatHangHoa
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100) = NULL,
    @Gia DECIMAL(10, 2) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL,
    @MaDM VARCHAR(20) = NULL,
    @MaTH VARCHAR(20) = NULL,
    @Barcode VARCHAR(50) = NULL,
    @TrangThai INT = NULL,
    @ChiNhanh VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- UPSERT: NẾu chưa có thì gọi Thêm Mới để đảm bảo an toàn, tránh lỗi Update Missing
    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
    BEGIN
        EXEC dbo.usp_Branch_DongBoThemHangHoa @MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh, @MaDM, @MaTH, @Barcode, @TrangThai, @ChiNhanh;
    END
    ELSE
    BEGIN
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
    END
END;
GO
