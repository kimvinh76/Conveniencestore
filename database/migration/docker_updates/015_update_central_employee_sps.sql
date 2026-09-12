-- Migration to update Central Employee SPs to include Email parameter
-- This ensures Central Admins can be created/updated with an Email address

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_ThemNhanVien]
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120),
    @ChucVu NVARCHAR(80),
    @Email VARCHAR(100) = NULL,
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ChucVu)), '') IS NULL
        THROW 50000, N'Chức vụ không được để trống!', 1;

    IF @ChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI', 'CENTRAL')
        THROW 50000, N'Chi nhánh không hợp lệ!', 1;

    IF EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50000, N'Mã nhân viên đã tồn tại!', 1;

    INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh)
    VALUES (@MaNV, @HoTen, @ChucVu, @Email, @ChiNhanh);

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_CapNhatNhanVien]
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120) = NULL,
    @ChucVu NVARCHAR(80) = NULL,
    @Email VARCHAR(100) = NULL,
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF @HoTen IS NOT NULL AND LTRIM(RTRIM(@HoTen)) = ''
        THROW 50002, N'Họ tên không được để trống!', 1;

    IF @ChucVu IS NOT NULL AND LTRIM(RTRIM(@ChucVu)) = ''
        THROW 50003, N'Chức vụ không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50001, N'Mã nhân viên không tồn tại!', 1;

    UPDATE dbo.NhanVien
    SET 
        HoTen = ISNULL(@HoTen, HoTen),
        ChucVu = ISNULL(@ChucVu, ChucVu),
        Email = ISNULL(@Email, Email),
        ChiNhanh = ISNULL(@ChiNhanh, ChiNhanh)
    WHERE MaNV = @MaNV;

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV;
END;
GO
