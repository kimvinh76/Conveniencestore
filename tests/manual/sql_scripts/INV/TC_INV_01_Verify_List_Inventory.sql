-- ==============================================================
-- TC_INV_01: Kiểm tra API Xem Danh sách Tồn Kho (GET /api/inventory)
-- ==============================================================

-- BƯỚC 1: Chọn Database Chi nhánh bạn muốn test (VD: Store_H cho Huế)
USE [Store_H]; -- Thay bằng Store_SG nếu test Sài Gòn
GO

-- BƯỚC 2: Chạy câu lệnh này để lấy danh sách Tồn kho dưới Database
-- So sánh kết quả bảng này với mảng JSON trả về trên Postman
SELECT 
    MaSP, 
    SoLuongTon, 
    ChiNhanh
FROM dbo.TonKho;
GO
