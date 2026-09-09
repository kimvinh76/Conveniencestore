-- File: 002_create_sp_sync_employee.sql
-- Description: Tạo Stored Procedure để đồng bộ dữ liệu Nhân viên từ Chi nhánh lên Central

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_DongBoThemNhanVien
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120),
    @ChucVu NVARCHAR(80),
    @Email VARCHAR(100),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Nếu chưa tồn tại thì thêm vào NhanVien
    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
    BEGIN
        INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh)
        VALUES (@MaNV, @HoTen, @ChucVu, @Email, @ChiNhanh);
    END
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_DongBoCapNhatNhanVien
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120) = NULL,
    @ChucVu NVARCHAR(80) = NULL,
    @Email VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.NhanVien
    SET HoTen = COALESCE(@HoTen, HoTen),
        ChucVu = COALESCE(@ChucVu, ChucVu),
        Email = COALESCE(@Email, Email)
    WHERE MaNV = @MaNV;

    -- Đồng bộ quyền tài khoản nếu chức vụ thay đổi
    IF @ChucVu IS NOT NULL
    BEGIN
        DECLARE @NewRole VARCHAR(20) = 'NHAN_VIEN';
        IF LTRIM(RTRIM(@ChucVu)) = N'Quản trị hệ thống' SET @NewRole = 'ADMIN_TOAN_BO';
        ELSE IF LTRIM(RTRIM(@ChucVu)) = N'Quản lý chi nhánh' SET @NewRole = 'ADMIN_CHI_NHANH';

        UPDATE dbo.TaiKhoan 
        SET Quyen = @NewRole
        WHERE MaNV = @MaNV AND Quyen <> @NewRole;
    END
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_DongBoXoaNhanVien
    @MaNV VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Khóa tài khoản nếu có
    UPDATE dbo.TaiKhoan
    SET TrangThai = 0
    WHERE MaNV = @MaNV;

    -- Soft delete hoặc Hard delete (Ở đây thử Hard delete an toàn, nếu vướng FK thì sẽ bỏ qua)
    BEGIN TRY
        DELETE FROM dbo.NhanVien WHERE MaNV = @MaNV;
    END TRY
    BEGIN CATCH
        -- Nếu lỗi khóa ngoại thì không làm crash app, chỉ log/bỏ qua (Soft Delete Account là đủ an toàn đăng nhập)
        PRINT 'Khong the xoa hoan toan do co khoa ngoai HoaDon/PhieuNhap';
    END CATCH
END;
GO
