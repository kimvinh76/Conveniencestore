USE [DDBMS]; -- Chạy trên Server CENTRAL
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
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

-- 5. THÊM KHÓA NGOẠI (TÙY CHỌN - Nhưng nên có)
-- Lưu ý: Khi thiết lập Replication, Khóa ngoại có thể gây phiền toái nếu thứ tự đồng bộ không đúng.
-- Tuy nhiên để đảm bảo tính toàn vẹn dữ liệu, chúng ta vẫn nên thiết lập.
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_HangHoa_DanhMuc]') AND parent_object_id = OBJECT_ID(N'[dbo].[HangHoa]'))
BEGIN
    ALTER TABLE [dbo].[HangHoa] WITH CHECK ADD CONSTRAINT [FK_HangHoa_DanhMuc] FOREIGN KEY([MaDM])
    REFERENCES [dbo].[DanhMuc] ([MaDM])
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID(N'[dbo].[FK_HangHoa_ThuongHieu]') AND parent_object_id = OBJECT_ID(N'[dbo].[HangHoa]'))
BEGIN
    ALTER TABLE [dbo].[HangHoa] WITH CHECK ADD CONSTRAINT [FK_HangHoa_ThuongHieu] FOREIGN KEY([MaTH])
    REFERENCES [dbo].[ThuongHieu] ([MaTH])
END
GO

-- 6. CẬP NHẬT DỮ LIỆU CŨ CHO HỢP LÝ
-- Chọn ngẫu nhiên danh mục và thương hiệu cho các sản phẩm đã có sẵn trong db
UPDATE dbo.HangHoa SET MaDM = 'DM01', MaTH = 'TH01', Barcode = '893' + MaSP WHERE MaDM IS NULL;
GO
