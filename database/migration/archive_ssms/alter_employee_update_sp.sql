-- ==========================================================
-- SCRIPT CẬP NHẬT STORE UPDATE NHÂN VIÊN
-- Hỗ trợ xóa email (gửi chuỗi rỗng) và kiểm tra dữ liệu bắt buộc
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Local_CapNhatNhanVien]
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

    -- Thêm kiểm tra validation ở Store
    IF @HoTen IS NOT NULL AND LTRIM(RTRIM(@HoTen)) = ''
        THROW 50002, N'Họ tên không được để trống!', 1;
        
    IF @ChucVu IS NOT NULL AND LTRIM(RTRIM(@ChucVu)) = ''
        THROW 50003, N'Chức vụ không được để trống!', 1;

    UPDATE dbo.NhanVien
    SET HoTen = COALESCE(NULLIF(LTRIM(RTRIM(@HoTen)), ''), HoTen),
        ChucVu = COALESCE(NULLIF(LTRIM(RTRIM(@ChucVu)), ''), ChucVu),
        Email = CASE 
            WHEN @Email IS NULL THEN Email 
            WHEN LTRIM(RTRIM(@Email)) = '' THEN NULL 
            ELSE LTRIM(RTRIM(@Email)) 
        END
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy nhân viên để cập nhật!', 1;

    -- TỰ ĐỘNG ĐỒNG BỘ QUYỀN TÀI KHOẢN (NẾU CÓ)
    -- Nếu nhân viên được thăng chức/giáng chức, quyền phần mềm phải chạy theo chức vụ
    IF @ChucVu IS NOT NULL
    BEGIN
        DECLARE @NewRole VARCHAR(20) = 'NHAN_VIEN';
        IF LTRIM(RTRIM(@ChucVu)) = N'Quản trị hệ thống' SET @NewRole = 'ADMIN_TOAN_BO';
        ELSE IF LTRIM(RTRIM(@ChucVu)) = N'Quản lý chi nhánh' SET @NewRole = 'ADMIN_CHI_NHANH';

        UPDATE dbo.TaiKhoan 
        SET Quyen = @NewRole
        WHERE MaNV = @MaNV AND Quyen <> @NewRole;
    END

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV;
END;
GO
