-- File: 012_create_sp_sync_promotion.sql
-- Description: Tạo SP đồng bộ Khuyến mãi đa chi nhánh

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DongBoKhuyenMai]
    @MaKM VARCHAR(50),
    @TenChuongTrinh NVARCHAR(150),
    @PhanTramGiam INT = NULL,
    @NgayBatDau DATETIME2 = NULL,
    @NgayKetThuc DATETIME2 = NULL,
    @LoaiKhuyenMai VARCHAR(20) = NULL,
    @SoTienGiamTrucTiep DECIMAL(15,2) = NULL,
    @GiamToiDa DECIMAL(15,2) = NULL,
    @DonHangToiThieu DECIMAL(15,2) = NULL,
    @SoLuongGioiHan INT = NULL,
    @ChoPhepCongDon BIT = NULL,
    @TrangThai BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM dbo.KhuyenMai WHERE MaKM = @MaKM)
    BEGIN
        UPDATE dbo.KhuyenMai
        SET TenChuongTrinh = ISNULL(@TenChuongTrinh, TenChuongTrinh),
            PhanTramGiam = ISNULL(@PhanTramGiam, PhanTramGiam),
            NgayBatDau = ISNULL(@NgayBatDau, NgayBatDau),
            NgayKetThuc = ISNULL(@NgayKetThuc, NgayKetThuc),
            LoaiKhuyenMai = ISNULL(@LoaiKhuyenMai, LoaiKhuyenMai),
            SoTienGiamTrucTiep = ISNULL(@SoTienGiamTrucTiep, SoTienGiamTrucTiep),
            GiamToiDa = ISNULL(@GiamToiDa, GiamToiDa),
            DonHangToiThieu = ISNULL(@DonHangToiThieu, DonHangToiThieu),
            SoLuongGioiHan = ISNULL(@SoLuongGioiHan, SoLuongGioiHan),
            ChoPhepCongDon = ISNULL(@ChoPhepCongDon, ChoPhepCongDon),
            TrangThai = ISNULL(@TrangThai, TrangThai)
        WHERE MaKM = @MaKM;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.KhuyenMai (
            MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc, LoaiKhuyenMai,
            SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, SoLuongGioiHan, 
            ChoPhepCongDon, TrangThai
        )
        VALUES (
            @MaKM, @TenChuongTrinh, @PhanTramGiam, @NgayBatDau, @NgayKetThuc, @LoaiKhuyenMai,
            @SoTienGiamTrucTiep, @GiamToiDa, @DonHangToiThieu, @SoLuongGioiHan, 
            ISNULL(@ChoPhepCongDon, 1), ISNULL(@TrangThai, 1)
        );
    END
END;
GO
