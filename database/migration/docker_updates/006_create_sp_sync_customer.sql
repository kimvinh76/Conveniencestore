-- File: 006_create_sp_sync_customer.sql
-- Description: Tạo Stored Procedure để Đồng bộ Khách hàng phân tán (Thêm mới và Cập nhật) trên tất cả các Node

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Branch_DongBoThemKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15),
    @ChiNhanhDK VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
    BEGIN
        INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK)
        VALUES (@MaKH, @HoTen, @SoDienThoai, 0, @ChiNhanhDK);
    END
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Branch_DongBoCapNhatKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120) = NULL,
    @SoDienThoai VARCHAR(15) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.KhachHang
    SET HoTen = COALESCE(@HoTen, HoTen),
        SoDienThoai = COALESCE(@SoDienThoai, SoDienThoai)
    WHERE MaKH = @MaKH;
END;
GO
