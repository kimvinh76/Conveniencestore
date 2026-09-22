-- File: 019_refactor_employee_sps.sql
-- Description: Gộp chung Store Procedure quản lý Nhân Viên (Central & Local) và xóa các SP cũ cồng kềnh

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

---------------------------------------------------------
-- 1. DANH SÁCH NHÂN VIÊN CHUNG
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachNhanVien]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaNV, HoTen, ChucVu, ChiNhanh, Email, TrangThai 
    FROM dbo.NhanVien 
    ORDER BY ChiNhanh, HoTen;
END;
GO

---------------------------------------------------------
-- 2. THÊM NHÂN VIÊN CHUNG
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_ThemNhanVien]
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

    IF EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50001, N'Mã nhân viên đã tồn tại!', 1;

    INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh, TrangThai)
    VALUES (@MaNV, @HoTen, @ChucVu, @Email, @ChiNhanh, 1);

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV;
END;
GO

---------------------------------------------------------
-- 3. CẬP NHẬT NHÂN VIÊN CHUNG
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatNhanVien]
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120) = NULL,
    @ChucVu NVARCHAR(80) = NULL,
    @Email VARCHAR(100) = NULL,
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh)
        THROW 50001, N'Không tìm thấy nhân viên!', 1;

    UPDATE dbo.NhanVien
    SET 
        HoTen = ISNULL(@HoTen, HoTen),
        ChucVu = ISNULL(@ChucVu, ChucVu),
        Email = ISNULL(@Email, Email)
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;
END;
GO

---------------------------------------------------------
-- 4. XÓA (MỀM) NHÂN VIÊN CHUNG
---------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_XoaNhanVien]
    @MaNV VARCHAR(50),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TrangThaiHienTai BIT;
    SELECT @TrangThaiHienTai = TrangThai FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    IF @TrangThaiHienTai IS NULL
        THROW 50001, N'Không tìm thấy nhân viên để xóa!', 1;
        
    IF @TrangThaiHienTai = 0
        THROW 50002, N'Nhân viên này đã nghỉ việc từ trước!', 1;

    -- XÓA MỀM (Chuyển trạng thái = 0)
    UPDATE dbo.NhanVien
    SET TrangThai = 0
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    SELECT CAST(1 AS BIT) AS deleted, @MaNV AS MaNV;
END;
GO

---------------------------------------------------------
-- 5. XÓA SẠCH DI SẢN CŨ CỦA KIẾN TRÚC LINKED SERVERS
---------------------------------------------------------
DROP PROCEDURE IF EXISTS [dbo].[usp_Local_DanhSachNhanVien];
DROP PROCEDURE IF EXISTS [dbo].[usp_Local_ThemNhanVien];
DROP PROCEDURE IF EXISTS [dbo].[usp_Local_CapNhatNhanVien];
DROP PROCEDURE IF EXISTS [dbo].[usp_Local_XoaNhanVien];

DROP PROCEDURE IF EXISTS [dbo].[usp_Central_DanhSachNhanVienToanBo];
DROP PROCEDURE IF EXISTS [dbo].[usp_Central_ThemNhanVien];
DROP PROCEDURE IF EXISTS [dbo].[usp_Central_CapNhatNhanVien];
DROP PROCEDURE IF EXISTS [dbo].[usp_Central_XoaNhanVien];
GO
