-- ==============================================================
-- TC_INV_02: Kiểm tra API Điều Chuyển Kho (POST /api/transfer/transfer-stock)
-- ==============================================================

-- CHUẨN BỊ TRƯỚC KHI TEST (VD: Test chuyển SP001 từ HUE sang SAIGON)
-- Chạy trên Server HUE
USE [Store_H];
SELECT MaSP, SoLuongTon, ChiNhanh FROM dbo.TonKho WHERE MaSP = 'SP001';
GO

-- Chạy trên Server SAIGON
USE [Store_SG];
SELECT MaSP, SoLuongTon, ChiNhanh FROM dbo.TonKho WHERE MaSP = 'SP001';
GO

-- ... (GỌI API TRÊN POSTMAN: Chuyển 10 SP001 từ HUE sang SAIGON) ...

-- ==============================================================
-- BƯỚC 1: KIỂM TRA LƯU VẾT TẠI SERVER CENTRAL (DDBMS)
-- Chụp ảnh cái này để chứng minh đã có chứng từ chuyển kho!
-- ==============================================================
USE [DDBMS];
GO

SELECT TOP 1 p.MaPCK, p.TuChiNhanh, p.DenChiNhanh, p.NgayChuyen, p.NguoiChuyen, c.MaSP, c.SoLuongChuyen
FROM dbo.PhieuChuyenKho p
JOIN dbo.ChiTietChuyenKho c ON p.MaPCK = c.MaPCK
ORDER BY p.NgayChuyen DESC;
GO


-- ==============================================================
-- BƯỚC 2: KIỂM TRA SỐ LƯỢNG TỒN KHO THỰC TẾ SAU KHI CHUYỂN
-- ==============================================================

-- Tại Server HUE (Kỳ vọng: Bị TRỪ đi 10)
USE [Store_H];
SELECT MaSP, SoLuongTon, ChiNhanh FROM dbo.TonKho WHERE MaSP = 'SP001';
GO

-- Tại Server SAIGON (Kỳ vọng: Được CỘNG thêm 10)
USE [Store_SG];
SELECT MaSP, SoLuongTon, ChiNhanh FROM dbo.TonKho WHERE MaSP = 'SP001';
GO
