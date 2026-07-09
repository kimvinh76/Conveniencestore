
use CentralDB 
GO 


CREATE OR ALTER PROCEDURE dbo.usp_Chung_DanhSachHangHoa
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaSP AS productCode,
        TenHang AS productName,
        CAST(Gia AS DECIMAL(10,2)) AS unitPrice,
        MoTa AS description,
        AnhSanPham AS imageUrl,
        DonViTinh AS unit
    FROM dbo.HangHoa
    ORDER BY MaSP;
END;
GO 


CREATE OR ALTER PROCEDURE dbo.usp_Chung_HangHoaTheoMaSP
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    SELECT TOP 1 
        MaSP, 
        TenHang, 
        CAST(Gia AS DECIMAL(10,2)) AS Gia,
        MoTa,
        AnhSanPham,
        DonViTinh
    FROM dbo.HangHoa
    WHERE MaSP = @MaSP;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_ThemHangHoaMoi
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100),
    @Gia DECIMAL(10,2),
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@TenHang)), '') IS NULL
        THROW 50000, N'Tên hàng không được để trống!', 1;

    IF @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50000, N'Mã sản phẩm đã tồn tại tại Server Gốc!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia, MoTa, AnhSanPham, DonViTinh)
        VALUES (@MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh);

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HUE')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HUE');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'SAIGON')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'SAIGON');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HANOI')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HANOI');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
EXEC dbo.usp_Central_ThemHangHoaMoi @MaSP = 'SP_TEST_01', @TenHang = N'Sản phẩm Test', @Gia = 25000;
GO


SELECT MaSP, SoLuongTon, ChiNhanh 
FROM dbo.TonKho 
WHERE MaSP = 'SP_TEST_01'; 
GO


CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatHangHoa
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100) = NULL,
    @Gia DECIMAL(10,2) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @Gia IS NOT NULL AND @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50001, N'Không tìm thấy sản phẩm để cập nhật!', 1;

    -- CHỈ CẦN CẬP NHẬT TẠI CENTRAL 
    UPDATE dbo.HangHoa
    SET TenHang = COALESCE(NULLIF(LTRIM(RTRIM(@TenHang)), ''), TenHang),
        Gia = COALESCE(@Gia, Gia),
        MoTa = COALESCE(@MoTa, MoTa),
        AnhSanPham = COALESCE(@AnhSanPham, AnhSanPham),
        DonViTinh = COALESCE(@DonViTinh, DonViTinh)
    WHERE MaSP = @MaSP;

    SELECT TOP 1 MaSP, TenHang, CAST(Gia AS DECIMAL(10,2)) AS Gia, MoTa, AnhSanPham, DonViTinh
    FROM dbo.HangHoa
    WHERE MaSP = @MaSP;
END;
GO

select * from HangHoa WHERE MaSP = 'SP_TEST_01';

EXEC dbo.usp_Central_CapNhatHangHoa @MaSP = 'SP_TEST_01', @TenHang = N'Sản phẩm Test Đã Sửa', @Gia = 30000;
GO


CREATE OR ALTER PROCEDURE dbo.usp_Central_XoaHangHoa
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;


    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50001, N'Không tìm thấy sản phẩm để xóa!', 1;

 
    IF EXISTS (SELECT 1 FROM dbo.ChiTietHoaDon WHERE MaSP = @MaSP)
    BEGIN
        THROW 50002, N'Lỗi nghiệp vụ: Sản phẩm này đã phát sinh hóa đơn bán hàng, không thể xóa để bảo toàn dữ liệu lịch sử!', 1;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.TonKho WHERE MaSP = @MaSP;

        
        DELETE FROM dbo.HangHoa WHERE MaSP = @MaSP;

        COMMIT TRANSACTION;

    
        SELECT CAST(1 AS BIT) AS deleted, @MaSP AS productCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO 


EXEC dbo.usp_Central_XoaHangHoa @MaSP = 'SP_TEST_01';
GO


CREATE OR ALTER PROCEDURE dbo.usp_Central_DieuChuyenKho
    @TuChiNhanh VARCHAR(10),
    @DenChiNhanh VARCHAR(10),
    @MaSP VARCHAR(50),
    @SoLuongChuyen INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 
	
    SET @TuChiNhanh = LTRIM(RTRIM(ISNULL(@TuChiNhanh, '')));
    SET @DenChiNhanh = LTRIM(RTRIM(ISNULL(@DenChiNhanh, '')));
    SET @MaSP = LTRIM(RTRIM(ISNULL(@MaSP, '')));
    --  Validate dữ liệu đầu vào
    IF @TuChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI') OR @DenChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI')
        THROW 50000, N'Chi nhánh điều chuyển không hợp lệ!', 1;

    IF @TuChiNhanh = @DenChiNhanh
        THROW 50000, N'Chi nhánh xuất và nhập không được trùng nhau!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @SoLuongChuyen <= 0
        THROW 50001, N'Số lượng điều chuyển phải lớn hơn 0!', 1;

    -- . Ánh xạ tên Linked Server và Database tương ứng
    DECLARE @SrcServer NVARCHAR(50), @SrcDB NVARCHAR(50);
    DECLARE @DestServer NVARCHAR(50), @DestDB NVARCHAR(50);

    -- Máy chủ Nguồn (TuChiNhanh)
    IF @TuChiNhanh = 'HUE' BEGIN SET @SrcServer = 'HUE_SERVER'; SET @SrcDB = 'Store_H'; END
    ELSE IF @TuChiNhanh = 'SAIGON' BEGIN SET @SrcServer = 'SG_SERVER'; SET @SrcDB = 'Store_SG'; END
    ELSE IF @TuChiNhanh = 'HANOI' BEGIN SET @SrcServer = 'HN_SERVER'; SET @SrcDB = 'Store_HN'; END

    -- Máy chủ Đích (DenChiNhanh)
    IF @DenChiNhanh = 'HUE' BEGIN SET @DestServer = 'HUE_SERVER'; SET @DestDB = 'Store_H'; END
    ELSE IF @DenChiNhanh = 'SAIGON' BEGIN SET @DestServer = 'SG_SERVER'; SET @DestDB = 'Store_SG'; END
    ELSE IF @DenChiNhanh = 'HANOI' BEGIN SET @DestServer = 'HN_SERVER'; SET @DestDB = 'Store_HN'; END

    -- . Kiểm tra tồn kho tại máy chủ nguồn 
    DECLARE @SQL_Check NVARCHAR(MAX);
    DECLARE @TonKhoHienTai INT;
    
    SET @SQL_Check = N'SELECT @TonKhoOut = SoLuongTon FROM [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
    
    EXEC sp_executesql 
        @stmt = @SQL_Check, 
        @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @TonKhoOut INT OUTPUT', 
        @p_MaSP = @MaSP, 
        @p_ChiNhanh = @TuChiNhanh, 
        @TonKhoOut = @TonKhoHienTai OUTPUT;

    IF @TonKhoHienTai IS NULL
        THROW 50002, N'Sản phẩm không tồn tại ở chi nhánh xuất!', 1;

    IF @TonKhoHienTai < @SoLuongChuyen
        THROW 50003, N'Chi nhánh xuất không đủ số lượng để chuyển!', 1;

    
    BEGIN TRY
        BEGIN DISTRIBUTED TRANSACTION;

        --  Trừ tồn kho chi nhánh xuất
        DECLARE @SQL_UpdateSrc NVARCHAR(MAX);
        SET @SQL_UpdateSrc = N'
            UPDATE [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho
            SET SoLuongTon = SoLuongTon - @p_SoLuong
            WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh;
        ';
        EXEC sp_executesql @SQL_UpdateSrc, N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @MaSP, @TuChiNhanh, @SoLuongChuyen;

        --  Cộng/Thêm tồn kho chi nhánh nhập
        DECLARE @SQL_UpdateDest NVARCHAR(MAX);
        SET @SQL_UpdateDest = N'
            UPDATE [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho
            SET SoLuongTon = SoLuongTon + @p_SoLuong
            WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh;

         
            IF @@ROWCOUNT = 0
            BEGIN
                INSERT INTO [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho (MaSP, SoLuongTon, ChiNhanh)
                VALUES (@p_MaSP, @p_SoLuong, @p_ChiNhanh);
            END
        ';
        EXEC sp_executesql @SQL_UpdateDest, N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @MaSP, @DenChiNhanh, @SoLuongChuyen;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO



SELECT ChiNhanh, MaSP, SoLuongTon AS TonKho_TruocKhiChuyen 
FROM dbo.TonKho 
WHERE MaSP = 'MI_GOI' AND ChiNhanh IN ('HUE', 'SAIGON')
ORDER BY ChiNhanh;


EXEC dbo.usp_Central_DieuChuyenKho 
    @TuChiNhanh = 'HUE', 
    @DenChiNhanh = 'SAIGON', 
    @MaSP = 'MI_GOI', 
    @SoLuongChuyen = 3;



SELECT ChiNhanh, MaSP, SoLuongTon AS TonKho_SauKhiChuyen 
FROM dbo.TonKho 
WHERE MaSP = 'MI_GOI' AND ChiNhanh IN ('HUE', 'SAIGON')
ORDER BY ChiNhanh;
GO
  



  /* ===== PROC QUẢN LÝ TÀI KHOẢN TOÀN HỆ THỐNG ===== */

-- Xem tài khoản từ linked server (3 chi nhánh)
CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachTaiKhoanToanBo
AS
BEGIN
    SET NOCOUNT ON;

    -- Tài khoản Central trước
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'CENTRAL'

    UNION ALL

    -- Tài khoản từ HUE (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [HUE_SERVER].[Store_H].dbo.TaiKhoan tk
    INNER JOIN [HUE_SERVER].[Store_H].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'HUE'

    UNION ALL

    -- Tài khoản từ SAIGON (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [SG_SERVER].[Store_SG].dbo.TaiKhoan tk
    INNER JOIN [SG_SERVER].[Store_SG].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'SAIGON'

    UNION ALL

    -- Tài khoản từ HANOI (nếu có linked server)
    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai, nv.ChiNhanh
    FROM [HN_SERVER].[Store_HN].dbo.TaiKhoan tk
    INNER JOIN [HN_SERVER].[Store_HN].dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'HANOI'

    ORDER BY ChiNhanh, TenDangNhap;
END;
GO

-- Tạo tài khoản tại CENTRAL (chỉ cho ADMIN_TOAN_BO)
CREATE OR ALTER PROCEDURE dbo.usp_Central_ThemTaiKhoan
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
        THROW 50000 , N'Mật khẩu không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@Quyen)), '') IS NULL
        THROW 50000, N'Quyền không được để trống!', 1;

    IF @Quyen NOT IN (N'NHAN_VIEN', N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50000, N'Quyền không hợp lệ! Chỉ chấp nhận: NHAN_VIEN, ADMIN_CHI_NHANH, ADMIN_TOAN_BO', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50001, N'Nhân viên không tồn tại trong hệ thống!', 1;

    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
        THROW 50002, N'Tên đăng nhập đã tồn tại!', 1;

    -- Mỗi nhân viên chỉ được có 1 tài khoản (quan hệ 1-1)
    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE MaNV = @MaNV)
        THROW 50003, N'Nhân viên này đã có tài khoản trong hệ thống!', 1;

    INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
    VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, COALESCE(@TrangThai, 1));
END;
GO

-- Cập nhật tài khoản CENTRAL (quyền, trạng thái, mật khẩu)
CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatTaiKhoan
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255) = NULL,
    @Quyen NVARCHAR(50) = NULL,
    @TrangThai BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    UPDATE dbo.TaiKhoan
    SET MatKhau = COALESCE(NULLIF(LTRIM(RTRIM(@MatKhau)), ''), MatKhau),
        Quyen = COALESCE(NULLIF(LTRIM(RTRIM(@Quyen)), ''), Quyen),
        TrangThai = COALESCE(@TrangThai, TrangThai)
    WHERE TenDangNhap = @TenDangNhap;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để cập nhật!', 1;
END;
GO

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

    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;
    IF @Quyen IN (N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50003, N'Lỗi bảo mật: Không được phép khóa tài khoản Quản trị viên!', 1;

    -- 1. BẮT BUỘC CẬP NHẬT TẠI CENTRAL TRƯỚC ĐỂ CHẶN LOGIN TỨC THÌ
    UPDATE dbo.TaiKhoan SET TrangThai = 0 WHERE TenDangNhap = @TenDangNhap;

    -- 2. ĐẨY LỆNH XUỐNG CÁC CHI NHÁNH QUA LINKED SERVER ĐỂ CẬP NHẬT TỨC THÌ BÊN DƯỚI
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

    IF @@ROWCOUNT = 0
        THROW 50002, N'Không tìm thấy tài khoản để khóa!', 1;
END;
GO

-- Mở khóa tài khoản
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
        THROW 50002, N'Không tìm thấy tài khoản để mở khóa!', 1;
END;
GO


-- Reset mật khẩu (dùng cho cả CENTRAL và linked branches)
CREATE OR ALTER PROCEDURE dbo.usp_Central_ResetMatKhau
    @TenDangNhap VARCHAR(50),
    @MatKhauMoi VARCHAR(255),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MatKhauMoi)), '') IS NULL
        THROW 50000, N'Mật khẩu mới không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ChiNhanh)), '') IS NULL
        THROW 50000, N'Chi nhánh không được để trống!', 1;

    IF @ChiNhanh = 'CENTRAL'
    BEGIN
        UPDATE dbo.TaiKhoan SET MatKhau = @MatKhauMoi WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'HUE'
    BEGIN
        UPDATE [HUE_SERVER].[Store_H].dbo.TaiKhoan SET MatKhau = @MatKhauMoi WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'SAIGON'
    BEGIN
        UPDATE [SG_SERVER].[Store_SG].dbo.TaiKhoan SET MatKhau = @MatKhauMoi WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE IF @ChiNhanh = 'HANOI'
    BEGIN
        UPDATE [HN_SERVER].[Store_HN].dbo.TaiKhoan SET MatKhau = @MatKhauMoi WHERE TenDangNhap = @TenDangNhap;
    END
    ELSE
        THROW 50001, N'Chi nhánh không hợp lệ!', 1;

    IF @@ROWCOUNT = 0
        THROW 50002, N'Không tìm thấy tài khoản để reset mật khẩu!', 1;
END;
GO

-- Xóa tài khoản khỏi CENTRAL
CREATE OR ALTER PROCEDURE dbo.usp_Central_XoaTaiKhoan
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@TenDangNhap)), '') IS NULL
        THROW 50000, N'Tên đăng nhập không được để trống!', 1;

    DELETE FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để xóa!', 1;
END;
GO


  CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachKhuyenMai
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc
    FROM dbo.KhuyenMai
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachKhuyenMaiHieuLuc
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc
    FROM dbo.KhuyenMai
    WHERE GETDATE() BETWEEN NgayBatDau AND NgayKetThuc
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_ThemKhuyenMai
    @MaKM VARCHAR(50),
    @TenChuongTrinh NVARCHAR(150),
    @PhanTramGiam INT,
    @NgayBatDau DATETIME2,
    @NgayKetThuc DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaKM)), '') IS NULL
        THROW 50000, N'Mã khuyến mãi không được để trống!', 1;
    IF NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), '') IS NULL
        THROW 50000, N'Tên chương trình không được để trống!', 1;
    IF @PhanTramGiam < 0 OR @PhanTramGiam > 100
        THROW 50000, N'Phần trăm giảm phải từ 0 đến 100!', 1;
    IF @NgayKetThuc < @NgayBatDau
        THROW 50000, N'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!', 1;
    IF EXISTS (SELECT 1 FROM dbo.KhuyenMai WHERE MaKM = @MaKM)
        THROW 50001, N'Mã khuyến mãi đã tồn tại!', 1;

    INSERT INTO dbo.KhuyenMai (MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc)
    VALUES (@MaKM, @TenChuongTrinh, @PhanTramGiam, @NgayBatDau, @NgayKetThuc);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatKhuyenMai
    @MaKM VARCHAR(50),
    @TenChuongTrinh NVARCHAR(150) = NULL,
    @PhanTramGiam INT = NULL,
    @NgayBatDau DATETIME2 = NULL,
    @NgayKetThuc DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.KhuyenMai
    SET TenChuongTrinh = COALESCE(NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), ''), TenChuongTrinh),
        PhanTramGiam = COALESCE(@PhanTramGiam, PhanTramGiam),
        NgayBatDau = COALESCE(@NgayBatDau, NgayBatDau),
        NgayKetThuc = COALESCE(@NgayKetThuc, NgayKetThuc)
    WHERE MaKM = @MaKM;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy khuyến mãi để cập nhật!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_XoaKhuyenMai
    @MaKM VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.KhuyenMai
    WHERE MaKM = @MaKM;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy khuyến mãi để xóa!', 1;
END;
GO








  CREATE OR ALTER PROCEDURE dbo.usp_Central_DoanhThuQuocGia
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hd.ChiNhanh AS BranchCode,
        SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))) AS Revenue
    FROM dbo.HoaDon hd
    INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
    WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
    GROUP BY hd.ChiNhanh
    ORDER BY hd.ChiNhanh;
END;
GO 
EXECUTE dbo.usp_Central_DoanhThuQuocGia;

go
CREATE OR ALTER PROCEDURE dbo.usp_Central_DoanhThuVaSoDon_TheoNgay
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hd.ChiNhanh,
        CAST(hd.NgayTao AS DATE) AS Ngay,
        COUNT(DISTINCT hd.MaHD) AS TongSoDonHang,
        SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))) AS TongDoanhThu
    FROM dbo.HoaDon hd
    INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
    WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
    GROUP BY hd.ChiNhanh, CAST(hd.NgayTao AS DATE)
    ORDER BY Ngay DESC, hd.ChiNhanh;
END;
GO
EXECUTE dbo.usp_Central_DoanhThuVaSoDon_TheoNgay;
go
CREATE OR ALTER PROCEDURE dbo.usp_Central_DoanhThuVaSoDon_TheoTuan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hd.ChiNhanh,
        DATEPART(YEAR, hd.NgayTao) AS Nam,
        DATEPART(WEEK, hd.NgayTao) AS TuanTrongNam,
        COUNT(DISTINCT hd.MaHD) AS TongSoDonHang,
        SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))) AS TongDoanhThu
    FROM dbo.HoaDon hd
    INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
    WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
    GROUP BY hd.ChiNhanh, DATEPART(YEAR, hd.NgayTao), DATEPART(WEEK, hd.NgayTao)
    ORDER BY Nam DESC, TuanTrongNam DESC, hd.ChiNhanh;
END;
GO 
 EXEC dbo.usp_Central_DoanhThuVaSoDon_TheoTuan;
 go 
CREATE OR ALTER PROCEDURE dbo.usp_Central_NhanVienBanTotNhatTuan
AS
BEGIN
    SET NOCOUNT ON;

    WITH TinhDoanhThu AS (
        SELECT
            hd.ChiNhanh,
            hd.MaNV,
            nv.HoTen,
            SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))) AS TongDoanhThu,
            ROW_NUMBER() OVER (
                PARTITION BY hd.ChiNhanh
                ORDER BY SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))) DESC
            ) AS Hang
        FROM dbo.HoaDon hd
        INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
        INNER JOIN dbo.NhanVien nv ON nv.MaNV = hd.MaNV AND nv.ChiNhanh = hd.ChiNhanh
        WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
          AND DATEPART(WEEK, hd.NgayTao) = DATEPART(WEEK, GETDATE())
          AND DATEPART(YEAR, hd.NgayTao) = DATEPART(YEAR, GETDATE())
        GROUP BY hd.ChiNhanh, hd.MaNV, nv.HoTen
    )
    SELECT ChiNhanh, MaNV, HoTen, TongDoanhThu
    FROM TinhDoanhThu
    WHERE Hang = 1;
END;
GO
 EXEC dbo.usp_Central_NhanVienBanTotNhatTuan;
 go 

CREATE OR ALTER PROCEDURE dbo.usp_Central_SanPhamBanChayNhat_MoiChiNhanh
AS
BEGIN
    SET NOCOUNT ON;

    WITH TinhSoLuong AS (
        SELECT
            hd.ChiNhanh,
            ct.MaSP,
            hh.TenHang,
            SUM(ct.SoLuong) AS TongSoLuongBan,
            ROW_NUMBER() OVER (
                PARTITION BY hd.ChiNhanh
                ORDER BY SUM(ct.SoLuong) DESC
            ) AS Hang
        FROM dbo.HoaDon hd
        INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
        INNER JOIN dbo.HangHoa hh ON hh.MaSP = ct.MaSP
        WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
          AND DATEPART(WEEK, hd.NgayTao) = DATEPART(WEEK, GETDATE())
          AND DATEPART(YEAR, hd.NgayTao) = DATEPART(YEAR, GETDATE())
        GROUP BY hd.ChiNhanh, ct.MaSP, hh.TenHang
    )
    SELECT ChiNhanh, MaSP, TenHang, TongSoLuongBan
    FROM TinhSoLuong
    WHERE Hang = 1;
END;
GO
 EXEC dbo.usp_Central_SanPhamBanChayNhat_MoiChiNhanh;

CREATE OR ALTER PROCEDURE dbo.usp_Central_SoSanhDoanhThuTuan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hd.ChiNhanh,
        SUM(CASE WHEN DATEPART(WEEK, hd.NgayTao) = DATEPART(WEEK, GETDATE())
                 THEN CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2)) ELSE 0 END) AS DoanhThuTuanNay,
        SUM(CASE WHEN DATEPART(WEEK, hd.NgayTao) = DATEPART(WEEK, GETDATE()) - 1
                 THEN CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2)) ELSE 0 END) AS DoanhThuTuanTruoc
    FROM dbo.HoaDon hd
    INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
    WHERE hd.ChiNhanh IN ('HUE', 'SAIGON', 'HANOI')
      AND DATEPART(YEAR, hd.NgayTao) = DATEPART(YEAR, GETDATE())
      AND DATEPART(WEEK, hd.NgayTao) IN (DATEPART(WEEK, GETDATE()), DATEPART(WEEK, GETDATE()) - 1)
    GROUP BY hd.ChiNhanh
    ORDER BY hd.ChiNhanh;
END;
GO

 EXEC dbo.usp_Central_SoSanhDoanhThuTuan;
