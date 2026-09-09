-- File: 005_create_sp_sync_account.sql
-- Description: Tạo Stored Procedure quản lý, đồng bộ và bảo mật Tài khoản phân tán (Chặn khóa Admin, Chặn trùng Username & Tự động ánh xạ Quyền theo Chức vụ)

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Store Tạo mới tài khoản (dùng khi tạo mới từ UI / API gốc) -> Có validation chặn trùng & Tự động ánh xạ Quyền từ Chức vụ
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_ThemTaiKhoan]
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @MaNV VARCHAR(50),
    @Quyen NVARCHAR(50) = NULL,
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

    -- Kiểm tra trùng tên đăng nhập
    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
        THROW 50002, N'Tên đăng nhập đã tồn tại trong hệ thống!', 1;

    -- Kiểm tra nhân viên có tồn tại trong hệ thống không
    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50001, N'Nhân viên không tồn tại trong hệ thống!', 1;

    -- Kiểm tra 1 nhân viên chỉ có 1 tài khoản (quan hệ 1-1)
    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE MaNV = @MaNV)
        THROW 50003, N'Nhân viên này đã có tài khoản trong hệ thống!', 1;

    -- Tự động kiểm tra và ánh xạ Quyền từ Chức vụ của Nhân viên (nếu @Quyen không truyền hoặc để xác thực)
    DECLARE @ChucVu NVARCHAR(80);
    SELECT @ChucVu = ChucVu FROM dbo.NhanVien WHERE MaNV = @MaNV;

    IF @Quyen IS NULL OR LTRIM(RTRIM(@Quyen)) = ''
    BEGIN
        SET @Quyen = CASE 
            WHEN @ChucVu = N'Quản trị hệ thống' THEN N'ADMIN_TOAN_BO'
            WHEN @ChucVu = N'Quản lý chi nhánh' THEN N'ADMIN_CHI_NHANH'
            ELSE N'NHAN_VIEN'
        END;
    END

    IF @Quyen NOT IN (N'NHAN_VIEN', N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50000, N'Quyền không hợp lệ! Chỉ chấp nhận: NHAN_VIEN, ADMIN_CHI_NHANH, ADMIN_TOAN_BO', 1;

    INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
    VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, @TrangThai);
END;
GO

-- 2. Store Đồng bộ tài khoản (dùng khi replicate sang các node khác) -> Idempotent UPSERT
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DongBoTaiKhoan]
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @MaNV VARCHAR(50),
    @Quyen NVARCHAR(50),
    @TrangThai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
    BEGIN
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

-- 3. Store Cập nhật trạng thái tài khoản (Khóa / Mở khóa) -> Chặn khóa tài khoản Admin
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatTrangThaiTaiKhoan]
    @TenDangNhap VARCHAR(50),
    @TrangThai BIT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;

    IF @Quyen IS NULL
        THROW 50001, N'Không tìm thấy tài khoản!', 1;

    -- Quy tắc bảo mật: Không được phép khóa tài khoản Quản trị viên
    IF @TrangThai = 0 AND @Quyen IN (N'ADMIN_TOAN_BO', N'ADMIN_CHI_NHANH')
        THROW 50003, N'Lỗi bảo mật: Không được phép khóa tài khoản Quản trị viên!', 1;

    UPDATE dbo.TaiKhoan 
    SET TrangThai = @TrangThai 
    WHERE TenDangNhap = @TenDangNhap;
END;
GO

-- 4. Store Cập nhật mật khẩu
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatMatKhau]
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
        THROW 50001, N'Không tìm thấy tài khoản để cập nhật mật khẩu!', 1;

    UPDATE dbo.TaiKhoan 
    SET MatKhau = @MatKhau 
    WHERE TenDangNhap = @TenDangNhap;
END;
GO
