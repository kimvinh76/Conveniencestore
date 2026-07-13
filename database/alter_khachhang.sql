
-- SCRIPT CẬP NHẬT BẢNG KHACHHANG
-- Chạy script này trên tất cả các Database (CentralDB, Store_HN, Store_H, Store_SG)

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. Thêm cột NgayDangKy (mặc định là ngày hiện tại)
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
