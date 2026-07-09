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

CREATE OR ALTER PROCEDURE dbo.usp_Local_CapNhatNhanVien
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

    UPDATE dbo.NhanVien
    SET HoTen = COALESCE(NULLIF(LTRIM(RTRIM(@HoTen)), ''), HoTen),
        ChucVu = COALESCE(NULLIF(LTRIM(RTRIM(@ChucVu)), ''), ChucVu),
        Email = COALESCE(NULLIF(LTRIM(RTRIM(@Email)), ''), Email)
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy nhân viên để cập nhật!', 1;

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

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh)
        THROW 50001, N'Không tìm thấy nhân viên để xóa!', 1;

    DELETE FROM dbo.NhanVien
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    SELECT CAST(1 AS BIT) AS deleted, @MaNV AS MaNV;
END;
GO



CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachHoaDon
AS
BEGIN
    
    SET NOCOUNT ON;

  
    SELECT
        hd.MaHD,
        SUM(CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2))) AS TongTien,
        COUNT(ctd.MaSP) AS SoMon,
        hd.GhiChu,
        hd.NgayTao,
        hd.ChiNhanh,
        hd.MaNV,
        MAX(nv.HoTen) AS HoTenNhanVien
    FROM dbo.HoaDon hd

    LEFT JOIN dbo.ChiTietHoaDon ctd ON ctd.MaHD = hd.MaHD
    LEFT JOIN dbo.NhanVien nv ON nv.MaNV = hd.MaNV

    WHERE hd.ChiNhanh = 'HUE'

    GROUP BY hd.MaHD, hd.GhiChu, hd.NgayTao, hd.ChiNhanh, hd.MaNV

    ORDER BY hd.NgayTao DESC;
END;
GO
EXEC dbo.usp_Local_DanhSachHoaDon;
 GO

 SELECT * FROM dbo.HoaDon 
WHERE CAST(NgayTao AS DATE) = '2026-05-18';

go 

CREATE OR ALTER PROCEDURE dbo.usp_Local_ChiTietHoaDon
    @MaHD VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ctd.MaHD,
        ctd.MaSP,
        hh.TenHang,
        ctd.SoLuong,
        ctd.DonGia,
        CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2)) AS ThanhTien
    FROM dbo.ChiTietHoaDon ctd
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = ctd.MaSP
    INNER JOIN dbo.HoaDon hd ON hd.MaHD = ctd.MaHD
    WHERE ctd.MaHD = @MaHD
      AND hd.ChiNhanh = 'HUE';
END;
GO 
 EXEC dbo.usp_Local_ChiTietHoaDon @MaHD = 'HD_1779107573838';
 GO



CREATE OR ALTER PROCEDURE dbo.usp_Local_TaoHoaDonNhieuDong
    @MaHD VARCHAR(50),
    @MaNV VARCHAR(50),
    @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10),
    @ItemsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ChiNhanhLap <> 'HUE'
        THROW 50000, N'Procedure local chỉ cho phép @ChiNhanhLap = ''HUE''.', 1;

    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL
        THROW 50000, N'Mã hóa đơn không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@ItemsJson)), '') IS NULL
        THROW 50000, N'Danh sách món hàng không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = 'HUE')
        THROW 50001, N'Nhân viên không tồn tại ở chi nhánh HUE!', 1;

    DECLARE @Items TABLE (
        MaSP VARCHAR(50) NOT NULL,
        SoLuong INT NOT NULL,
        DonGia DECIMAL(10,2) NULL
    );

    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT
        LTRIM(RTRIM(MaSP)),
        SoLuong,
        DonGia
    FROM OPENJSON(@ItemsJson)
    WITH (
        MaSP VARCHAR(50) '$.MaSP',
        SoLuong INT '$.SoLuong',
        DonGia DECIMAL(10,2) '$.DonGia'
    );

    IF NOT EXISTS (SELECT 1 FROM @Items)
        THROW 50002, N'Danh sách món hàng rỗng hoặc sai định dạng JSON!', 1;

    IF EXISTS (
        SELECT 1 FROM @Items
        WHERE NULLIF(LTRIM(RTRIM(MaSP)), '') IS NULL OR SoLuong IS NULL OR SoLuong <= 0
    )
        THROW 50003, N'Mỗi dòng món phải có MaSP và SoLuong > 0!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
            FROM @Items
            GROUP BY MaSP
        )
        SELECT 1
        FROM Agg a
        LEFT JOIN dbo.HangHoa h ON h.MaSP = a.MaSP
        WHERE COALESCE(NULLIF(a.DonGia, 0), h.Gia, 0) <= 0;

        IF @@ROWCOUNT > 0
            THROW 50004, N'Không xác định được đơn giá cho một hoặc nhiều sản phẩm!', 1;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong
            FROM @Items
            GROUP BY MaSP
        )
        SELECT 1
        FROM Agg a
        LEFT JOIN dbo.TonKho t ON t.MaSP = a.MaSP AND t.ChiNhanh = 'HUE'
        WHERE t.SoLuongTon IS NULL OR t.SoLuongTon < a.SoLuong;

        IF @@ROWCOUNT > 0
            THROW 50005, N'Kho cục bộ không đủ số lượng cho một hoặc nhiều sản phẩm!', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.HoaDon WHERE MaHD = @MaHD)
            INSERT INTO dbo.HoaDon (MaHD, GhiChu, ChiNhanh, MaNV)
            VALUES (@MaHD, @GhiChu, 'HUE', @MaNV);

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong, MAX(DonGia) AS DonGia
            FROM @Items
            GROUP BY MaSP
        )
        INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia)
        SELECT
            @MaHD,
            a.MaSP,
            a.SoLuong,
            COALESCE(NULLIF(a.DonGia, 0), h.Gia)
        FROM Agg a
        JOIN dbo.HangHoa h ON h.MaSP = a.MaSP;

        ;WITH Agg AS (
            SELECT MaSP, SUM(SoLuong) AS SoLuong
            FROM @Items
            GROUP BY MaSP
        )
        UPDATE t
        SET t.SoLuongTon = t.SoLuongTon - a.SoLuong
        FROM dbo.TonKho t
        JOIN Agg a ON a.MaSP = t.MaSP
        WHERE t.ChiNhanh = 'HUE';
		
SELECT * FROM dbo.HoaDon WHERE MaHD = @MaHD;
SELECT * FROM dbo.ChiTietHoaDon WHERE MaHD = @MaHD;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

 EXEC dbo.usp_Local_TaoHoaDonNhieuDong 
     @MaHD = 'HD_taomoi999', 
     @MaNV = 'H004', 
     @GhiChu = N'Test tạo đơn hàng  ', 
     @ChiNhanhLap = 'HUE', 
     @ItemsJson = N'[
         {"MaSP": "MI_GOI", "SoLuong": 3}, 
         {"MaSP": "NUOC_SUOI", "SoLuong": 3 },
		 {"MaSP": "SUA_HOP", "SoLuong": 4 }
     ]';
GO 
SELECT * FROM dbo.HoaDon WHERE MaHD = 'HD_Taomoi999';
SELECT * FROM dbo.ChiTietHoaDon WHERE MaHD = 'HD_Taomoi999';


go 

CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachTonKho
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaSP, SoLuongTon
    FROM dbo.TonKho
    WHERE ChiNhanh = 'HUE'
    ORDER BY MaSP;
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

EXEC dbo.usp_Chung_HangHoaTheoMaSP @MaSP = 'MI_GOI';
 GO



 CREATE OR ALTER PROCEDURE dbo.usp_Local_CapNhatTonKhoTongQuat
    @MaSP VARCHAR(50),
    @SoLuongTonMoi INT,
    @ChiNhanhLap VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ChiNhanhLap <> 'HUE'
        THROW 50000, N'Procedure local chỉ cho phép @ChiNhanhLap = ''HUE''.', 1;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @SoLuongTonMoi < 0
        THROW 50000, N'Số lượng tồn mới phải >= 0!', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.TonKho
        WHERE MaSP = @MaSP AND ChiNhanh = 'HUE'
    )
        THROW 50001, N'Sản phẩm không tồn tại trong kho của chi nhánh này!', 1;

    UPDATE dbo.TonKho
    SET SoLuongTon = @SoLuongTonMoi
    WHERE MaSP = @MaSP AND ChiNhanh = 'HUE';

    SELECT TOP 1 MaSP, SoLuongTon
    FROM dbo.TonKho
    WHERE MaSP = @MaSP AND ChiNhanh = 'HUE';
END;
GO

SELECT MaSP, SoLuongTon AS TonKho_Cu 
FROM dbo.TonKho 
WHERE MaSP = 'MI_GOI' AND ChiNhanh = 'HUE';


EXEC dbo.usp_Local_CapNhatTonKhoTongQuat 
    @MaSP = 'MI_GOI', 
    @SoLuongTonMoi = 150, 
    @ChiNhanhLap = 'HUE';


SELECT MaSP, SoLuongTon AS TonKho_Moi 
FROM dbo.TonKho 
WHERE MaSP = 'MI_GOI' AND ChiNhanh = 'HUE';
GO

/* ===== KHUYẾN MÃI (CHỈ ĐỌC TỪ CENTRAL DB) ===== */
CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhuyenMai
AS 

BEGIN
    SET NOCOUNT ON;

    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc
    FROM dbo.KhuyenMai
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhuyenMaiHieuLuc
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc
    FROM dbo.KhuyenMai
    WHERE GETDATE() BETWEEN NgayBatDau AND NgayKetThuc
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
        PhanTramGiam,
        CASE
            WHEN GETDATE() BETWEEN NgayBatDau AND NgayKetThuc THEN 1
            ELSE 0
        END AS IsActive
    FROM dbo.KhuyenMai
    WHERE MaKM = @MaKM;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhachHang
AS
BEGIN
    SET NOCOUNT ON;
    SELECT MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK
    FROM dbo.KhachHang
    WHERE ChiNhanhDK = 'HUE'
    ORDER BY MaKH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_ThemKhachHang
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15) = NULL,
    @DiemTichLuy INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NULL
        THROW 50000, N'Mã khách hàng không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên khách hàng không được để trống!', 1;

    IF @DiemTichLuy < 0
        THROW 50000, N'Điểm tích lũy phải >= 0!', 1;

    IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        THROW 50001, N'Mã khách hàng đã tồn tại!', 1;

    INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK)
    VALUES (@MaKH, @HoTen, @SoDienThoai, @DiemTichLuy, 'HUE');
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_CapNhatKhachHang
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120) = NULL,
    @SoDienThoai VARCHAR(15) = NULL,
    @DiemTichLuy INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.KhachHang
    SET HoTen = COALESCE(NULLIF(LTRIM(RTRIM(@HoTen)), ''), HoTen),
        SoDienThoai = COALESCE(NULLIF(LTRIM(RTRIM(@SoDienThoai)), ''), SoDienThoai),
        DiemTichLuy = COALESCE(@DiemTichLuy, DiemTichLuy)
    WHERE MaKH = @MaKH AND ChiNhanhDK = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy khách hàng để cập nhật!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaKhachHang
    @MaKH VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.KhachHang
    WHERE MaKH = @MaKH AND ChiNhanhDK = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy khách hàng để xóa!', 1;
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
CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaTaiKhoan
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DELETE tk
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap
      AND nv.ChiNhanh = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy tài khoản để xóa!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachPhieuNhap
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaPN, NgayNhap, ChiNhanh, TongTien, GhiChu
    FROM dbo.PhieuNhap
    WHERE ChiNhanh = 'HUE'
    ORDER BY NgayNhap DESC, MaPN DESC;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_TaoPhieuNhap
    @MaPN VARCHAR(50),
    @GhiChu NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.PhieuNhap WHERE MaPN = @MaPN)
        THROW 50001, N'Mã phiếu nhập đã tồn tại!', 1;

    INSERT INTO dbo.PhieuNhap (MaPN, ChiNhanh, GhiChu, TongTien)
    VALUES (@MaPN, 'HUE', @GhiChu, 0);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_CapNhatPhieuNhap
    @MaPN VARCHAR(50),
    @GhiChu NVARCHAR(255) = NULL,
    @TongTien DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.PhieuNhap
    SET GhiChu = COALESCE(NULLIF(LTRIM(RTRIM(@GhiChu)), ''), GhiChu),
        TongTien = COALESCE(@TongTien, TongTien)
    WHERE MaPN = @MaPN AND ChiNhanh = 'HUE';

    IF @@ROWCOUNT = 0
        THROW 50001, N'Không tìm thấy phiếu nhập để cập nhật!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaPhieuNhap
    @MaPN VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM dbo.ChiTietPhieuNhap WHERE MaPN = @MaPN;
        DELETE FROM dbo.PhieuNhap WHERE MaPN = @MaPN AND ChiNhanh = 'HUE';

        IF @@ROWCOUNT = 0
            THROW 50001, N'Không tìm thấy phiếu nhập để xóa!', 1;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
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

CREATE OR ALTER PROCEDURE dbo.usp_Local_ThemChiTietPhieuNhap
    @MaPN VARCHAR(50),
    @MaSP VARCHAR(50),
    @SoLuong INT,
    @DonGiaNhap DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuNhap WHERE MaPN = @MaPN AND ChiNhanh = 'HUE')
        THROW 50001, N'Phiếu nhập không thuộc chi nhánh HUE!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50002, N'Sản phẩm không tồn tại!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
        VALUES (@MaPN, @MaSP, @SoLuong, @DonGiaNhap);

        UPDATE dbo.PhieuNhap
        SET TongTien = TongTien + CAST(@SoLuong * @DonGiaNhap AS DECIMAL(18,2))
        WHERE MaPN = @MaPN;

        UPDATE dbo.TonKho
        SET SoLuongTon = SoLuongTon + @SoLuong
        WHERE MaSP = @MaSP AND ChiNhanh = 'HUE';

        IF @@ROWCOUNT = 0
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh)
            VALUES (@MaSP, @SoLuong, 'HUE');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaChiTietPhieuNhap
    @MaPN VARCHAR(50),
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @SoLuong INT, @DonGiaNhap DECIMAL(10,2);

        SELECT @SoLuong = SoLuong, @DonGiaNhap = DonGiaNhap
        FROM dbo.ChiTietPhieuNhap
        WHERE MaPN = @MaPN AND MaSP = @MaSP;

        IF @SoLuong IS NULL
            THROW 50001, N'Không tìm thấy chi tiết phiếu nhập để xóa!', 1;

        DELETE FROM dbo.ChiTietPhieuNhap WHERE MaPN = @MaPN AND MaSP = @MaSP;

        UPDATE dbo.PhieuNhap
        SET TongTien = CASE WHEN TongTien - CAST(@SoLuong * @DonGiaNhap AS DECIMAL(18,2)) < 0 THEN 0 ELSE TongTien - CAST(@SoLuong * @DonGiaNhap AS DECIMAL(18,2)) END
        WHERE MaPN = @MaPN;

        UPDATE dbo.TonKho
        SET SoLuongTon = SoLuongTon - @SoLuong
        WHERE MaSP = @MaSP AND ChiNhanh = 'HUE';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO



CREATE OR ALTER PROCEDURE dbo.usp_Local_DashboardTongQuan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(1) FROM dbo.NhanVien WHERE ChiNhanh = 'HUE') AS employeeCount,
        (SELECT COUNT(1) FROM dbo.HoaDon WHERE ChiNhanh = 'HUE') AS invoiceCount,
        (
            SELECT ISNULL(SUM(CAST(ct.SoLuong * ct.DonGia AS DECIMAL(18,2))), 0)
            FROM dbo.HoaDon hd
            INNER JOIN dbo.ChiTietHoaDon ct ON ct.MaHD = hd.MaHD
            WHERE hd.ChiNhanh = 'HUE'
        ) AS revenue,
        (SELECT ISNULL(SUM(SoLuongTon), 0) FROM dbo.TonKho WHERE ChiNhanh = 'HUE') AS totalStockUnits,
        (
            SELECT ISNULL(SUM(CASE WHEN SoLuongTon < 50 THEN 1 ELSE 0 END), 0)
            FROM dbo.TonKho
            WHERE ChiNhanh = 'HUE'
        ) AS lowStockProducts;
END;
GO 
-- Xem tổng nhân viên, tổng hóa đơn, tổng doanh thu và hàng sắp hết (dưới 50)
EXEC dbo.usp_Local_DashboardTongQuan;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DashboardDoanhThu7Ngay
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
     AND hd.ChiNhanh = 'HUE'
    LEFT JOIN dbo.ChiTietHoaDon ct
      ON ct.MaHD = hd.MaHD
    GROUP BY d.Ngay
    ORDER BY d.Ngay;
END;
GO 
EXEC dbo.usp_Local_DashboardDoanhThu7Ngay;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Local_DashboardTopTonKho
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
    WHERE tk.ChiNhanh = 'HUE'
    ORDER BY tk.SoLuongTon DESC, tk.MaSP;
END;
GO

EXEC dbo.usp_Local_DashboardTopTonKho;
GO
-- Truyền tham số tùy chỉnh để xem đúng 3 món
EXEC dbo.usp_Local_DashboardTopTonKho @TopN = 3;
GO
