-- ==============================================================
-- TC_EMP_05: Kiểm tra API Xem Danh sách Nhân viên TOÀN HỆ THỐNG
-- API: GET /api/employees/all (Chỉ dành cho ADMIN_TOAN_BO)
-- ==============================================================

-- BƯỚC 1: Gọi API trên Postman (Gắn token của ADMIN_TOAN_BO)
-- Gửi request: GET /api/employees/all
-- API này sẽ lấy danh sách gộp của toàn bộ nhân viên từ các chi nhánh
-- để hiển thị lên Dropdown lúc tạo tài khoản mới.

-- BƯỚC 2: CHẠY LỆNH NÀY TRÊN SERVER CENTRAL (DDBMS)
-- Chạy đoạn lệnh dưới đây để chứng minh kết quả API trả về khớp 100% 
-- với bảng lưu trữ của Central (Nhờ Merge Replication đã đẩy đủ dữ liệu về Central).

USE [DDBMS];
GO

SELECT 
    MaNV, 
    HoTen, 
    ChucVu, 
    ChiNhanh, 
    TrangThai
FROM dbo.NhanVien 
ORDER BY ChiNhanh, HoTen;
GO
