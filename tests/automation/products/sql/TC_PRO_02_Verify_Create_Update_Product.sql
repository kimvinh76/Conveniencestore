-- ==============================================================
-- TC_PRO_02: Kiểm tra API Thêm/Sửa Sản phẩm (POST / PUT /api/products)
-- ==============================================================

-- Chỉ có Server Central mới được phép thêm/sửa sản phẩm.
-- Sau khi thêm, hệ thống Replication sẽ tự đẩy hàng hóa về các chi nhánh.

-- BƯỚC 1: TRƯỚC KHI TEST
-- Chạy trên Central để xem sản phẩm định thêm (VD: SP999) đã có chưa.
USE [DDBMS];
SELECT * FROM dbo.HangHoa WHERE MaSP = 'SP999';
GO

-- ... (GỌI API TRÊN POSTMAN: POST /api/products với body chứa SP999) ...

-- BƯỚC 2: KIỂM TRA TẠI CENTRAL (Chứng minh thêm thành công)
USE [DDBMS];
SELECT * FROM dbo.HangHoa WHERE MaSP = 'SP999';
GO

-- BƯỚC 3: KIỂM TRA ĐỒNG BỘ TẠI CHI NHÁNH (Chứng minh Replication hoạt động)
-- (Nhớ đợi khoảng 5-10 giây để SQL Server Replication đẩy dữ liệu)
USE [Store_H]; -- Kết nối sang Server Huế
SELECT * FROM dbo.HangHoa WHERE MaSP = 'SP999';
GO
