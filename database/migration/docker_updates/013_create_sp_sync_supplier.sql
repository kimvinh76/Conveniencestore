-- File: 013_create_sp_sync_supplier.sql
-- Description: Tạo SP đồng bộ Nhà Cung Cấp đa chi nhánh

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DongBoNhaCungCap]
    @MaNCC VARCHAR(50),
    @TenNCC NVARCHAR(150),
    @DienThoai VARCHAR(20) = NULL,
    @DiaChi NVARCHAR(255) = NULL,
    @Email VARCHAR(100) = NULL,
    @TrangThai INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF EXISTS (SELECT 1 FROM dbo.NhaCungCap WHERE MaNCC = @MaNCC)
    BEGIN
        UPDATE dbo.NhaCungCap
        SET TenNCC = @TenNCC,
            DienThoai = @DienThoai,
            DiaChi = @DiaChi,
            Email = @Email,
            TrangThai = @TrangThai
        WHERE MaNCC = @MaNCC;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.NhaCungCap (MaNCC, TenNCC, DienThoai, DiaChi, Email, TrangThai)
        VALUES (@MaNCC, @TenNCC, @DienThoai, @DiaChi, @Email, @TrangThai);
    END
END;
GO
