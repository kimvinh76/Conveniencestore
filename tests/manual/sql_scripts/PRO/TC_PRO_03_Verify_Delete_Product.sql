-- ==============================================================
-- TC_PRO_03: Kiểm tra API Xóa Sản phẩm (DELETE /api/products)
-- ==============================================================

-- Hệ thống đang áp dụng cơ chế XÓA MỀM (Soft Delete).
-- Tức là khi gọi API Xóa, bản ghi không bị mất đi mà chỉ đổi cột TrangThai = 0.

-- BƯỚC 1: KIỂM TRA TRƯỚC KHI XÓA
USE [DDBMS];
SELECT MaSP, TenSP, TrangThai FROM dbo.HangHoa WHERE MaSP = 'SP999';
GO

-- ... (GỌI API TRÊN POSTMAN: DELETE /api/products/SP999) ...

-- BƯỚC 2: KIỂM TRA SAU KHI XÓA (Chứng minh đã Xóa mềm)
USE [DDBMS];
SELECT MaSP, TenSP, TrangThai 
FROM dbo.HangHoa 
WHERE MaSP = 'SP999'; 
-- KỲ VỌNG: TrangThai chuyển từ 1 thành 0 (Đã ngừng kinh doanh)
GO
