

CREATE OR ALTER PROCEDURE dbo.usp_Central_DoiMatKhau
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MatKhau)), '') IS NULL
        THROW 50000, N'Mật khẩu không được để trống!', 1;

    -- KIỂM TRA BẢO MẬT PHÂN TÁN: Ngăn chặn truyền sai Chi nhánh làm hỏng đồng bộ
    DECLARE @ActualBranch VARCHAR(10);
    SELECT @ActualBranch = nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap;

    IF @ActualBranch IS NULL
        THROW 50002, N'Không tìm thấy tài khoản để đổi mật khẩu!', 1;

    IF @ActualBranch <> @ChiNhanh
        THROW 50004, N'Lỗi đồng bộ: Tài khoản này không thuộc chi nhánh bạn cung cấp!', 1;

    -- 1. BẮT BUỘC CẬP NHẬT TẠI CENTRAL TRƯỚC ĐỂ ĐĂNG NHẬP ĐƯỢC NGAY BẰNG PASS MỚI
    UPDATE dbo.TaiKhoan 
    SET MatKhau = @MatKhau 
    WHERE TenDangNhap = @TenDangNhap;

    -- 2. ĐẨY LỆNH XUỐNG CÁC CHI NHÁNH QUA LINKED SERVER ĐỂ ĐỒNG BỘ LOCAL
    IF @ChiNhanh = 'HUE'
    BEGIN
        UPDATE [HUE_SERVER].[Store_H].dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'SAIGON'
    BEGIN
        UPDATE [SG_SERVER].[Store_SG].dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'HANOI'
    BEGIN
        UPDATE [HN_SERVER].[Store_HN].dbo.TaiKhoan SET MatKhau = @MatKhau WHERE TenDangNhap = @TenDangNhap;
    END
END;
GO
