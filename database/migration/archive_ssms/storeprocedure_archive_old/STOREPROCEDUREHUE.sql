USE Store_H;
GO


/* PHẦN 1: VIEW TOÀN CỤC */
CREATE OR ALTER VIEW dbo.v_NhanVien_ToanQuoc AS
SELECT MaNV, HoTen, ChucVu, ChiNhanh FROM dbo.NhanVien
UNION ALL
SELECT MaNV, HoTen, ChucVu, ChiNhanh FROM [LINK_SAIGON].[Store_SG].dbo.NhanVien
UNION ALL
SELECT MaNV, HoTen, ChucVu, ChiNhanh FROM [LINK_HANOI].[Store_HN].dbo.NhanVien;
GO 
SELECT * FROM dbo.v_NhanVien_ToanQuoc;
GO

CREATE OR ALTER VIEW dbo.v_HoaDonChiTiet_ToanQuoc AS
SELECT hd.MaHD, hd.NgayTao, hd.ChiNhanh, hd.MaNV, ct.MaSP, ct.SoLuong, ct.DonGia,
       CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2)) AS ThanhTien
FROM dbo.HoaDon hd
JOIN dbo.ChiTietHoaDon ct ON hd.MaHD = ct.MaHD
UNION ALL
SELECT hd.MaHD, hd.NgayTao, hd.ChiNhanh, hd.MaNV, ct.MaSP, ct.SoLuong, ct.DonGia,
       CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2)) AS ThanhTien
FROM [LINK_SAIGON].[Store_SG].dbo.HoaDon hd
JOIN [LINK_SAIGON].[Store_SG].dbo.ChiTietHoaDon ct ON hd.MaHD = ct.MaHD
UNION ALL
SELECT hd.MaHD, hd.NgayTao, hd.ChiNhanh, hd.MaNV, ct.MaSP, ct.SoLuong, ct.DonGia,
       CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2)) AS ThanhTien
FROM [LINK_HANOI].[Store_HN].dbo.HoaDon hd
JOIN [LINK_HANOI].[Store_HN].dbo.ChiTietHoaDon ct ON hd.MaHD = ct.MaHD;
GO


SELECT * FROM dbo.v_HoaDonChiTiet_ToanQuoc;

GO 


CREATE OR ALTER VIEW dbo.v_TonKho_ToanQuoc AS
SELECT MaSP, SoLuongTon, ChiNhanh FROM dbo.TonKho
UNION ALL
SELECT MaSP, SoLuongTon, ChiNhanh FROM [LINK_SAIGON].[Store_SG].dbo.TonKho
UNION ALL
SELECT MaSP, SoLuongTon, ChiNhanh FROM [LINK_HANOI].[Store_HN].dbo.TonKho;
GO

SELECT * FROM dbo.v_TonKho_ToanQuoc;

/*  PHẦN 2: PROC BÁO CÁO TOÀN CỤC */
CREATE OR ALTER PROCEDURE dbo.usp_DanhSachNhanVienToanHeThong
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.v_NhanVien_ToanQuoc ORDER BY ChiNhanh, MaNV;
END;
GO 

EXEC dbo.usp_DanhSachNhanVienToanHeThong;
 GO

CREATE OR ALTER PROCEDURE dbo.usp_DoanhThuVaSoDon_TheoNgay
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ChiNhanh,
        CAST(NgayTao AS DATE) AS Ngay,
        COUNT(DISTINCT MaHD) AS TongSoDonHang,
        SUM(ThanhTien) AS TongDoanhThu
    FROM dbo.v_HoaDonChiTiet_ToanQuoc
    GROUP BY ChiNhanh, CAST(NgayTao AS DATE)
    ORDER BY Ngay DESC, ChiNhanh;
END;
GO

EXEC dbo.usp_DoanhThuVaSoDon_TheoNgay;
 GO

CREATE OR ALTER PROCEDURE dbo.usp_DoanhThuVaSoDon_TheoTuan
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ChiNhanh,
        DATEPART(YEAR, NgayTao) AS Nam,
        DATEPART(WEEK, NgayTao) AS TuanTrongNam,
        COUNT(DISTINCT MaHD) AS TongSoDonHang,
        SUM(ThanhTien) AS TongDoanhThu
    FROM dbo.v_HoaDonChiTiet_ToanQuoc
    GROUP BY ChiNhanh, DATEPART(YEAR, NgayTao), DATEPART(WEEK, NgayTao)
    ORDER BY Nam DESC, TuanTrongNam DESC, ChiNhanh;
END;
GO 
 EXEC dbo.usp_DoanhThuVaSoDon_TheoTuan;
GO

CREATE OR ALTER PROCEDURE dbo.usp_NhanVienBanTotNhatTuan
AS
BEGIN
    SET NOCOUNT ON;

    WITH TinhDoanhThu AS (
        SELECT
            v.ChiNhanh,
            v.MaNV,
            nv.HoTen,
            SUM(v.ThanhTien) AS TongDoanhThu,
            ROW_NUMBER() OVER (PARTITION BY v.ChiNhanh ORDER BY SUM(v.ThanhTien) DESC) AS Hang
        FROM dbo.v_HoaDonChiTiet_ToanQuoc v
        JOIN dbo.v_NhanVien_ToanQuoc nv
          ON v.MaNV = nv.MaNV AND v.ChiNhanh = nv.ChiNhanh
        WHERE DATEPART(WEEK, v.NgayTao) = DATEPART(WEEK, GETDATE())
          AND DATEPART(YEAR, v.NgayTao) = DATEPART(YEAR, GETDATE())
        GROUP BY v.ChiNhanh, v.MaNV, nv.HoTen
    )
    SELECT ChiNhanh, MaNV, HoTen, TongDoanhThu
    FROM TinhDoanhThu
    WHERE Hang = 1;
END;
GO 
 EXEC dbo.usp_NhanVienBanTotNhatTuan;
GO

CREATE OR ALTER PROCEDURE dbo.usp_SanPhamBanChayNhat_MoiChiNhanh
AS
BEGIN
    SET NOCOUNT ON;

    WITH TinhSoLuong AS (
        SELECT
            v.ChiNhanh,
            v.MaSP,
            hh.TenHang,
            SUM(v.SoLuong) AS TongSoLuongBan,
            ROW_NUMBER() OVER (PARTITION BY v.ChiNhanh ORDER BY SUM(v.SoLuong) DESC) AS Hang
        FROM dbo.v_HoaDonChiTiet_ToanQuoc v
        JOIN dbo.HangHoa hh ON v.MaSP = hh.MaSP
        WHERE DATEPART(WEEK, v.NgayTao) = DATEPART(WEEK, GETDATE())
          AND DATEPART(YEAR, v.NgayTao) = DATEPART(YEAR, GETDATE())
        GROUP BY v.ChiNhanh, v.MaSP, hh.TenHang
    )
    SELECT ChiNhanh, MaSP, TenHang, TongSoLuongBan
    FROM TinhSoLuong
    WHERE Hang = 1;
END;
GO 
 EXEC dbo.usp_SanPhamBanChayNhat_MoiChiNhanh;
 GO

CREATE OR ALTER PROCEDURE dbo.usp_SoSanhDoanhThuTuan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ChiNhanh,
        SUM(CASE WHEN DATEPART(WEEK, NgayTao) = DATEPART(WEEK, GETDATE())
                 THEN ThanhTien ELSE 0 END) AS DoanhThuTuanNay,
        SUM(CASE WHEN DATEPART(WEEK, NgayTao) = DATEPART(WEEK, GETDATE()) - 1
                 THEN ThanhTien ELSE 0 END) AS DoanhThuTuanTruoc
    FROM dbo.v_HoaDonChiTiet_ToanQuoc
    WHERE DATEPART(YEAR, NgayTao) = DATEPART(YEAR, GETDATE())
      AND DATEPART(WEEK, NgayTao) IN (DATEPART(WEEK, GETDATE()), DATEPART(WEEK, GETDATE()) - 1)
    GROUP BY ChiNhanh
    ORDER BY ChiNhanh;
END;
GO

 EXEC dbo.usp_SoSanhDoanhThuTuan;
GO
CREATE OR ALTER PROCEDURE dbo.usp_XemTonKhoTatCaChiNhanh
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        v.ChiNhanh,
        v.MaSP,
        h.TenHang,
        v.SoLuongTon
    FROM dbo.v_TonKho_ToanQuoc v
    JOIN dbo.HangHoa h ON v.MaSP = h.MaSP
    ORDER BY v.MaSP, v.ChiNhanh;
END;
GO 

EXEC dbo.usp_XemTonKhoTatCaChiNhanh;
 GO

/*  PHẦN 3: PROC NGHIỆP VỤ CỤC BỘ   */
CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachNhanVien
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.NhanVien;
END;
GO 

 EXEC dbo.usp_Local_DanhSachNhanVien;
GO


CREATE OR ALTER PROCEDURE dbo.usp_Local_ThemNhanVien
    @MaNV VARCHAR(50),
    @HoTen NVARCHAR(120),
    @ChucVu NVARCHAR(80),
    @Email VARCHAR(100) = NULL,
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ChucVu)), '') IS NULL
        THROW 50000, N'Chức vụ không được để trống!', 1;

    IF EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV)
        THROW 50001, N'Mã nhân viên đã tồn tại!', 1;

    INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, Email, ChiNhanh)
    VALUES (@MaNV, @HoTen, @ChucVu, @Email, @ChiNhanh);

    SELECT TOP 1 * FROM dbo.NhanVien WHERE MaNV = @MaNV;
END;
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
CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaNhanVien
    @MaNV VARCHAR(50),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    -- Kiểm tra nhân viên có tồn tại và đang làm việc không
    DECLARE @TrangThaiHienTai BIT;
    SELECT @TrangThaiHienTai = TrangThai FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    IF @TrangThaiHienTai IS NULL
        THROW 50001, N'Không tìm thấy nhân viên để xóa!', 1;
        
    IF @TrangThaiHienTai = 0
        THROW 50002, N'Nhân viên này đã nghỉ việc từ trước!', 1;

    -- XÓA MỀM (Chuyển trạng thái = 0 thay vì DELETE)
    UPDATE dbo.NhanVien
    SET TrangThai = 0
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    SELECT CAST(1 AS BIT) AS deleted, @MaNV AS MaNV;
END;
GO


-- 1. Store Xem Danh Sách Hóa Đơn
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachHoaDon]
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;
    SELECT
        hd.MaHD,
        -- SỬA Ở ĐÂY: Thay vì tính tay SUM(SoLuong*DonGia), ta lấy trực tiếp từ 3 cột mới sinh ra của HoaDon
        hd.TongTienThanhToan AS TongTien, 
        hd.TongTienGoc,
        hd.TongSoTienGiam,
        COUNT(ctd.MaSP) AS SoMon,
        hd.GhiChu,
        hd.NgayTao,
        hd.ChiNhanh,
        hd.MaNV,
        MAX(nv.HoTen) AS HoTenNhanVien,
        hd.MaKH,
        MAX(kh.HoTen) AS HoTenKhachHang
    FROM dbo.HoaDon hd
    LEFT JOIN dbo.ChiTietHoaDon ctd ON ctd.MaHD = hd.MaHD
    LEFT JOIN dbo.NhanVien nv ON nv.MaNV = hd.MaNV
    LEFT JOIN dbo.KhachHang kh ON kh.MaKH = hd.MaKH
    WHERE hd.ChiNhanh = @CurrentDBBranch OR DB_NAME() LIKE 'Central%'
    GROUP BY hd.MaHD, hd.GhiChu, hd.NgayTao, hd.ChiNhanh, hd.MaNV, hd.MaKH, 
             hd.TongTienThanhToan, hd.TongTienGoc, hd.TongSoTienGiam -- Nhớ đưa 3 cột mới vào GROUP BY
    ORDER BY hd.NgayTao DESC;
END;
GO
-- 2. Store Xem Chi Tiết 1 Hóa Đơn
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_ChiTietHoaDon]
    @MaHD VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;
    -- TRẢ VỀ KẾT QUẢ 1: CÁC MÓN HÀNG TRONG HÓA ĐƠN (Như cũ)
    SELECT
        ctd.MaHD,
        ctd.MaSP,
        hh.TenHang,
        ctd.SoLuong,
        ctd.DonGia,
        CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2)) AS ThanhTien,
        hd.MaKH,
        kh.HoTen AS HoTenKhachHang
    FROM dbo.ChiTietHoaDon ctd
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = ctd.MaSP
    INNER JOIN dbo.HoaDon hd ON hd.MaHD = ctd.MaHD
    LEFT JOIN dbo.KhachHang kh ON kh.MaKH = hd.MaKH
    WHERE ctd.MaHD = @MaHD AND (hd.ChiNhanh = @CurrentDBBranch OR DB_NAME() LIKE 'Central%');
    -- TRẢ VỀ KẾT QUẢ 2: CÁC MÃ KHUYẾN MÃI ĐÃ ÁP DỤNG TRONG HÓA ĐƠN NÀY (Thêm mới)
    SELECT 
        kmhd.MaKM, 
        km.TenChuongTrinh, 
        kmhd.SoTienGiam
    FROM dbo.ChiTietKhuyenMaiHoaDon kmhd
    INNER JOIN dbo.KhuyenMai km ON kmhd.MaKM = km.MaKM
    WHERE kmhd.MaHD = @MaHD;
END;
GO







CREATE OR ALTER PROCEDURE [dbo].[usp_Local_TaoHoaDonNhieuDong]
    @MaHD VARCHAR(50),
    @MaNV VARCHAR(50),
    @MaKH VARCHAR(50) = NULL,
    @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @PromosJson NVARCHAR(MAX) = NULL,
    @DiemSuDung INT = 0  -- LƯU Ý: Thêm tham số đầu vào mới cho số điểm khách muốn tiêu
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;
    IF @ChiNhanhLap <> @CurrentDBBranch AND DB_NAME() NOT LIKE 'Central%' THROW 50000, N'Lỗi: Chi nhánh lập không khớp!', 1;
    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL THROW 50000, N'Mã hóa đơn rỗng!', 1;
    IF @DiemSuDung < 0 THROW 50000, N'Số điểm sử dụng không hợp lệ!', 1;
    -- BƯỚC 1: ĐỌC VÀ KIỂM TRA MẢNG HÀNG HÓA
    DECLARE @Items TABLE (MaSP VARCHAR(50) NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(15,2) NULL);
    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT LTRIM(RTRIM(MaSP)), SoLuong, DonGia FROM OPENJSON(@ItemsJson) WITH (MaSP VARCHAR(50) '$.MaSP', SoLuong INT '$.SoLuong', DonGia DECIMAL(15,2) '$.DonGia');
    IF NOT EXISTS (SELECT 1 FROM @Items) THROW 50002, N'Danh sách món hàng rỗng!', 1;
    IF EXISTS (SELECT 1 FROM @Items WHERE NULLIF(LTRIM(RTRIM(MaSP)), '') IS NULL OR SoLuong <= 0) THROW 50003, N'SoLuong phải > 0', 1;
    IF EXISTS (SELECT 1 FROM @Items i INNER JOIN dbo.HangHoa h ON h.MaSP = i.MaSP WHERE h.TrangThai = 0) 
        THROW 50006, N'Hóa đơn chứa sản phẩm bị Xóa mềm!', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- BƯỚC 2: KHÓA BẢNG KHÁCH HÀNG (CHỐNG DÀNH GIẬT/GIAN LẬN ĐIỂM)
        DECLARE @DiemHienCo INT = 0;
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            -- Nếu khách xài điểm, Khóa chặt dòng khách hàng này lại
            IF @DiemSuDung > 0 
            BEGIN
                SELECT @DiemHienCo = DiemTichLuy 
                FROM dbo.KhachHang WITH (UPDLOCK, HOLDLOCK) 
                WHERE MaKH = @MaKH;
                IF @DiemSuDung > @DiemHienCo
                    THROW 50009, N'Số điểm muốn dùng vượt quá số điểm khách đang có!', 1;
            END
        END
        ELSE
        BEGIN
            -- Nếu không có MaKH truyền vào nhưng lại đòi tiêu điểm -> Báo lỗi
            IF @DiemSuDung > 0 THROW 50010, N'Chỉ Khách hàng thành viên mới được dùng điểm!', 1;
        END
        -- BƯỚC 3: CHỐT ĐƠN GIÁ VÀ TỔNG TIỀN GỐC
        UPDATE i SET i.DonGia = COALESCE(NULLIF(i.DonGia, 0), h.Gia) FROM @Items i INNER JOIN dbo.HangHoa h ON i.MaSP = h.MaSP;
        DECLARE @TongTienGoc DECIMAL(15,2) = 0;
        SELECT @TongTienGoc = ISNULL(SUM(SoLuong * DonGia), 0) FROM @Items;
        -- BƯỚC 4: XỬ LÝ MẢNG KHUYẾN MÃI (VALIDATION CHUẨN SÀN)
        DECLARE @Promos TABLE (
            MaKM VARCHAR(20), LoaiKhuyenMai VARCHAR(20), PhanTramGiam DECIMAL(5,2), 
            SoTienGiamTrucTiep DECIMAL(15,2), GiamToiDa DECIMAL(15,2), ChoPhepCongDon BIT, SoTienGiam DECIMAL(15,2) DEFAULT 0
        );
        DECLARE @SoLuongMaKM INT = 0;
        IF @PromosJson IS NOT NULL AND LTRIM(RTRIM(@PromosJson)) <> ''
        BEGIN
            INSERT INTO @Promos (MaKM) SELECT LTRIM(RTRIM(MaKM)) FROM OPENJSON(@PromosJson) WITH (MaKM VARCHAR(20) '$.MaKM');
            SELECT @SoLuongMaKM = COUNT(*) FROM @Promos;
            -- UPDLOCK khóa bảng KM
            UPDATE p 
            SET p.LoaiKhuyenMai = k.LoaiKhuyenMai, p.PhanTramGiam = k.PhanTramGiam, 
                p.SoTienGiamTrucTiep = k.SoTienGiamTrucTiep, p.GiamToiDa = k.GiamToiDa, p.ChoPhepCongDon = k.ChoPhepCongDon
            FROM @Promos p
            INNER JOIN dbo.KhuyenMai k WITH (UPDLOCK, HOLDLOCK) ON p.MaKM = k.MaKM
            WHERE k.TrangThai = 1 
              AND GETDATE() BETWEEN k.NgayBatDau AND k.NgayKetThuc 
              AND @TongTienGoc >= k.DonHangToiThieu 
              AND (k.SoLuongGioiHan IS NULL OR k.SoLuongDaDung < k.SoLuongGioiHan); 
            IF EXISTS (SELECT 1 FROM @Promos WHERE LoaiKhuyenMai IS NULL) THROW 50007, N'Có mã KM không hợp lệ hoặc hết lượt!', 1;
            IF @SoLuongMaKM > 1 AND EXISTS (SELECT 1 FROM @Promos WHERE ChoPhepCongDon = 0) THROW 50008, N'Lỗi: Mã KM Độc Quyền!', 1;
            UPDATE @Promos
            SET SoTienGiam = CASE 
                WHEN LoaiKhuyenMai = 'PERCENTAGE' THEN 
                    CASE WHEN GiamToiDa IS NOT NULL AND (@TongTienGoc * PhanTramGiam / 100) > GiamToiDa THEN GiamToiDa ELSE (@TongTienGoc * PhanTramGiam / 100) END
                WHEN LoaiKhuyenMai = 'FIXED' THEN SoTienGiamTrucTiep ELSE 0 END;
        END
        -- BƯỚC 5: TÍNH TIỀN THANH TOÁN = TIỀN GỐC - (TIỀN KM + TIỀN TỪ ĐIỂM)
        DECLARE @TongSoTienGiam DECIMAL(15,2) = 0, @TongTienThanhToan DECIMAL(15,2) = 0;
        SELECT @TongSoTienGiam = ISNULL(SUM(SoTienGiam), 0) FROM @Promos;
        
        DECLARE @SoTienGiamTuDiem DECIMAL(15,2) = @DiemSuDung * 100; -- Tỷ giá: 1 Điểm = 100đ
        SET @TongTienThanhToan = @TongTienGoc - @TongSoTienGiam - @SoTienGiamTuDiem;
        -- Fix lỗi Tiền âm (Nếu điểm dùng trừ lố cả tiền đơn)
        IF @TongTienThanhToan < 0 
        BEGIN
            -- Chỉ trừ điểm vừa đủ để đơn hàng = 0đ. Phần dư trả lại.
            SET @SoTienGiamTuDiem = @SoTienGiamTuDiem + @TongTienThanhToan; -- @TongTienThanhToan đang mang dấu âm
            SET @DiemSuDung = CEILING(@SoTienGiamTuDiem / 100.0);
            SET @TongTienThanhToan = 0;
        END
        -- BƯỚC 6: CHỐNG DÀNH GIẬT TỒN KHO (UPDLOCK)
        ;WITH Agg AS (SELECT MaSP, SUM(SoLuong) AS SoLuong FROM @Items GROUP BY MaSP)
        SELECT 1 FROM Agg a
        LEFT JOIN dbo.TonKho tk WITH (UPDLOCK, HOLDLOCK) ON tk.MaSP = a.MaSP AND tk.ChiNhanh = @ChiNhanhLap
        WHERE ISNULL(tk.SoLuongTon, 0) < a.SoLuong;
        IF @@ROWCOUNT > 0 THROW 50005, N'Tồn kho không đủ!', 1;
        -- BƯỚC 7: LƯU VÀO DATABASE BẢNG HÓA ĐƠN
        INSERT INTO dbo.HoaDon (MaHD, MaNV, MaKH, GhiChu, NgayTao, ChiNhanh, TongTienGoc, TongSoTienGiam, TongTienThanhToan, DiemDaDung, SoTienGiamTuDiem)
        VALUES (@MaHD, @MaNV, @MaKH, @GhiChu, GETDATE(), @ChiNhanhLap, @TongTienGoc, @TongSoTienGiam, @TongTienThanhToan, @DiemSuDung, @SoTienGiamTuDiem);
        IF @SoLuongMaKM > 0
        BEGIN
            INSERT INTO dbo.ChiTietKhuyenMaiHoaDon (MaHD, MaKM, SoTienGiam) SELECT @MaHD, MaKM, SoTienGiam FROM @Promos;
            UPDATE k SET k.SoLuongDaDung = k.SoLuongDaDung + 1 FROM dbo.KhuyenMai k INNER JOIN @Promos p ON k.MaKM = p.MaKM;
        END
        INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia) SELECT @MaHD, MaSP, SoLuong, DonGia FROM @Items;
        -- BƯỚC 8: TRỪ TỒN KHO 
        UPDATE tk SET tk.SoLuongTon = tk.SoLuongTon - a.SoLuong
        FROM dbo.TonKho tk INNER JOIN (SELECT MaSP, SUM(SoLuong) AS SoLuong FROM @Items GROUP BY MaSP) a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @ChiNhanhLap;
        -- BƯỚC 9: XỬ LÝ ĐIỂM (TRỪ ĐIỂM ĐÃ TIÊU, CỘNG ĐIỂM ĐƠN MỚI)
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            -- A. Trừ điểm cũ khách đã tiêu
            IF @DiemSuDung > 0
            BEGIN
                UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE MaKH = @MaKH;
            END
            -- B. Cộng điểm mới dựa trên số tiền khách Thực Trả (10.000đ = 1đ)
            DECLARE @DiemCong INT = CAST(@TongTienThanhToan / 10000 AS INT); 
            IF @DiemCong > 0
            BEGIN
                UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy + @DiemCong WHERE MaKH = @MaKH;
            END
        END
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO







ALTER PROCEDURE [dbo].[usp_Local_DanhSachTonKho]
AS
BEGIN
    SET NOCOUNT ON;

    -- LOGIC MỚI: 
    -- 1. Nếu sản phẩm còn kinh doanh (TrangThai = 1) -> Hiển thị (dù tồn kho = 0)
    -- 2. Nếu sản phẩm đã ngừng kinh doanh (TrangThai = 0) 
    --    -> CHỈ hiển thị nếu kho vẫn còn tồn thật sự (SoLuongTon > 0) để nhân viên thanh lý/trả hàng.
    --    -> ẨN luôn nếu tồn kho đã hết (SoLuongTon = 0) để đỡ rác màn hình.
    
    SELECT t.MaSP, t.SoLuongTon
    FROM dbo.TonKho t
    INNER JOIN dbo.HangHoa h ON h.MaSP = t.MaSP
    WHERE t.ChiNhanh = 'HUE' 
      AND (h.TrangThai = 1 OR t.SoLuongTon > 0)
    ORDER BY t.MaSP;
END;
GO
EXEC dbo.usp_Local_DanhSachTonKho;
 GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_TonKhoTheoMaSP
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    SELECT TOP 1 MaSP, SoLuongTon
    FROM dbo.TonKho
    WHERE ChiNhanh = 'HUE' AND MaSP = @MaSP;
END;
GO
EXEC dbo.usp_Local_TonKhoTheoMaSP @MaSP = 'MI_GOI';
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




/* ===== KHUYẾN MÃI (CHỈ ĐỌC TỪ CENTRAL DB) ===== */
-- Lấy danh sách KM
CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhuyenMai
AS
BEGIN
    SET NOCOUNT ON;
    -- Lấy thêm các cột mới
    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc,
           LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, 
           SoLuongGioiHan, SoLuongDaDung, ChoPhepCongDon, TrangThai
    FROM dbo.KhuyenMai
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO
-- Lấy danh sách KM ĐANG CÓ HIỆU LỰC (Cho Thu ngân xem)
CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhuyenMaiHieuLuc
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc,
           LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, 
           SoLuongGioiHan, SoLuongDaDung, ChoPhepCongDon, TrangThai
    FROM dbo.KhuyenMai
    WHERE GETDATE() BETWEEN NgayBatDau AND NgayKetThuc
      AND TrangThai = 1  -- Đang bật
      AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan) -- Chưa xài hết
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Local_KiemTraKhuyenMai
    @MaKM VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        MaKM,
        TenChuongTrinh,
        LoaiKhuyenMai,
        PhanTramGiam,
        SoTienGiamTrucTiep,
        GiamToiDa,
        DonHangToiThieu,
        ChoPhepCongDon,
        -- Kểm tra toàn diện 3 điều kiện: Còn hạn + Đang bật + Còn lượt
        CASE
            WHEN GETDATE() BETWEEN NgayBatDau AND NgayKetThuc 
                 AND TrangThai = 1 
                 AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)
            THEN 1 
            ELSE 0
        END AS IsActive
    FROM dbo.KhuyenMai
    WHERE MaKM = @MaKM;
END;
GO


-- 1. LẤY DANH SÁCH & TÌM KIẾM KHÁCH HÀNG
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


CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachTaiKhoan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT tk.TenDangNhap, tk.MaNV, nv.HoTen, tk.Quyen, tk.TrangThai
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE nv.ChiNhanh = 'HUE'
    ORDER BY tk.TenDangNhap;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_ThemTaiKhoan
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @MaNV VARCHAR(50),
    @Quyen NVARCHAR(50),
    @TrangThai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = 'HUE')
        THROW 50001, N'Nhân viên không thuộc chi nhánh HUE!', 1;

    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
        THROW 50002, N'Tên đăng nhập đã tồn tại!', 1;

    INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
    VALUES (@TenDangNhap, @MatKhau, @MaNV, @Quyen, COALESCE(@TrangThai, 1));
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_CapNhatTaiKhoan
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255) = NULL,
    @Quyen NVARCHAR(50) = NULL,
    @TrangThai BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE tk
    SET MatKhau = COALESCE(NULLIF(LTRIM(RTRIM(@MatKhau)), ''), tk.MatKhau),
        Quyen = COALESCE(NULLIF(LTRIM(RTRIM(@Quyen)), ''), tk.Quyen),
        TrangThai = COALESCE(@TrangThai, tk.TrangThai)
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap
      AND nv.ChiNhanh = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để cập nhật!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_KhoaTaiKhoan
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;
    IF @Quyen IN (N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50003, N'Lỗi bảo mật: Không được thao tác khóa trên tài khoản Quản trị viên!', 1;

    UPDATE tk
    SET TrangThai = 0
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap
      AND nv.ChiNhanh = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để khóa!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_MoKhoaTaiKhoan
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Quyen NVARCHAR(50);
    SELECT @Quyen = Quyen FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap;
    IF @Quyen IN (N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')
        THROW 50003, N'Lỗi bảo mật: Không được thao tác mở khóa trên tài khoản Quản trị viên!', 1;

    UPDATE tk
    SET TrangThai = 1
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap
      AND nv.ChiNhanh = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để mở khóa!', 1;
END;
GO




CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachChiTietPhieuNhap
    @MaPN VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ctpn.MaPN, ctpn.MaSP, hh.TenHang, ctpn.SoLuong, ctpn.DonGiaNhap,
           CAST(ctpn.SoLuong * ctpn.DonGiaNhap AS DECIMAL(18,2)) AS ThanhTienNhap
    FROM dbo.ChiTietPhieuNhap ctpn
    INNER JOIN dbo.PhieuNhap pn ON pn.MaPN = ctpn.MaPN AND pn.ChiNhanh = 'HUE'
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = ctpn.MaSP
    WHERE ctpn.MaPN = @MaPN
    ORDER BY ctpn.MaSP;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachPhieuNhap
AS
BEGIN
    SET NOCOUNT ON;

    SELECT pn.MaPN, pn.NgayNhap, pn.ChiNhanh, pn.TongTien, pn.GhiChu, pn.MaNCC, ncc.TenNCC
    FROM dbo.PhieuNhap pn
    LEFT JOIN dbo.NhaCungCap ncc ON pn.MaNCC = ncc.MaNCC
    WHERE pn.ChiNhanh = 'HUE'
    ORDER BY pn.NgayNhap DESC, pn.MaPN DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_TaoPhieuNhapNhieuDong
    @MaPN VARCHAR(50),
    @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10),
    @MaNCC VARCHAR(50),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaPN)), '') IS NULL
        THROW 50000, N'Mã phiếu nhập không được để trống!', 1;

    IF EXISTS (SELECT 1 FROM dbo.PhieuNhap WHERE MaPN = @MaPN)
        THROW 50001, N'Mã phiếu nhập đã tồn tại!', 1;

    IF @MaNCC IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.NhaCungCap WHERE MaNCC = @MaNCC)
        THROW 50005, N'Mã nhà cung cấp không tồn tại!', 1;

    DECLARE @Items TABLE (
        MaSP VARCHAR(50),
        SoLuong INT,
        DonGiaNhap DECIMAL(10,2)
    );

    INSERT INTO @Items (MaSP, SoLuong, DonGiaNhap)
    SELECT MaSP, SoLuong, DonGiaNhap
    FROM OPENJSON(@ItemsJson)
    WITH (
        MaSP VARCHAR(50) '$.MaSP',
        SoLuong INT '$.SoLuong',
        DonGiaNhap DECIMAL(10,2) '$.DonGiaNhap'
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Thêm phiếu nhập
        INSERT INTO dbo.PhieuNhap (MaPN, ChiNhanh, GhiChu, TongTien, MaNCC)
        VALUES (@MaPN, 'HUE', @GhiChu, 0, @MaNCC);

        -- 2. Thêm chi tiết phiếu nhập
        INSERT INTO dbo.ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
        SELECT @MaPN, MaSP, SoLuong, DonGiaNhap
        FROM @Items;

        -- 3. Cập nhật lại tổng tiền
        DECLARE @TongTien DECIMAL(18,2);
        SELECT @TongTien = SUM(CAST(SoLuong * DonGiaNhap AS DECIMAL(18,2))) FROM @Items;
        UPDATE dbo.PhieuNhap SET TongTien = ISNULL(@TongTien, 0) WHERE MaPN = @MaPN;

        -- 4. Cập nhật tồn kho (NẾU ĐÃ CÓ)
        UPDATE t
        SET t.SoLuongTon = t.SoLuongTon + i.SoLuong
        FROM dbo.TonKho t
        JOIN @Items i ON i.MaSP = t.MaSP
        WHERE t.ChiNhanh = 'HUE';

        -- 5. NẾU CHƯA CÓ, INSERT
        INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh)
        SELECT i.MaSP, i.SoLuong, 'HUE'
        FROM @Items i
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.TonKho t 
            WHERE t.MaSP = i.MaSP AND t.ChiNhanh = 'HUE'
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO


CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardTongQuan]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(1) FROM dbo.NhanVien WHERE ChiNhanh = @ChiNhanh) AS employeeCount,
        (SELECT COUNT(1) FROM dbo.HoaDon WHERE ChiNhanh = @ChiNhanh) AS invoiceCount,
        (
            SELECT ISNULL(SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))), 0)
            FROM dbo.HoaDon hd
            INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
            WHERE hd.ChiNhanh = @ChiNhanh
        ) AS revenue,
        (SELECT ISNULL(SUM(SoLuongTon), 0) FROM dbo.TonKho WHERE ChiNhanh = @ChiNhanh) AS totalStockUnits,
        (
            SELECT ISNULL(SUM(CASE WHEN SoLuongTon < 50 THEN 1 ELSE 0 END), 0)
            FROM dbo.TonKho
            WHERE ChiNhanh = @ChiNhanh
        ) AS lowStockProducts;
END;
GO

/****** Object:  StoredProcedure [dbo].[usp_Local_DashboardDoanhThu7Ngay] ******/
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardDoanhThu7Ngay]
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Last7Days AS (
        SELECT CAST(DATEADD(DAY, v.n * -1, CAST(GETDATE() AS DATE)) AS DATE) AS Ngay
        FROM (VALUES (0), (1), (2), (3), (4), (5), (6)) v(n)
    )
    SELECT
        d.Ngay,
        ISNULL(SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))), 0) AS DoanhThu
    FROM Last7Days d
    LEFT JOIN dbo.HoaDon hd
      ON CAST(hd.NgayTao AS DATE) = d.Ngay
     AND hd.ChiNhanh = @ChiNhanh
    LEFT JOIN dbo.ChiTietHoaDon ct
      ON ct.MaHD = hd.MaHD
    GROUP BY d.Ngay
    ORDER BY d.Ngay;
END;
GO

/****** Object:  StoredProcedure [dbo].[usp_Local_DashboardTopTonKho] ******/
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DashboardTopTonKho]
    @ChiNhanh VARCHAR(10),
    @TopN INT = 8
AS
BEGIN
    SET NOCOUNT ON;

    IF @TopN IS NULL OR @TopN <= 0
        SET @TopN = 8;

    SELECT TOP (@TopN)
        tk.MaSP,
        hh.TenHang,
        tk.SoLuongTon
    FROM dbo.TonKho tk
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = tk.MaSP
    WHERE tk.ChiNhanh = @ChiNhanh
    ORDER BY tk.SoLuongTon DESC, tk.MaSP;
END;
GO
