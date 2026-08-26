-- =========================================================================
-- SCRIPT CẬP NHẬT DATABASE (TÍCH ĐIỂM & KHUYẾN MÃI) - NGÀY 26/08/2026
-- HƯỚNG DẪN: 
-- - Chạy PHẦN 1, PHẦN 2, PHẦN 3 trên TẤT CẢ SERVER (Central, HN, SG, Huế).
-- - Chạy PHẦN 4 CHỈ TRÊN CENTRAL.
-- - Chạy PHẦN 5 CHỈ TRÊN CÁC SERVER CHI NHÁNH (Local).
-- =========================================================================

-- =========================================================================
-- PHẦN 1: CẤU TRÚC BẢNG (DDL)
-- CHẠY TRÊN CENTRAL (NẾU BẬT DDL REPLICATION) HOẶC CHẠY TAY TRÊN CẢ 4 SERVER
-- =========================================================================

-- Bảng trung gian để 1 đơn được xài nhiều mã
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChiTietKhuyenMaiHoaDon')
BEGIN
    CREATE TABLE dbo.ChiTietKhuyenMaiHoaDon(
        MaHD VARCHAR(50) NOT NULL, MaKM VARCHAR(20) NOT NULL, SoTienGiam DECIMAL(15,2) NOT NULL DEFAULT 0,
        CONSTRAINT PK_ChiTietKhuyenMaiHoaDon PRIMARY KEY (MaHD, MaKM),
        CONSTRAINT FK_ChiTietKhuyenMaiHoaDon_HoaDon FOREIGN KEY (MaHD) REFERENCES dbo.HoaDon(MaHD),
        CONSTRAINT FK_ChiTietKhuyenMaiHoaDon_KhuyenMai FOREIGN KEY (MaKM) REFERENCES dbo.KhuyenMai(MaKM)
    )
END
GO

-- Cập nhật bảng Hóa Đơn
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HoaDon') AND name = 'TongTienGoc')
BEGIN
    ALTER TABLE dbo.HoaDon ADD TongTienGoc DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD TongSoTienGiam DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD TongTienThanhToan DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD DiemDaDung INT NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD SoTienGiamTuDiem DECIMAL(15,2) NOT NULL DEFAULT 0;
END
GO

-- Nâng cấp Khuyến Mãi lên chuẩn Sàn TMĐT
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.KhuyenMai') AND name = 'LoaiKhuyenMai')
BEGIN
    ALTER TABLE dbo.KhuyenMai ADD LoaiKhuyenMai VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE';
    ALTER TABLE dbo.KhuyenMai ADD SoTienGiamTrucTiep DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.KhuyenMai ADD GiamToiDa DECIMAL(15,2) NULL; 
    ALTER TABLE dbo.KhuyenMai ADD DonHangToiThieu DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.KhuyenMai ADD SoLuongGioiHan INT NULL; 
    ALTER TABLE dbo.KhuyenMai ADD SoLuongDaDung INT NOT NULL DEFAULT 0;
    ALTER TABLE dbo.KhuyenMai ADD ChoPhepCongDon BIT NOT NULL DEFAULT 1;
    ALTER TABLE dbo.KhuyenMai ADD TrangThai BIT NOT NULL DEFAULT 1;
END
GO

-- =========================================================================
-- PHẦN 2: DATA MIGRATION (HỒI TỐ DỮ LIỆU CŨ)
-- CHẠY TRÊN TẤT CẢ CÁC SERVER (ĐỂ TRÁNH LỖI BÁO CÁO DOANH THU = 0)
-- =========================================================================
UPDATE hd
SET 
    hd.TongTienGoc = a.TongTien,
    hd.TongTienThanhToan = a.TongTien,
    hd.TongSoTienGiam = 0,
    hd.DiemDaDung = 0,
    hd.SoTienGiamTuDiem = 0
FROM dbo.HoaDon hd
INNER JOIN (
    SELECT MaHD, SUM(SoLuong * DonGia) AS TongTien
    FROM dbo.ChiTietHoaDon
    GROUP BY MaHD
) a ON hd.MaHD = a.MaHD
WHERE hd.TongTienThanhToan = 0; -- Chỉ update những hóa đơn cũ chưa có tính tiền gốc
GO


-- =========================================================================
-- PHẦN 3: STORE XEM DANH SÁCH (CHẠY ĐƯỢC TRÊN TẤT CẢ SERVER)
-- =========================================================================

-- Lấy danh sách KM
CREATE OR ALTER PROCEDURE dbo.usp_Local_DanhSachKhuyenMai
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
      AND TrangThai = 1
      AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan)
    ORDER BY NgayBatDau DESC, MaKM;
END;
GO

-- Store Xem Danh Sách Hóa Đơn
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_DanhSachHoaDon]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;

    SELECT
        hd.MaHD,
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
             hd.TongTienThanhToan, hd.TongTienGoc, hd.TongSoTienGiam
    ORDER BY hd.NgayTao DESC;
END;
GO

-- Store Xem Chi Tiết 1 Hóa Đơn
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_ChiTietHoaDon]
    @MaHD VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;

    -- 1. CÁC MÓN HÀNG TRONG HÓA ĐƠN
    SELECT
        ctd.MaHD, ctd.MaSP, hh.TenHang, ctd.SoLuong, ctd.DonGia,
        CAST(ctd.SoLuong * ctd.DonGia AS DECIMAL(18,2)) AS ThanhTien,
        hd.MaKH, kh.HoTen AS HoTenKhachHang
    FROM dbo.ChiTietHoaDon ctd
    LEFT JOIN dbo.HangHoa hh ON hh.MaSP = ctd.MaSP
    INNER JOIN dbo.HoaDon hd ON hd.MaHD = ctd.MaHD
    LEFT JOIN dbo.KhachHang kh ON kh.MaKH = hd.MaKH
    WHERE ctd.MaHD = @MaHD AND (hd.ChiNhanh = @CurrentDBBranch OR DB_NAME() LIKE 'Central%');

    -- 2. CÁC MÃ KHUYẾN MÃI ĐÃ ÁP DỤNG TRONG HÓA ĐƠN NÀY
    SELECT kmhd.MaKM, km.TenChuongTrinh, kmhd.SoTienGiam
    FROM dbo.ChiTietKhuyenMaiHoaDon kmhd
    INNER JOIN dbo.KhuyenMai km ON kmhd.MaKM = km.MaKM
    WHERE kmhd.MaHD = @MaHD;
END;
GO

-- =========================================================================
-- PHẦN 4: CHỈ CHẠY TRÊN CENTRAL (QUẢN LÝ CRUD KHUYẾN MÃI)
-- =========================================================================

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

CREATE OR ALTER PROCEDURE dbo.usp_Central_ThemKhuyenMai
    @MaKM VARCHAR(50), @TenChuongTrinh NVARCHAR(150), @PhanTramGiam INT,
    @NgayBatDau DATETIME2, @NgayKetThuc DATETIME2, @LoaiKhuyenMai VARCHAR(20) = 'PERCENTAGE',
    @SoTienGiamTrucTiep DECIMAL(15,2) = 0, @GiamToiDa DECIMAL(15,2) = NULL,
    @DonHangToiThieu DECIMAL(15,2) = 0, @SoLuongGioiHan INT = NULL,
    @ChoPhepCongDon BIT = 1, @TrangThai BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF NULLIF(LTRIM(RTRIM(@MaKM)), '') IS NULL THROW 50000, N'Mã khuyến mãi không được để trống!', 1;
    IF NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), '') IS NULL THROW 50000, N'Tên chương trình không được để trống!', 1;
    IF @PhanTramGiam < 0 OR @PhanTramGiam > 100 THROW 50000, N'Phần trăm giảm phải từ 0 đến 100!', 1;
    IF @NgayKetThuc < @NgayBatDau THROW 50000, N'Ngày kết thúc phải >= ngày bắt đầu!', 1;
    IF EXISTS (SELECT 1 FROM dbo.KhuyenMai WHERE MaKM = @MaKM) THROW 50001, N'Mã khuyến mãi đã tồn tại!', 1;

    INSERT INTO dbo.KhuyenMai (MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc, LoaiKhuyenMai, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, SoLuongGioiHan, ChoPhepCongDon, TrangThai)
    VALUES (@MaKM, @TenChuongTrinh, @PhanTramGiam, @NgayBatDau, @NgayKetThuc, @LoaiKhuyenMai, @SoTienGiamTrucTiep, @GiamToiDa, @DonHangToiThieu, @SoLuongGioiHan, @ChoPhepCongDon, @TrangThai);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_CapNhatKhuyenMai
    @MaKM VARCHAR(50), @TenChuongTrinh NVARCHAR(150) = NULL, @PhanTramGiam INT = NULL,
    @NgayBatDau DATETIME2 = NULL, @NgayKetThuc DATETIME2 = NULL, @LoaiKhuyenMai VARCHAR(20) = NULL,
    @SoTienGiamTrucTiep DECIMAL(15,2) = NULL, @GiamToiDa DECIMAL(15,2) = NULL,
    @DonHangToiThieu DECIMAL(15,2) = NULL, @SoLuongGioiHan INT = NULL,
    @ChoPhepCongDon BIT = NULL, @TrangThai BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.KhuyenMai
    SET TenChuongTrinh = COALESCE(NULLIF(LTRIM(RTRIM(@TenChuongTrinh)), ''), TenChuongTrinh),
        PhanTramGiam = COALESCE(@PhanTramGiam, PhanTramGiam), NgayBatDau = COALESCE(@NgayBatDau, NgayBatDau),
        NgayKetThuc = COALESCE(@NgayKetThuc, NgayKetThuc), LoaiKhuyenMai = COALESCE(@LoaiKhuyenMai, LoaiKhuyenMai),
        SoTienGiamTrucTiep = COALESCE(@SoTienGiamTrucTiep, SoTienGiamTrucTiep), GiamToiDa = COALESCE(@GiamToiDa, GiamToiDa),
        DonHangToiThieu = COALESCE(@DonHangToiThieu, DonHangToiThieu), SoLuongGioiHan = COALESCE(@SoLuongGioiHan, SoLuongGioiHan),
        ChoPhepCongDon = COALESCE(@ChoPhepCongDon, ChoPhepCongDon), TrangThai = COALESCE(@TrangThai, TrangThai)
    WHERE MaKM = @MaKM;

    IF @@ROWCOUNT = 0 THROW 50001, N'Không tìm thấy khuyến mãi để cập nhật!', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Central_XoaKhuyenMai
    @MaKM VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.KhuyenMai SET TrangThai = 0 WHERE MaKM = @MaKM;
    IF @@ROWCOUNT = 0 THROW 50001, N'Không tìm thấy khuyến mãi để xóa!', 1;
END;
GO

-- =========================================================================
-- PHẦN 5: CHỈ CHẠY TRÊN LOCAL SERVER CHI NHÁNH (HN, SG, HUE)
-- =========================================================================

CREATE OR ALTER PROCEDURE dbo.usp_Local_KiemTraKhuyenMai
    @MaKM VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        MaKM, TenChuongTrinh, LoaiKhuyenMai, PhanTramGiam, SoTienGiamTrucTiep, GiamToiDa, DonHangToiThieu, ChoPhepCongDon,
        CASE
            WHEN GETDATE() BETWEEN NgayBatDau AND NgayKetThuc AND TrangThai = 1 AND (SoLuongGioiHan IS NULL OR SoLuongDaDung < SoLuongGioiHan) THEN 1 
            ELSE 0
        END AS IsActive
    FROM dbo.KhuyenMai
    WHERE MaKM = @MaKM;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Local_TaoHoaDonNhieuDong]
    @MaHD VARCHAR(50), @MaNV VARCHAR(50), @MaKH VARCHAR(50) = NULL, @GhiChu NVARCHAR(255),
    @ChiNhanhLap VARCHAR(10), @ItemsJson NVARCHAR(MAX), @PromosJson NVARCHAR(MAX) = NULL, @DiemSuDung INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CurrentDBBranch VARCHAR(10) = CASE DB_NAME() 
        WHEN 'Store_SG' THEN 'SAIGON' WHEN 'Store_HN' THEN 'HANOI' WHEN 'Store_H' THEN 'HUE' ELSE DB_NAME() END;

    IF @ChiNhanhLap <> @CurrentDBBranch AND DB_NAME() NOT LIKE 'Central%' THROW 50000, N'Lỗi: Chi nhánh lập không khớp!', 1;
    IF NULLIF(LTRIM(RTRIM(@MaHD)), '') IS NULL THROW 50000, N'Mã hóa đơn rỗng!', 1;
    IF @DiemSuDung < 0 THROW 50000, N'Số điểm sử dụng không hợp lệ!', 1;

    -- BƯỚC 1: ĐỌC MẢNG HÀNG HÓA
    DECLARE @Items TABLE (MaSP VARCHAR(50) NOT NULL, SoLuong INT NOT NULL, DonGia DECIMAL(15,2) NULL);
    INSERT INTO @Items (MaSP, SoLuong, DonGia)
    SELECT LTRIM(RTRIM(MaSP)), SoLuong, DonGia FROM OPENJSON(@ItemsJson) WITH (MaSP VARCHAR(50) '$.MaSP', SoLuong INT '$.SoLuong', DonGia DECIMAL(15,2) '$.DonGia');

    IF NOT EXISTS (SELECT 1 FROM @Items) THROW 50002, N'Danh sách món hàng rỗng!', 1;
    IF EXISTS (SELECT 1 FROM @Items WHERE NULLIF(LTRIM(RTRIM(MaSP)), '') IS NULL OR SoLuong <= 0) THROW 50003, N'SoLuong phải > 0', 1;
    IF EXISTS (SELECT 1 FROM @Items i INNER JOIN dbo.HangHoa h ON h.MaSP = i.MaSP WHERE h.TrangThai = 0) 
        THROW 50006, N'Hóa đơn chứa sản phẩm bị Xóa mềm!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- BƯỚC 2: KHÓA BẢNG KHÁCH HÀNG
        DECLARE @DiemHienCo INT = 0;
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            IF @DiemSuDung > 0 
            BEGIN
                SELECT @DiemHienCo = DiemTichLuy FROM dbo.KhachHang WITH (UPDLOCK, HOLDLOCK) WHERE MaKH = @MaKH;
                IF @DiemSuDung > @DiemHienCo THROW 50009, N'Số điểm muốn dùng vượt quá số điểm khách đang có!', 1;
            END
        END
        ELSE
        BEGIN
            IF @DiemSuDung > 0 THROW 50010, N'Chỉ Khách hàng thành viên mới được dùng điểm!', 1;
        END

        -- BƯỚC 3: TÍNH TỔNG TIỀN GỐC
        UPDATE i SET i.DonGia = COALESCE(NULLIF(i.DonGia, 0), h.Gia) FROM @Items i INNER JOIN dbo.HangHoa h ON i.MaSP = h.MaSP;
        DECLARE @TongTienGoc DECIMAL(15,2) = 0;
        SELECT @TongTienGoc = ISNULL(SUM(SoLuong * DonGia), 0) FROM @Items;

        -- BƯỚC 4: XỬ LÝ MẢNG KHUYẾN MÃI
        DECLARE @Promos TABLE (
            MaKM VARCHAR(20), LoaiKhuyenMai VARCHAR(20), PhanTramGiam DECIMAL(5,2), 
            SoTienGiamTrucTiep DECIMAL(15,2), GiamToiDa DECIMAL(15,2), ChoPhepCongDon BIT, SoTienGiam DECIMAL(15,2) DEFAULT 0
        );
        DECLARE @SoLuongMaKM INT = 0;

        IF @PromosJson IS NOT NULL AND LTRIM(RTRIM(@PromosJson)) <> ''
        BEGIN
            INSERT INTO @Promos (MaKM) SELECT LTRIM(RTRIM(MaKM)) FROM OPENJSON(@PromosJson) WITH (MaKM VARCHAR(20) '$.MaKM');
            SELECT @SoLuongMaKM = COUNT(*) FROM @Promos;

            -- Khóa bảng KM bằng UPDLOCK
            UPDATE p 
            SET p.LoaiKhuyenMai = k.LoaiKhuyenMai, p.PhanTramGiam = k.PhanTramGiam, 
                p.SoTienGiamTrucTiep = k.SoTienGiamTrucTiep, p.GiamToiDa = k.GiamToiDa, p.ChoPhepCongDon = k.ChoPhepCongDon
            FROM @Promos p
            INNER JOIN dbo.KhuyenMai k WITH (UPDLOCK, HOLDLOCK) ON p.MaKM = k.MaKM
            WHERE k.TrangThai = 1 AND GETDATE() BETWEEN k.NgayBatDau AND k.NgayKetThuc 
              AND @TongTienGoc >= k.DonHangToiThieu AND (k.SoLuongGioiHan IS NULL OR k.SoLuongDaDung < k.SoLuongGioiHan); 

            IF EXISTS (SELECT 1 FROM @Promos WHERE LoaiKhuyenMai IS NULL) THROW 50007, N'Có mã KM không hợp lệ hoặc hết lượt!', 1;
            IF @SoLuongMaKM > 1 AND EXISTS (SELECT 1 FROM @Promos WHERE ChoPhepCongDon = 0) THROW 50008, N'Lỗi: Mã KM Độc Quyền!', 1;

            UPDATE @Promos
            SET SoTienGiam = CASE 
                WHEN LoaiKhuyenMai = 'PERCENTAGE' THEN 
                    CASE WHEN GiamToiDa IS NOT NULL AND (@TongTienGoc * PhanTramGiam / 100) > GiamToiDa THEN GiamToiDa ELSE (@TongTienGoc * PhanTramGiam / 100) END
                WHEN LoaiKhuyenMai = 'FIXED' THEN SoTienGiamTrucTiep ELSE 0 END;
        END

        -- BƯỚC 5: TÍNH TIỀN THANH TOÁN
        DECLARE @TongSoTienGiam DECIMAL(15,2) = 0, @TongTienThanhToan DECIMAL(15,2) = 0;
        SELECT @TongSoTienGiam = ISNULL(SUM(SoTienGiam), 0) FROM @Promos;
        DECLARE @SoTienGiamTuDiem DECIMAL(15,2) = @DiemSuDung * 100;

        SET @TongTienThanhToan = @TongTienGoc - @TongSoTienGiam - @SoTienGiamTuDiem;
        IF @TongTienThanhToan < 0 
        BEGIN
            SET @SoTienGiamTuDiem = @SoTienGiamTuDiem + @TongTienThanhToan; 
            SET @DiemSuDung = CEILING(@SoTienGiamTuDiem / 100.0);
            SET @TongTienThanhToan = 0;
        END

        -- BƯỚC 6: CHỐNG DÀNH GIẬT TỒN KHO
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

        -- BƯỚC 9: XỬ LÝ ĐIỂM
        IF @MaKH IS NOT NULL AND NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL
        BEGIN
            IF @DiemSuDung > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy - @DiemSuDung WHERE MaKH = @MaKH;
            DECLARE @DiemCong INT = CAST(@TongTienThanhToan / 10000 AS INT); 
            IF @DiemCong > 0 UPDATE dbo.KhachHang SET DiemTichLuy = DiemTichLuy + @DiemCong WHERE MaKH = @MaKH;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
