
use CentralDB 
GO 






CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachHangHoaKemTonKho]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        hh.MaSP AS productCode,
        hh.TenHang AS productName,
        CAST(hh.Gia AS DECIMAL(10,2)) AS unitPrice,
        hh.MoTa AS description,
        hh.AnhSanPham AS imageUrl,
        hh.DonViTinh AS unit,
        ISNULL(tk.SoLuongTon, 0) AS stock,
        CAST(hh.TrangThai AS BIT) AS active,
        hh.MaDM AS categoryCode,
        dm.TenDM AS categoryName,
        hh.MaTH AS brandCode,
        th.TenTH AS brandName,
        hh.Barcode AS barcode
    FROM dbo.HangHoa hh
    LEFT JOIN dbo.TonKho tk ON hh.MaSP = tk.MaSP AND tk.ChiNhanh = @ChiNhanh
    LEFT JOIN dbo.DanhMuc dm ON hh.MaDM = dm.MaDM
    LEFT JOIN dbo.ThuongHieu th ON hh.MaTH = th.MaTH
    ORDER BY hh.MaSP;
END
GO








-- =============================================
-- CẬP NHẬT: THÊM HÀNG HÓA MỚI (Hỗ trợ Danh mục, Thương hiệu, Barcode)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Central_ThemHangHoaMoi]
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100),
    @Gia DECIMAL(10,2),
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL,
    @MaDM VARCHAR(20) = NULL,
    @MaTH VARCHAR(20) = NULL,
    @Barcode VARCHAR(50) = NULL
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

        INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia, MoTa, AnhSanPham, DonViTinh, TrangThai, MaDM, MaTH, Barcode)
        VALUES (@MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh, 1, @MaDM, @MaTH, @Barcode);

        -- Chèn Tồn Kho ban đầu (Số lượng = 0) cho 3 Chi nhánh
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

-- =============================================
-- CẬP NHẬT: SỬA HÀNG HÓA (Hỗ trợ Danh mục, Thương hiệu, Barcode, TrangThai)
-- =============================================
CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatHangHoa
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100) = NULL,
    @Gia DECIMAL(10,2) = NULL,
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL,
    @MaDM VARCHAR(20) = NULL,
    @MaTH VARCHAR(20) = NULL,
    @Barcode VARCHAR(50) = NULL,
    @TrangThai INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @Gia IS NOT NULL AND @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50001, N'Không tìm thấy sản phẩm để cập nhật!', 1;

    UPDATE dbo.HangHoa
    SET TenHang = COALESCE(NULLIF(LTRIM(RTRIM(@TenHang)), ''), TenHang),
        Gia = COALESCE(@Gia, Gia),
        MoTa = COALESCE(@MoTa, MoTa),
        AnhSanPham = COALESCE(@AnhSanPham, AnhSanPham),
        DonViTinh = COALESCE(@DonViTinh, DonViTinh),
        MaDM = COALESCE(@MaDM, MaDM),
        MaTH = COALESCE(@MaTH, MaTH),
        Barcode = COALESCE(@Barcode, Barcode),
        TrangThai = COALESCE(@TrangThai, TrangThai)
    WHERE MaSP = @MaSP;

    SELECT TOP 1 MaSP, TenHang, CAST(Gia AS DECIMAL(10,2)) AS Gia, MoTa, AnhSanPham, DonViTinh, TrangThai, MaDM, MaTH, Barcode
    FROM dbo.HangHoa
    WHERE MaSP = @MaSP;
END;
GO

-- =============================================
-- CẬP NHẬT: LẤY CHI TIẾT SẢN PHẨM THEO MÃ
-- (Chạy trên tất cả các server, phục vụ xem chi tiết hóa đơn cũ)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_HangHoaTheoMaSP]
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    SELECT TOP 1 
        hh.MaSP, 
        hh.TenHang, 
        CAST(hh.Gia AS DECIMAL(10,2)) AS Gia,
        hh.MoTa,
        hh.AnhSanPham,
        hh.DonViTinh,
        hh.TrangThai,
        hh.MaDM,
        dm.TenDM,
        hh.MaTH,
        th.TenTH,
        hh.Barcode
    FROM dbo.HangHoa hh
    LEFT JOIN dbo.DanhMuc dm ON hh.MaDM = dm.MaDM
    LEFT JOIN dbo.ThuongHieu th ON hh.MaTH = th.MaTH
    WHERE hh.MaSP = @MaSP;
END;
GO


CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachDanhMuc]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaDM AS categoryCode,
        TenDM AS categoryName,
        MoTa AS description
    FROM dbo.DanhMuc
    ORDER BY MaDM;
END
GO

-- =============================================
-- Lấy danh sách thương hiệu sản phẩm
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachThuongHieu]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaTH AS brandCode,
        TenTH AS brandName,
        QuocGia AS country
    FROM dbo.ThuongHieu
    ORDER BY MaTH;
END
GO


CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DieuChuyenKho]
    @TuChiNhanh VARCHAR(10),
    @DenChiNhanh VARCHAR(10),
    @MaSP VARCHAR(50),
    @SoLuongChuyen INT,
    @NguoiChuyen VARCHAR(50) = 'SYSTEM'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 
	
    SET @TuChiNhanh = LTRIM(RTRIM(ISNULL(@TuChiNhanh, '')));
    SET @DenChiNhanh = LTRIM(RTRIM(ISNULL(@DenChiNhanh, '')));
    SET @MaSP = LTRIM(RTRIM(ISNULL(@MaSP, '')));
    
    -- 1. Validate dữ liệu đầu vào
    IF @TuChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI') OR @DenChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI')
        THROW 50000, N'Chi nhánh điều chuyển không hợp lệ!', 1;

    IF @TuChiNhanh = @DenChiNhanh
        THROW 50000, N'Chi nhánh xuất và nhập không được trùng nhau!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @SoLuongChuyen <= 0
        THROW 50001, N'Số lượng điều chuyển phải lớn hơn 0!', 1;

    -- 2. Ánh xạ tên Linked Server và Database tương ứng
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

    -- 3. Kiểm tra tồn kho tại máy chủ nguồn qua Linked Server
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
        THROW 50002, N'Sản phẩm không tồn tại trong kho nguồn!', 1;

    IF @TonKhoHienTai < @SoLuongChuyen
        THROW 50003, N'Số lượng tồn kho không đủ để điều chuyển!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 4. Sinh Mã Phiếu Chuyển Kho tự động (Format: PCK-YYYYMMDD-HHMMSS)
        DECLARE @MaPCK VARCHAR(50) = 'PCK-' + FORMAT(GETDATE(), 'yyyyMMdd-HHmmss');

        -- 5. LƯU VẾT VÀO CENTRAL (Bảng PhieuChuyenKho và ChiTietChuyenKho)
        INSERT INTO [dbo].[PhieuChuyenKho] (MaPCK, TuChiNhanh, DenChiNhanh, NgayChuyen, NguoiChuyen, GhiChu)
        VALUES (@MaPCK, @TuChiNhanh, @DenChiNhanh, GETDATE(), @NguoiChuyen, N'Điều chuyển nội bộ');

        INSERT INTO [dbo].[ChiTietChuyenKho] (MaPCK, MaSP, SoLuongChuyen)
        VALUES (@MaPCK, @MaSP, @SoLuongChuyen);

        -- 6. THỰC THI GIAO DỊCH PHÂN TÁN (Trừ kho Nguồn, Cộng kho Đích)
        DECLARE @SQL_Update NVARCHAR(MAX);

        -- Cập nhật kho nguồn (Trừ số lượng)
        SET @SQL_Update = N'UPDATE [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon - @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
        EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @TuChiNhanh, @p_SoLuong = @SoLuongChuyen;

        -- Cập nhật kho đích (Cộng số lượng, nếu chưa có thì Insert)
        -- LƯU Ý: Phải kiểm tra xem kho đích đã có dòng sản phẩm này chưa
        SET @SQL_Update = N'
            IF EXISTS(SELECT 1 FROM [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh)
                UPDATE [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon + @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh;
            ELSE
                INSERT INTO [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@p_MaSP, @p_SoLuong, @p_ChiNhanh);
        ';
        EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @DenChiNhanh, @p_SoLuong = @SoLuongChuyen;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
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

   -- KIỂM TRA BẢO MẬT PHÂN TÁN: Bắt lỗi nếu truyền sai Chi Nhánh
    DECLARE @ActualBranch VARCHAR(10);
    SELECT @ActualBranch = nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap;

    IF @ActualBranch IS NULL
        THROW 50002, N'Không tìm thấy tài khoản để khóa!', 1;

    IF @ActualBranch <> @ChiNhanh
        THROW 50004, N'Lỗi đồng bộ: Tài khoản này không thuộc chi nhánh bạn cung cấp!', 1;


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

		 DECLARE @ActualBranch VARCHAR(10);
    SELECT @ActualBranch = nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap;

    IF @ActualBranch IS NULL
        THROW 50002, N'Không tìm thấy tài khoản để mở khóa!', 1;

    IF @ActualBranch <> @ChiNhanh
        THROW 50004, N'Lỗi đồng bộ: Tài khoản này không thuộc chi nhánh bạn cung cấp!', 1;

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


-- 1. Lấy danh sách Toàn bộ Khuyến mãi
CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachKhuyenMai
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc,
           LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, 
           SoLuongGioiHan, SoLuongDaDung, ChoPhepCongDon, TrangThai
    FROM dbo.KhuyenMai
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO
-- 2. Lấy danh sách Khuyến mãi Đang Hiệu Lực
CREATE OR ALTER PROCEDURE dbo.usp_Central_DanhSachKhuyenMaiHieuLuc
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc,
           LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, 
           SoLuongGioiHan, SoLuongDaDung, ChoPhepCongDon, TrangThai
    FROM dbo.KhuyenMai
    WHERE GETDATE() BETWEEN NgayBatDau AND NgayKetThuc
      AND TrangThai = 1
      AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO
-- 3. Thêm mới Khuyến Mãi
CREATE OR ALTER PROCEDURE dbo.usp_Central_ThemKhuyenMai
    @MaKM VARCHAR(50),
    @TenChuongTrinh NVARCHAR(150),
    @PhanTramGiam INT,
    @NgayBatDau DATETIME2,
    @NgayKetThuc DATETIME2,
    @LoaiKhuyenMai VARCHAR(20) = 'PERCENTAGE',
    @SoTienGiamTrucTiep DECIMAL(15,2) = 0,
    @GiamToiDa DECIMAL(15,2) = NULL,
    @DonHangToiThieu DECIMAL(15,2) = 0,
    @SoLuongGioiHan INT = NULL,
    @ChoPhepCongDon BIT = 1,
    @TrangThai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@MaKM)), '') IS NULL THROW 50000, N'Mã khuyến mãi không được để trống!', 1;
    IF NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), '') IS NULL THROW 50000, N'Tên chương trình không được để trống!', 1;
    IF @PhanTramGiam < 0 OR @PhanTramGiam > 100 THROW 50000, N'Phần trăm giảm phải từ 0 đến 100!', 1;
    IF @NgayKetThuc < @NgayBatDau THROW 50000, N'Ngày kết thúc phải >= ngày bắt đầu!', 1;
    IF EXISTS (SELECT 1 FROM dbo.KhuyenMai WHERE MaKM = @MaKM) THROW 50001, N'Mã khuyến mãi đã tồn tại!', 1;
    INSERT INTO dbo.KhuyenMai (MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc, 
                               LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, SoLuongGioiHan, ChoPhepCongDon, TrangThai)
    VALUES (@MaKM, @TenChuongTrinh, @PhanTramGiam, @NgayBatDau, @NgayKetThuc, 
            @LoaiKhuyenMai, @SoTienGiamTrucTiep, @GiamToiDa, @DonHangToiThieu, @SoLuongGioiHan, @ChoPhepCongDon, @TrangThai);
END;
GO
-- 4. Cập nhật Khuyến Mãi
CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatKhuyenMai
    @MaKM VARCHAR(50),
    @TenChuongTrinh NVARCHAR(150) = NULL,
    @PhanTramGiam INT = NULL,
    @NgayBatDau DATETIME2 = NULL,
    @NgayKetThuc DATETIME2 = NULL,
    @LoaiKhuyenMai VARCHAR(20) = NULL,
    @SoTienGiamTrucTiep DECIMAL(15,2) = NULL,
    @GiamToiDa DECIMAL(15,2) = NULL,
    @DonHangToiThieu DECIMAL(15,2) = NULL,
    @SoLuongGioiHan INT = NULL,
    @ChoPhepCongDon BIT = NULL,
    @TrangThai BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.KhuyenMai
    SET TenChuongTrinh = COALESCE(NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), ''), TenChuongTrinh),
        PhanTramGiam = COALESCE(@PhanTramGiam, PhanTramGiam),
        NgayBatDau = COALESCE(@NgayBatDau, NgayBatDau),
        NgayKetThuc = COALESCE(@NgayKetThuc, NgayKetThuc),
        LoaiKhuyenMai = COALESCE(@LoaiKhuyenMai, LoaiKhuyenMai),
        SoTienGiamTrucTiep = COALESCE(@SoTienGiamTrucTiep, SoTienGiamTrucTiep),
        GiamToiDa = COALESCE(@GiamToiDa, GiamToiDa),
        DonHangToiThieu = COALESCE(@DonHangToiThieu, DonHangToiThieu),
        SoLuongGioiHan = COALESCE(@SoLuongGioiHan, SoLuongGioiHan),
        ChoPhepCongDon = COALESCE(@ChoPhepCongDon, ChoPhepCongDon),
        TrangThai = COALESCE(@TrangThai, TrangThai)
    WHERE MaKM = @MaKM;
    IF @@ROWCOUNT = 0 THROW 50001, N'Không tìm thấy khuyến mãi để cập nhật!', 1;
END;
GO
-- 5. Xóa Mềm Khuyến Mãi (Tắt Trạng Thái)
CREATE OR ALTER PROCEDURE dbo.usp_Central_XoaKhuyenMai
    @MaKM VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Xóa mềm: Chuyển TrangThai = 0 thay vì dùng lệnh DELETE
    UPDATE dbo.KhuyenMai
    SET TrangThai = 0
    WHERE MaKM = @MaKM;
    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy khuyến mãi để xóa!', 1;
END;
GO



 

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DanhSachNhanVienToanBo]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM dbo.NhanVien 
    ORDER BY ChiNhanh, HoTen;
END
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


 CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachKhachHang]
    @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaKH AS customerId,
        HoTen AS fullName,
        SoDienThoai AS phoneNumber,
        DiemTichLuy AS points,
        ChiNhanhDK AS branchId,
        NgayDangKy AS registeredAt
    FROM dbo.KhachHang
    WHERE (@SearchTerm IS NULL 
           OR HoTen LIKE '%' + @SearchTerm + '%'
           OR SoDienThoai LIKE '%' + @SearchTerm + '%')
    ORDER BY NgayDangKy DESC;
END;
GO

-- 2. THÊM KHÁCH HÀNG MỚI
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_ThemKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15),
    @ChiNhanhDK VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NULL
        THROW 50000, N'Mã khách hàng không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.KhachHang WHERE SoDienThoai = @SoDienThoai)
        THROW 50001, N'Số điện thoại đã được đăng ký cho một khách hàng khác!', 1;

    IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        THROW 50002, N'Mã khách hàng đã tồn tại!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK, NgayDangKy)
        VALUES (@MaKH, @HoTen, @SoDienThoai, 0, @ChiNhanhDK, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. CẬP NHẬT THÔNG TIN CƠ BẢN (Không cho phép cập nhật điểm)
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_CapNhatKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        THROW 50001, N'Không tìm thấy khách hàng!', 1;

    IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.KhachHang WHERE SoDienThoai = @SoDienThoai AND MaKH <> @MaKH)
        THROW 50002, N'Số điện thoại đã được sử dụng bởi khách hàng khác!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.KhachHang
        SET HoTen = @HoTen,
            SoDienThoai = @SoDienThoai
        WHERE MaKH = @MaKH;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
 





-- BƯỚC 1: Chọn một nhân viên đang active (TrangThai = 1) để làm nạn nhân
-- Ghi chú lại TenDangNhap để lát nữa test trên Postman
SELECT TOP 1 MaNV, TenDangNhap, Quyen, TrangThai 
FROM dbo.TaiKhoan 
WHERE TrangThai = 1 
  AND Quyen NOT IN ('ADMIN_TOAN_BO', 'ADMIN_CHI_NHANH');

-- BƯỚC 2: Dùng lệnh SQL để khóa mỏm tài khoản này (Giả lập thao tác của Admin)
UPDATE dbo.TaiKhoan
SET TrangThai = 0
WHERE TenDangNhap = 'dang_thi_k_H010';

-- BƯỚC 3: Mở Postman lên, chạy API Đăng nhập với tài khoản 'nhanvien_test'.
-- => KỲ VỌNG: Postman trả về HTTP 401 hoặc 403 báo "Tài khoản đã bị khóa".

SELECT MaNV, TenDangNhap, TrangThai 
FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'dang_thi_k_H010';

-- =============================================
-- BƯỚC 4 (TEARDOWN - PHỤC HỒI DỮ LIỆU SAU KHI TEST XONG)

UPDATE dbo.TaiKhoan
SET TrangThai = 1
WHERE TenDangNhap = 'dang_thi_k_H010';




-- Đếm tổng số tài khoản đang có trên toàn hệ thống
SELECT COUNT(*) AS TongSoTaiKhoanThucTe 
FROM dbo.TaiKhoan;


EXEC dbo.usp_Central_DanhSachTaiKhoanToanBo;










-- =============================================
-- TEST DATA SCRIPT: CHUẨN BỊ CHO KỊCH BẢN TẠO TÀI KHOẢN (CREATE ACCOUNT)
-- Nơi chạy: SSMS (Kết nối CENTRAL)
-- =============================================

-- ==========================
-- TÌM KIẾM DỮ LIỆU ĐỂ TEST
-- ==========================

-- 1. TÌM NHÂN VIÊN CHƯA CÓ TÀI KHOẢN (Dùng cho Kịch bản Happy Path)
-- Chụp ảnh KQ này: Lấy 1 mã MaNV làm "mồi" để Postman tạo acc
SELECT TOP 1 nv.MaNV, nv.HoTen, nv.ChiNhanh
FROM dbo.NhanVien nv
LEFT JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV
WHERE tk.TenDangNhap IS NULL; 

-- 2. TÌM NHÂN VIÊN ĐÃ CÓ TÀI KHOẢN (Dùng cho Kịch bản Negative: 1 người 2 acc)
-- Chụp ảnh KQ này: Báo cáo tao dùng cái MaNV này để cố tình tạo thêm acc
SELECT TOP 1 nv.MaNV, tk.TenDangNhap 
FROM dbo.NhanVien nv
INNER JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV;

-- ==========================
-- KIỂM CHỨNG SAU KHI TEST (POSTMAN TRẢ VỀ 200/201)
-- ==========================

-- 3. CHỨNG MINH TÀI KHOẢN ĐÃ ĐƯỢC INSERT THÀNH CÔNG VÀO DB
-- Thay 'nv_test_moi' bằng cái username bạn vừa nhập trên Postman nhé
SELECT * FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'nv_test_moi';
