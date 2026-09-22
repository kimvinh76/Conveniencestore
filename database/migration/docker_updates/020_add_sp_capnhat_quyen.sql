-- File: 020_add_sp_capnhat_quyen.sql
-- Description: Thêm SP cập nhật quyền tài khoản khi nhân viên bị đổi chức vụ

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_CapNhatQuyenTaiKhoan]
    @MaNV VARCHAR(50),
    @Quyen NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE MaNV = @MaNV)
    BEGIN
        UPDATE dbo.TaiKhoan
        SET Quyen = @Quyen
        WHERE MaNV = @MaNV;
        
        SELECT TOP 1 * FROM dbo.TaiKhoan WHERE MaNV = @MaNV;
    END
END;
GO
