-- File: 005_create_sp_sync_account.sql
-- Description: Tạo Stored Procedure cập nhật trạng thái, mật khẩu và đồng bộ Tài khoản phân tán (UPSERT an toàn)

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_ThemTaiKhoan]
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @MaNV VARCHAR(50),
    @Quyen NVARCHAR(50),
    @TrangThai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;
    IF NULLIF(LTRIM(RTRIM(@MatKhau)), '') IS NULL
        THROW 50000, N'Mật khẩu không được để trống!', 1;
    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
    BEGIN
        -- Nếu đã tồn tại thì cập nhật lại thông tin (Idempotent sync an toàn giữa các node)
        UPDATE dbo.TaiKhoan
        SET MatKhau = @MatKhau,
            MaNV = @MaNV,
            Quyen = @Quyen,
            TrangThai = @TrangThai
        WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
        VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, @TrangThai);
    END
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatTrangThaiTaiKhoan]
    @TenDangNhap VARCHAR(50),
    @TrangThai BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.TaiKhoan SET TrangThai = @TrangThai WHERE TenDangNhap = @TenDangNhap;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatMatKhau]
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap;
END;
GO
