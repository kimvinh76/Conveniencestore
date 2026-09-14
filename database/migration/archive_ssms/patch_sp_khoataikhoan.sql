USE [DDBMS]
GO

-- =============================================
-- FIX BUG ĐỒNG BỘ: Bỏ JOIN NhanVien để tránh lỗi Replication Latency
-- =============================================
CREATE OR ALTER PROCEDURE dbo.usp_Central_KhoaTaiKhoan
    @TenDangNhap VARCHAR(50),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ChiNhanh)), '') IS NULL
        THROW 50000, N'Chi nhánh không được để trống!', 1;

    -- KIỂM TRA QUYỀN: KHÔNG ĐƯỢC KHÓA ADMIN
    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;
    
    IF @Quyen IS NULL
        THROW 50002, N'Không tìm thấy tài khoản để khóa!', 1;

    IF @Quyen IN (N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50003, N'Lỗi bảo mật: Không được phép khóa tài khoản Quản trị viên!', 1;

   

    -- 1. BẮT BUỘC CẬP NHẬT TẠI CENTRAL TRƯỚC ĐỂ CHẶN LOGIN TỨC THÌ
    UPDATE dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap;

    -- 2. ĐẨY LỆNH XUỐNG CÁC CHI NHÁNH QUA LINKED SERVER
    IF @ChiNhanh = 'HUE'
    BEGIN
        UPDATE [HUE_SERVER].[Store_H].dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'SAIGON'
    BEGIN
        UPDATE [SG_SERVER].[Store_SG].dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'HANOI'
    BEGIN
        UPDATE [HN_SERVER].[Store_HN].dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap;
    END
END;
GO
