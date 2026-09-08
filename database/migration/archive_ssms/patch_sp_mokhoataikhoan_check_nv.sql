USE [DDBMS];
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- CẬP NHẬT: THÊM ĐIỀU KIỆN KIỂM TRA TRẠNG THÁI NHÂN VIÊN KHI MỞ KHÓA TÀI KHOẢN
-- =============================================
CREATE OR ALTER PROCEDURE dbo.usp_Central_MoKhoaTaiKhoan
    @TenDangNhap VARCHAR(50),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ChiNhanh)), '') IS NULL
        THROW 50000, N'Chi nhánh không được để trống!', 1;

    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;
    IF @Quyen IN (N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50003, N'Lỗi bảo mật: Không được phép thao tác mở khóa trên tài khoản Quản trị viên!', 1;

    DECLARE @ActualBranch VARCHAR(10);
    DECLARE @TrangThaiNV BIT;

    SELECT 
        @ActualBranch = nv.ChiNhanh,
        @TrangThaiNV = nv.TrangThai
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap;

    IF @ActualBranch IS NULL
        THROW 50002, N'Không tìm thấy tài khoản để mở khóa!', 1;

    IF @ActualBranch <> @ChiNhanh
        THROW 50004, N'Lỗi đồng bộ: Tài khoản này không thuộc chi nhánh bạn cung cấp!', 1;

    -- KIỂM TRA: NẾU NHÂN VIÊN ĐÃ NGHỈ VIỆC (TRẠNG THÁI = 0) THÌ KHÔNG CHO PHÉP MỞ KHÓA
    IF @TrangThaiNV = 0
        THROW 50005, N'Không thể mở khóa tài khoản! Nhân viên chủ quản đã bị ngừng hoạt động (nghỉ việc).', 1;

    -- 1. BẮT BUỘC CẬP NHẬT TẠI CENTRAL TRƯỚC ĐỂ CHO PHÉP LOGIN TỨC THÌ
    UPDATE dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap;

    -- 2. ĐẨY LỆNH XUỐNG CÁC CHI NHÁNH QUA LINKED SERVER
    IF @ChiNhanh = 'HUE'
    BEGIN
        UPDATE [HUE_SERVER].[Store_H].dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'SAIGON'
    BEGIN
        UPDATE [SG_SERVER].[Store_SG].dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'HANOI'
    BEGIN
        UPDATE [HN_SERVER].[Store_HN].dbo.TaiKhoan SET TrangThai = 1 WHERE TenDangNhap = @TenDangNhap;
    END

    IF @@ROWCOUNT = 0
        THROW 50002, N'Lỗi hệ thống: Không thể mở khóa tài khoản!', 1;
END;
GO
