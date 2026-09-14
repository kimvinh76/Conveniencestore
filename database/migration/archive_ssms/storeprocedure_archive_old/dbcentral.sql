USE CentralDB;
GO

IF OBJECT_ID('dbo.ChiTietHoaDon', 'U') IS NOT NULL DROP TABLE dbo.ChiTietHoaDon;
IF OBJECT_ID('dbo.TonKho', 'U') IS NOT NULL DROP TABLE dbo.TonKho;
IF OBJECT_ID('dbo.HoaDon', 'U') IS NOT NULL DROP TABLE dbo.HoaDon;
IF OBJECT_ID('dbo.NhanVien', 'U') IS NOT NULL DROP TABLE dbo.NhanVien;
IF OBJECT_ID('dbo.HangHoa', 'U') IS NOT NULL DROP TABLE dbo.HangHoa;
IF OBJECT_ID('dbo.ChiNhanh', 'U') IS NOT NULL DROP TABLE dbo.ChiNhanh;
GO

CREATE TABLE dbo.ChiNhanh (
    MaChiNhanh VARCHAR(10) NOT NULL PRIMARY KEY,
    TenChiNhanh NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(200) NULL,
    TrangThai BIT NOT NULL DEFAULT 1
);

INSERT INTO dbo.ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, TrangThai)
VALUES
('HUE', N'Chi nhanh Hue', N'Hue', 1),
('SAIGON', N'Chi nhanh Sai Gon', N'TP HCM', 1),
('HANOI', N'Chi nhanh Ha Noi', N'Ha Noi', 1),
('CENTRAL', N'Tong cong ty', N'Head Office', 1);

CREATE TABLE dbo.NhanVien (
    MaNV VARCHAR(50) NOT NULL PRIMARY KEY,
    HoTen NVARCHAR(120) NOT NULL,
    ChucVu NVARCHAR(80) NOT NULL,
	   Email VARCHAR(100) NULL,
    ChiNhanh VARCHAR(10) NOT NULL,
    TrangThai BIT NOT NULL CONSTRAINT DF_NhanVien_TrangThai DEFAULT 1,
    CONSTRAINT FK_NhanVien_C_ChiNhanh FOREIGN KEY (ChiNhanh) REFERENCES dbo.ChiNhanh(MaChiNhanh)
);
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_NhanVien_ChucVu')
BEGIN
    ALTER TABLE dbo.NhanVien DROP CONSTRAINT CK_NhanVien_ChucVu;
END
GO
-- Bước 2: Thêm ràng buộc mới 
ALTER TABLE dbo.NhanVien
ADD CONSTRAINT CK_NhanVien_ChucVu CHECK (
    ChucVu IN (
        N'Quản trị hệ thống',
        N'Quản lý chi nhánh',
        N'Nhân viên bán hàng',
        N'Nhân viên kho'
    )
);
GO

SELECT MaNV, HoTen, ChucVu 
FROM dbo.NhanVien 
WHERE ChucVu NOT IN (N'Quản trị hệ thống', N'Quản lý chi nhánh', N'Nhân viên bán hàng', N'Nhân viên kho');

CREATE TABLE dbo.HangHoa (
    MaSP VARCHAR(50) NOT NULL PRIMARY KEY,
    TenHang NVARCHAR(100) NOT NULL,
    Gia DECIMAL(10,2) NOT NULL CHECK (Gia >= 0),
    MoTa NVARCHAR(500) NULL,
    AnhSanPham VARCHAR(255) NULL,
    DonViTinh NVARCHAR(50) NULL
); 
ALTER TABLE dbo.HangHoa
ADD TrangThai BIT NOT NULL DEFAULT 1;
GO



CREATE TABLE dbo.HoaDon (
    MaHD VARCHAR(50) NOT NULL PRIMARY KEY,
    GhiChu NVARCHAR(255) NULL,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_HoaDon_C_NgayTao DEFAULT SYSDATETIME(),
    ChiNhanh VARCHAR(10) NOT NULL,
    MaNV VARCHAR(50) NULL,
    CONSTRAINT FK_HoaDon_C_ChiNhanh FOREIGN KEY (ChiNhanh) REFERENCES dbo.ChiNhanh(MaChiNhanh),
    CONSTRAINT FK_HoaDon_C_NhanVien FOREIGN KEY (MaNV) REFERENCES dbo.NhanVien(MaNV)
);
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'MaKH' AND Object_ID = Object_ID(N'dbo.HoaDon')
)
BEGIN
    ALTER TABLE dbo.HoaDon
    ADD MaKH VARCHAR(50) NULL CONSTRAINT FK_HoaDon_KhachHang FOREIGN KEY (MaKH) REFERENCES dbo.KhachHang(MaKH);
    PRINT N'Đã thêm cột MaKH vào bảng HoaDon.';
END
ELSE
BEGIN
    PRINT N'Cột MaKH đã tồn tại trong bảng HoaDon.';
END
GO 


-- fix 
-- ==========================================

-- ==========================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChiTietKhuyenMaiHoaDon')
BEGIN
    CREATE TABLE dbo.ChiTietKhuyenMaiHoaDon(
        MaHD VARCHAR(50) NOT NULL,
        MaKM VARCHAR (50) NOT NULL,
        SoTienGiam DECIMAL(15,2) NOT NULL DEFAULT 0,
        CONSTRAINT PK_ChiTietKhuyenMaiHoaDon PRIMARY KEY (MaHD, MaKM),
        CONSTRAINT FK_ChiTietKhuyenMaiHoaDon_HoaDon FOREIGN KEY (MaHD) REFERENCES dbo.HoaDon(MaHD),
        CONSTRAINT FK_ChiTietKhuyenMaiHoaDon_KhuyenMai FOREIGN KEY (MaKM) REFERENCES dbo.KhuyenMai(MaKM)
    )
END
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HoaDon') AND name = 'TongTienGoc')
BEGIN
    ALTER TABLE dbo.HoaDon ADD TongTienGoc DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD TongSoTienGiam DECIMAL(15,2) NOT NULL DEFAULT 0;
    ALTER TABLE dbo.HoaDon ADD TongTienThanhToan DECIMAL(15,2) NOT NULL DEFAULT 0;
END
GO


ALTER TABLE dbo.HoaDon ADD DiemDaDung INT NOT NULL DEFAULT 0; -- Số điểm khách đã xài cho hóa đơn này
ALTER TABLE dbo.HoaDon ADD SoTienGiamTuDiem DECIMAL(15,2) NOT NULL DEFAULT 0; -- Số tiền tương ứng được giảm




CREATE TABLE dbo.TonKho (
    MaSP VARCHAR(50) NOT NULL,
    SoLuongTon INT NOT NULL CHECK (SoLuongTon >= 0),
    ChiNhanh VARCHAR(10) NOT NULL,
    PRIMARY KEY (MaSP, ChiNhanh),
    CONSTRAINT FK_TonKho_C_HangHoa FOREIGN KEY (MaSP) REFERENCES dbo.HangHoa(MaSP),
    CONSTRAINT FK_TonKho_C_ChiNhanh FOREIGN KEY (ChiNhanh) REFERENCES dbo.ChiNhanh(MaChiNhanh)
);

CREATE TABLE dbo.ChiTietHoaDon (
    MaHD VARCHAR(50) NOT NULL,
    MaSP VARCHAR(50) NOT NULL,
    SoLuong INT NOT NULL CHECK (SoLuong > 0),
    DonGia DECIMAL(10,2) NOT NULL CHECK (DonGia >= 0),
    PRIMARY KEY (MaHD, MaSP),
    CONSTRAINT FK_CTHD_C_HoaDon FOREIGN KEY (MaHD) REFERENCES dbo.HoaDon(MaHD),
    CONSTRAINT FK_CTHD_C_HangHoa FOREIGN KEY (MaSP) REFERENCES dbo.HangHoa(MaSP)
);
GO
-- Bảng lưu token reset mật khẩu
CREATE TABLE dbo.PasswordResetToken (
    Token VARCHAR(255) NOT NULL PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,
    NgayHetHan DATETIME2 NOT NULL,
    CONSTRAINT FK_PasswordResetToken_TaiKhoan FOREIGN KEY (TenDangNhap) REFERENCES dbo.TaiKhoan(TenDangNhap) ON DELETE CASCADE
);
GO 

CREATE TABLE dbo.NhaCungCap (
    MaNCC VARCHAR(50) NOT NULL PRIMARY KEY,
    TenNCC NVARCHAR(255) NOT NULL,
    DienThoai VARCHAR(20) NULL,
    DiaChi NVARCHAR(255) NULL,
    Email VARCHAR(100) NULL,
    TrangThai INT NOT NULL CONSTRAINT DF_NhaCungCap_TrangThai DEFAULT 1
);
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PhieuChuyenKho]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PhieuChuyenKho](
        [MaPCK] [varchar](50) NOT NULL,
        [TuChiNhanh] [varchar](10) NOT NULL,
        [DenChiNhanh] [varchar](10) NOT NULL,
        [NgayChuyen] [datetime2](7) NOT NULL DEFAULT GETDATE(),
        [NguoiChuyen] [varchar](50) NULL,
        [GhiChu] [nvarchar](255) NULL,
        CONSTRAINT [PK_PhieuChuyenKho] PRIMARY KEY CLUSTERED ([MaPCK] ASC)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChiTietChuyenKho]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ChiTietChuyenKho](
        [MaPCK] [varchar](50) NOT NULL,
        [MaSP] [varchar](50) NOT NULL,
        [SoLuongChuyen] [int] NOT NULL,
        CONSTRAINT [PK_ChiTietChuyenKho] PRIMARY KEY CLUSTERED ([MaPCK] ASC, [MaSP] ASC),
        CONSTRAINT [FK_ChiTietChuyenKho_Phieu] FOREIGN KEY ([MaPCK]) REFERENCES [dbo].[PhieuChuyenKho] ([MaPCK])
    );
END
GO

INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia)
VALUES
('MI_GOI', N'Mi goi', 12000),
('SUA_HOP', N'Sua hop', 12000),
('NUOC_SUOI', N'Nuoc suoi', 7000),
('BANH_SNACK', N'Banh snack', 15000),
('CA_PHE_LON', N'Ca phe lon', 18000),
('TRA_XANH', N'Tra xanh', 10000); 



UPDATE dbo.HangHoa 
SET MoTa = N'Mì gói hương vị tôm chua cay thơm ngon', AnhSanPham = '/images/migoi.png', DonViTinh = N'Gói' 
WHERE MaSP = 'MI_GOI';

UPDATE dbo.HangHoa 
SET MoTa = N'Sữa tươi nguyên chất 100% không đường', AnhSanPham = '/images/sua_hop.png', DonViTinh = N'Hộp' 
WHERE MaSP = 'SUA_HOP';


UPDATE dbo.HangHoa 
SET MoTa = N'Nước suối tinh khiết đóng chai 500ml', AnhSanPham = '/images/nuoc_suoi.png', DonViTinh = N'Chai' 
WHERE MaSP = 'NUOC_SUOI';


UPDATE dbo.HangHoa SET MoTa = N'Snack khoai tây chiên giòn rụm vị tự nhiên', AnhSanPham = '/images/banh_snack.png', DonViTinh = N'Gói' WHERE MaSP = 'BANH_SNACK';
UPDATE dbo.HangHoa SET MoTa = N'Cà phê sữa đóng lon tiện lợi, đậm đà', AnhSanPham = '/images/ca_phe_lon.png', DonViTinh = N'Lon' WHERE MaSP = 'CA_PHE_LON';
UPDATE dbo.HangHoa SET MoTa = N'Trà xanh đóng chai giải khát', AnhSanPham = '/images/tra_xanh.png', DonViTinh = N'Chai' WHERE MaSP = 'TRA_XANH';
GO

INSERT INTO dbo.NhanVien (MaNV, HoTen, ChucVu, ChiNhanh)
VALUES
('H001', N'Nguyen Van A', N'Thu ngan', 'HUE'),
('H002', N'Le Van B', N'Quan ly kho', 'HUE'),
('H003', N'Pham Thi C', N'Ban hang', 'HUE'),
('H004', N'Vo Thi D', N'Ban hang', 'HUE'),
('H005', N'Tran Van E', N'Thu ngan', 'HUE'),
('H006', N'Nguyen Thi F', N'Thu ngan', 'HUE'),
('H007', N'Pham Van G', N'Quan ly kho', 'HUE'),
('H008', N'Le Thi H', N'Ban hang', 'HUE'),
('H009', N'Hoang Van I', N'Ban hang', 'HUE'),
('H010', N'Dang Thi K', N'Thu ngan', 'HUE'),
('S001', N'Tran Thi D', N'Ban hang', 'SAIGON'),
('S002', N'Pham Van E', N'Thu ngan', 'SAIGON'),
('S003', N'Le Thi F', N'Quan ly kho', 'SAIGON'),
('S004', N'Nguyen Van G', N'Ban hang', 'SAIGON'),
('S005', N'Pham Thi H', N'Thu ngan', 'SAIGON'),
('S006', N'Vo Van I', N'Quan ly kho', 'SAIGON'),
('S007', N'Le Van K', N'Ban hang', 'SAIGON'),
('S008', N'Do Thi L', N'Thu ngan', 'SAIGON'),
('S009', N'Nguyen Van M', N'Ban hang', 'SAIGON'),
('S010', N'Hoang Thi N', N'Quan ly kho', 'SAIGON'),
('N001', N'Do Thi G', N'Ban hang', 'HANOI'),
('N002', N'Hoang Van H', N'Quan ly cua hang', 'HANOI'),
('N003', N'Nguyen Thi I', N'Thu ngan', 'HANOI'),
('N004', N'Le Van K', N'Ban hang', 'HANOI'),
('N005', N'Tran Thi L', N'Thu ngan', 'HANOI'),
('N006', N'Nguyen Van M', N'Quan ly kho', 'HANOI'),
('N007', N'Pham Thi N', N'Ban hang', 'HANOI'),
('N008', N'Hoang Van P', N'Thu ngan', 'HANOI'),
('N009', N'Dang Thi Q', N'Ban hang', 'HANOI'),
('N010', N'Vu Van R', N'Quan ly kho', 'HANOI'),
('C001', N'Admin Tong cong ty', N'Quan tri he thong', 'CENTRAL');

INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh)
VALUES
('MI_GOI', 220, 'HUE'),
('SUA_HOP', 80, 'HUE'),
('NUOC_SUOI', 140, 'HUE'),
('BANH_SNACK', 95, 'HUE'),
('CA_PHE_LON', 75, 'HUE'),
('TRA_XANH', 130, 'HUE'),
('MI_GOI', 110, 'SAIGON'),
('SUA_HOP', 120, 'SAIGON'),
('NUOC_SUOI', 160, 'SAIGON'),
('BANH_SNACK', 100, 'SAIGON'),
('CA_PHE_LON', 90, 'SAIGON'),
('TRA_XANH', 145, 'SAIGON'),
('MI_GOI', 170, 'HANOI'),
('SUA_HOP', 60, 'HANOI'),
('NUOC_SUOI', 150, 'HANOI'),
('BANH_SNACK', 105, 'HANOI'),
('CA_PHE_LON', 85, 'HANOI'),
('TRA_XANH', 120, 'HANOI');

INSERT INTO dbo.HoaDon (MaHD, GhiChu, ChiNhanh, MaNV)
VALUES
('HD_HUE_001', N'Hoa don khoi tao', 'HUE', 'H001'),
('HD_HUE_002', N'Hoa don khoi tao', 'HUE', 'H002'),
('HD_HUE_003', N'Hoa don khoi tao', 'HUE', 'H003'),
('HD_HUE_004', N'Hoa don khoi tao', 'HUE', 'H004'),
('HD_HUE_005', N'Hoa don khoi tao', 'HUE', 'H005'),
('HD_HUE_006', N'Hoa don khoi tao', 'HUE', 'H006'),
('HD_HUE_007', N'Hoa don khoi tao', 'HUE', 'H007'),
('HD_HUE_008', N'Hoa don khoi tao', 'HUE', 'H008'),
('HD_HUE_009', N'Hoa don khoi tao', 'HUE', 'H009'),
('HD_HUE_010', N'Hoa don khoi tao', 'HUE', 'H010'),
('HD_SG_001', N'Hoa don khoi tao', 'SAIGON', 'S001'),
('HD_SG_002', N'Hoa don khoi tao', 'SAIGON', 'S002'),
('HD_SG_003', N'Hoa don khoi tao', 'SAIGON', 'S003'),
('HD_SG_004', N'Hoa don khoi tao', 'SAIGON', 'S004'),
('HD_SG_005', N'Hoa don khoi tao', 'SAIGON', 'S005'),
('HD_SG_006', N'Hoa don khoi tao', 'SAIGON', 'S006'),
('HD_SG_007', N'Hoa don khoi tao', 'SAIGON', 'S007'),
('HD_SG_008', N'Hoa don khoi tao', 'SAIGON', 'S008'),
('HD_SG_009', N'Hoa don khoi tao', 'SAIGON', 'S009'),
('HD_SG_010', N'Hoa don khoi tao', 'SAIGON', 'S010'),
('HD_HN_001', N'Hoa don khoi tao', 'HANOI', 'N001'),
('HD_HN_002', N'Hoa don khoi tao', 'HANOI', 'N002'),
('HD_HN_003', N'Hoa don khoi tao', 'HANOI', 'N003'),
('HD_HN_004', N'Hoa don khoi tao', 'HANOI', 'N004'),
('HD_HN_005', N'Hoa don khoi tao', 'HANOI', 'N005'),
('HD_HN_006', N'Hoa don khoi tao', 'HANOI', 'N006'),
('HD_HN_007', N'Hoa don khoi tao', 'HANOI', 'N007'),
('HD_HN_008', N'Hoa don khoi tao', 'HANOI', 'N008'),
('HD_HN_009', N'Hoa don khoi tao', 'HANOI', 'N009'),
('HD_HN_010', N'Hoa don khoi tao', 'HANOI', 'N010');

INSERT INTO dbo.ChiTietHoaDon (MaHD, MaSP, SoLuong, DonGia)
VALUES
('HD_HUE_001', 'MI_GOI', 10, 12000),
('HD_HUE_001', 'SUA_HOP', 2, 12000),
('HD_HUE_002', 'SUA_HOP', 5, 12000),
('HD_HUE_002', 'NUOC_SUOI', 3, 7000),
('HD_HUE_003', 'NUOC_SUOI', 12, 7000),
('HD_HUE_003', 'BANH_SNACK', 1, 15000),
('HD_HUE_004', 'BANH_SNACK', 4, 15000),
('HD_HUE_004', 'TRA_XANH', 2, 10000),
('HD_HUE_005', 'CA_PHE_LON', 6, 18000),
('HD_HUE_005', 'MI_GOI', 3, 12000),
('HD_HUE_006', 'TRA_XANH', 7, 10000),
('HD_HUE_006', 'NUOC_SUOI', 4, 7000),
('HD_HUE_007', 'MI_GOI', 3, 12000),
('HD_HUE_007', 'CA_PHE_LON', 2, 18000),
('HD_HUE_008', 'BANH_SNACK', 2, 15000),
('HD_HUE_008', 'SUA_HOP', 1, 12000),
('HD_HUE_009', 'NUOC_SUOI', 8, 7000),
('HD_HUE_009', 'TRA_XANH', 2, 10000),
('HD_HUE_010', 'TRA_XANH', 5, 10000),
('HD_HUE_010', 'BANH_SNACK', 1, 15000),
('HD_SG_001', 'SUA_HOP', 8, 12000),
('HD_SG_001', 'MI_GOI', 2, 12000),
('HD_SG_002', 'MI_GOI', 6, 12000),
('HD_SG_002', 'NUOC_SUOI', 3, 7000),
('HD_SG_003', 'NUOC_SUOI', 10, 7000),
('HD_SG_003', 'BANH_SNACK', 2, 15000),
('HD_SG_004', 'BANH_SNACK', 5, 15000),
('HD_SG_004', 'TRA_XANH', 3, 10000),
('HD_SG_005', 'CA_PHE_LON', 7, 18000),
('HD_SG_005', 'SUA_HOP', 2, 12000),
('HD_SG_006', 'TRA_XANH', 9, 10000),
('HD_SG_006', 'MI_GOI', 3, 12000),
('HD_SG_007', 'MI_GOI', 4, 12000),
('HD_SG_007', 'BANH_SNACK', 1, 15000),
('HD_SG_008', 'BANH_SNACK', 3, 15000),
('HD_SG_008', 'CA_PHE_LON', 2, 18000),
('HD_SG_009', 'NUOC_SUOI', 6, 7000),
('HD_SG_009', 'TRA_XANH', 2, 10000),
('HD_SG_010', 'TRA_XANH', 4, 10000),
('HD_SG_010', 'SUA_HOP', 1, 12000),
('HD_HN_001', 'MI_GOI', 6, 12000),
('HD_HN_001', 'NUOC_SUOI', 2, 7000),
('HD_HN_002', 'SUA_HOP', 4, 12000),
('HD_HN_002', 'BANH_SNACK', 1, 15000),
('HD_HN_003', 'NUOC_SUOI', 9, 7000),
('HD_HN_003', 'TRA_XANH', 2, 10000),
('HD_HN_004', 'BANH_SNACK', 6, 15000),
('HD_HN_004', 'MI_GOI', 2, 12000),
('HD_HN_005', 'CA_PHE_LON', 5, 18000),
('HD_HN_005', 'SUA_HOP', 1, 12000),
('HD_HN_006', 'TRA_XANH', 8, 10000),
('HD_HN_006', 'NUOC_SUOI', 3, 7000),
('HD_HN_007', 'MI_GOI', 3, 12000),
('HD_HN_007', 'CA_PHE_LON', 1, 18000),
('HD_HN_008', 'BANH_SNACK', 2, 15000),
('HD_HN_008', 'TRA_XANH', 2, 10000),
('HD_HN_009', 'NUOC_SUOI', 7, 7000),
('HD_HN_009', 'SUA_HOP', 2, 12000),
('HD_HN_010', 'TRA_XANH', 5, 10000),
('HD_HN_010', 'MI_GOI', 2, 12000);
GO






CREATE TABLE dbo.KhuyenMai (
    MaKM VARCHAR(50) NOT NULL PRIMARY KEY,
    TenChuongTrinh NVARCHAR(150) NOT NULL,
    PhanTramGiam INT NOT NULL CONSTRAINT CK_KhuyenMai_PhanTram CHECK (PhanTramGiam >= 0 AND PhanTramGiam <= 100),
    NgayBatDau DATETIME2 NOT NULL,
    NgayKetThuc DATETIME2 NOT NULL,
    CONSTRAINT CK_KhuyenMai_ThoiGian CHECK (NgayKetThuc >= NgayBatDau)
);
GO
-- 1. Bảng Khuyến Mãi: Thêm 6 trường quản trị rủi ro dòng tiền
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.KhuyenMai') AND name = 'LoaiKhuyenMai')
BEGIN
    -- Loại khuyến mãi: 'PERCENTAGE' (Giảm theo %) hoặc 'FIXED' (Trừ thẳng tiền)
    ALTER TABLE dbo.KhuyenMai ADD LoaiKhuyenMai VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE';
    
    -- Giảm Tối Đa (Ví dụ: Giảm 20% nhưng không quá 50.000đ)
    ALTER TABLE dbo.KhuyenMai ADD GiamToiDa DECIMAL(15,2) NULL; 
    
    -- Đơn tối thiểu (Ví dụ: Đơn phải trên 200.000đ mới được dùng)
    ALTER TABLE dbo.KhuyenMai ADD DonHangToiThieu DECIMAL(15,2) NOT NULL DEFAULT 0;
    
    -- Giới hạn số lượng người dùng (Chống dành giật mã)
    ALTER TABLE dbo.KhuyenMai ADD SoLuongGioiHan INT NULL; 
    ALTER TABLE dbo.KhuyenMai ADD SoLuongDaDung INT NOT NULL DEFAULT 0;
    
    -- Cho phép cộng dồn (Stackable): 1 = Được xài chung mã khác, 0 = Xài mã này thì cấm xài mã khác
    ALTER TABLE dbo.KhuyenMai ADD ChoPhepCongDon BIT NOT NULL DEFAULT 1;
    
    -- Trạng thái: 1 = Đang mở, 0 = Tạm dừng khẩn cấp (Emergency stop)
    ALTER TABLE dbo.KhuyenMai ADD TrangThai BIT NOT NULL DEFAULT 1;
    
    -- Trừ thẳng số tiền (Sử dụng khi LoaiKhuyenMai = 'FIXED')
    ALTER TABLE dbo.KhuyenMai ADD SoTienGiamTrucTiep DECIMAL(15,2) NOT NULL DEFAULT 0;
END
GO


CREATE TABLE dbo.KhachHang (
    MaKH VARCHAR(50) NOT NULL PRIMARY KEY,
    HoTen NVARCHAR(120) NOT NULL,
    SoDienThoai VARCHAR(15) NULL,
    DiemTichLuy INT NOT NULL CONSTRAINT DF_KhachHang_Diem DEFAULT 0 CONSTRAINT CK_KhachHang_Diem CHECK (DiemTichLuy >= 0),
    ChiNhanhDK VARCHAR(10) NOT NULL,
    CONSTRAINT FK_KhachHang_C_ChiNhanh FOREIGN KEY (ChiNhanhDK) REFERENCES dbo.ChiNhanh(MaChiNhanh)
);
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'NgayDangKy' AND Object_ID = Object_ID(N'dbo.KhachHang')
)
BEGIN
    ALTER TABLE dbo.KhachHang
    ADD NgayDangKy DATETIME NOT NULL CONSTRAINT DF_KhachHang_NgayDK DEFAULT GETDATE();
    PRINT N'Đã thêm cột NgayDangKy vào bảng KhachHang.';
END
ELSE
BEGIN
    PRINT N'Cột NgayDangKy đã tồn tại.';
END
GO

-- 2. Đảm bảo cột SoDienThoai là duy nhất (UNIQUE)
-- Dùng Filtered Index để tránh lỗi khi có nhiều khách hàng chưa cập nhật số điện thoại (NULL)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'UQ_KhachHang_SDT' AND object_id = OBJECT_ID(N'dbo.KhachHang')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_KhachHang_SDT 
    ON dbo.KhachHang(SoDienThoai) 
    WHERE SoDienThoai IS NOT NULL;
    PRINT N'Đã tạo Index đảm bảo số điện thoại không trùng lặp.';
END
ELSE
BEGIN
    PRINT N'Index UQ_KhachHang_SDT đã tồn tại.';
END
GO
INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, NgayDangKy, ChiNhanhDK)
VALUES 
('KH011', N'Nguyễn Văn An', '0901111112', 150, '2023-01-15 08:30:00', 'SAIGON'),
('KH0012', N'Trần Thị Bích', '0902222422', 0, '2023-05-20 14:45:00', 'HANOI'),
('KH0013', N'Lê Hoàng Cường', '0906333333', 500, '2023-08-10 09:15:00', 'HUE'),
('KH0014', N'Phạm Thị Dung', '0904444544', 50, '2023-11-05 16:20:00', 'SAIGON'),
('KH0015', N'Vũ Đức Duy', '0905555455', 1200, '2024-01-22 10:00:00', 'HANOI');
GO

CREATE TABLE dbo.TaiKhoan (
    TenDangNhap VARCHAR(50) NOT NULL PRIMARY KEY,
    MatKhau VARCHAR(255) NOT NULL, -- Độ dài lớn để lưu chuỗi băm (Hash password) như BCrypt/Argon2
    MaNV VARCHAR(50) NOT NULL,
    Quyen NVARCHAR(50) NOT NULL,  -- NHAN_VIEN | ADMIN_CHI_NHANH | ADMIN_TOAN_BO
    TrangThai BIT NOT NULL CONSTRAINT DF_TaiKhoan_TrangThai DEFAULT 1,
    CONSTRAINT UQ_TaiKhoan_MaNV UNIQUE (MaNV),
    CONSTRAINT CK_TaiKhoan_Quyen CHECK (Quyen IN (N'NHAN_VIEN', N'ADMIN_CHI_NHANH', N'ADMIN_TOAN_BO')),
    CONSTRAINT FK_TaiKhoan_C_NhanVien FOREIGN KEY (MaNV) REFERENCES dbo.NhanVien(MaNV)
);
GO


CREATE TABLE dbo.PhieuNhap (
    MaPN VARCHAR(50) NOT NULL PRIMARY KEY,
    NgayNhap DATETIME2 NOT NULL CONSTRAINT DF_PhieuNhap_C_NgayNhap DEFAULT SYSDATETIME(),
    ChiNhanh VARCHAR(10) NOT NULL,
    TongTien DECIMAL(18,2) NOT NULL CONSTRAINT DF_PhieuNhap_C_TongTien DEFAULT 0 CHECK (TongTien >= 0),
    GhiChu NVARCHAR(255) NULL,
    MaNCC VARCHAR(50) NULL,
    CONSTRAINT FK_PhieuNhap_C_ChiNhanh FOREIGN KEY (ChiNhanh) REFERENCES dbo.ChiNhanh(MaChiNhanh),
    CONSTRAINT FK_PhieuNhap_C_NhaCungCap FOREIGN KEY (MaNCC) REFERENCES dbo.NhaCungCap(MaNCC)
);
GO 

CREATE TABLE dbo.ChiTietPhieuNhap (
    MaPN VARCHAR(50) NOT NULL,
    MaSP VARCHAR(50) NOT NULL,
    SoLuong INT NOT NULL CONSTRAINT CK_CTPN_C_SoLuong CHECK (SoLuong > 0),
    DonGiaNhap DECIMAL(10,2) NOT NULL CONSTRAINT CK_CTPN_C_DonGia CHECK (DonGiaNhap >= 0),
    PRIMARY KEY (MaPN, MaSP),
    CONSTRAINT FK_CTPN_C_PhieuNhap FOREIGN KEY (MaPN) REFERENCES dbo.PhieuNhap(MaPN),
    CONSTRAINT FK_CTPN_C_HangHoa FOREIGN KEY (MaSP) REFERENCES dbo.HangHoa(MaSP)
);
GO 





INSERT INTO dbo.KhuyenMai (MaKM, TenChuongTrinh, PhanTramGiam, NgayBatDau, NgayKetThuc)
VALUES 
('KM_HE_2026', N'Chào Hè rực rỡ', 10, '2026-06-01', '2026-06-30'),
('KM_SINH_NHAT', N'Sinh nhật hệ thống', 20, '2026-07-01', '2026-07-10');
GO

INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK)
VALUES
('KH_H001', N'Trần Khách Huế', '0901111111', 150, 'HUE'),
('KH_S001', N'Nguyễn Khách Sài Gòn', '0902222222', 300, 'SAIGON'),
('KH_N001', N'Lê Khách Hà Nội', '0903333333', 50, 'HANOI');
GO


INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, MaNV, Quyen, TrangThai)
VALUES
('thu_ngan_hue', '123456', 'H001', N'NHAN_VIEN', 1),
('thu_ngan_sg', '123456', 'S001', N'NHAN_VIEN', 1),
('thu_ngan_hn', '123456', 'N001', N'NHAN_VIEN', 1),
('admin_hue', '123456', 'H002', N'ADMIN_CHI_NHANH', 1),
('admin_central', '123456', 'C001', N'ADMIN_TOAN_BO', 1);
GO


INSERT INTO dbo.PhieuNhap (MaPN, NgayNhap, ChiNhanh, TongTien, GhiChu)
VALUES
('PN_HUE_001', SYSDATETIME(), 'HUE', 600000, N'Nhập hàng tuần 1 Huế'),
('PN_SG_001', SYSDATETIME(), 'SAIGON', 700000, N'Nhập hàng tuần 1 SG'),
('PN_HN_001', SYSDATETIME(), 'HANOI', 300000, N'Nhập hàng tuần 1 HN');
GO


INSERT INTO dbo.ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
VALUES

('PN_HUE_001', 'MI_GOI', 50, 8000),
('PN_HUE_001', 'BANH_SNACK', 20, 10000),


('PN_SG_001', 'SUA_HOP', 100, 7000),


('PN_HN_001', 'NUOC_SUOI', 60, 5000);
GO 









-- 1. TẠO BẢNG DANH MỤC
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DanhMuc]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DanhMuc](
        [MaDM] [varchar](20) NOT NULL,
        [TenDM] [nvarchar](100) NOT NULL,
        [MoTa] [nvarchar](255) NULL,
        [rowguid] [uniqueidentifier] ROWGUIDCOL NOT NULL DEFAULT (newid()),
        CONSTRAINT [PK_DanhMuc] PRIMARY KEY CLUSTERED ([MaDM] ASC)
    )
END
GO

-- 2. TẠO BẢNG THƯƠNG HIỆU
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ThuongHieu]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ThuongHieu](
        [MaTH] [varchar](20) NOT NULL,
        [TenTH] [nvarchar](100) NOT NULL,
        [QuocGia] [nvarchar](50) NULL,
        [rowguid] [uniqueidentifier] ROWGUIDCOL NOT NULL DEFAULT (newid()),
        CONSTRAINT [PK_ThuongHieu] PRIMARY KEY CLUSTERED ([MaTH] ASC)
    )
END
GO

-- 3. CHÈN DỮ LIỆU MẪU (MOCK DATA - CỬA HÀNG TIỆN LỢI POS)
IF NOT EXISTS (SELECT 1 FROM dbo.DanhMuc)
BEGIN
    INSERT INTO dbo.DanhMuc (MaDM, TenDM) VALUES 
    ('DM01', N'Đồ uống (Nước ngọt, Bia)'), 
    ('DM02', N'Đồ ăn vặt (Bánh, Kẹo)'), 
    ('DM03', N'Thực phẩm đóng gói (Mì tôm, Xúc xích)'), 
    ('DM04', N'Hóa mỹ phẩm (Dầu gội, Bột giặt)');
END

IF NOT EXISTS (SELECT 1 FROM dbo.ThuongHieu)
BEGIN
    INSERT INTO dbo.ThuongHieu (MaTH, TenTH) VALUES 
    ('TH01', N'Coca-Cola'), 
    ('TH02', N'PepsiCo'), 
    ('TH03', N'Orion'), 
    ('TH04', N'Unilever');
END
GO

-- 4. BỔ SUNG CÁC TRƯỜNG MỚI CHO BẢNG HANGHOA
IF COL_LENGTH('dbo.HangHoa', 'MaDM') IS NULL
BEGIN
    ALTER TABLE dbo.HangHoa ADD [MaDM] [varchar](20) NULL;
END

IF COL_LENGTH('dbo.HangHoa', 'MaTH') IS NULL
BEGIN
    ALTER TABLE dbo.HangHoa ADD [MaTH] [varchar](20) NULL;
END

IF COL_LENGTH('dbo.HangHoa', 'Barcode') IS NULL
BEGIN
    ALTER TABLE dbo.HangHoa ADD [Barcode] [varchar](50) NULL;
END
GO


-- 6. CẬP NHẬT DỮ LIỆU CŨ CHO HỢP LÝ
-- Chọn ngẫu nhiên danh mục và thương hiệu cho các sản phẩm đã có sẵn trong db
UPDATE dbo.HangHoa SET MaDM = 'DM01', MaTH = 'TH01', Barcode = '893' + MaSP WHERE MaDM IS NULL;
GO


