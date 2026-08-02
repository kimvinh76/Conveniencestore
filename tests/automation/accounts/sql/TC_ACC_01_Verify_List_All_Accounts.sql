-- =============================================
-- TEST SCRIPT: KIỂM CHỨNG API LẤY DANH SÁCH TOÀN BỘ TÀI KHOẢN
-- Kịch bản: Kịch bản Happy Path (Admin Tổng)
-- Nơi chạy: Chạy trên SSMS (Connect vào Server CENTRAL)
-- =============================================

-- 1. Bằng chứng số lượng tổng (Đối chiếu với tổng số Item trả về trên Postman)
SELECT COUNT(*) AS TongSoTaiKhoanThucTe 
FROM dbo.TaiKhoan;

-- 2. Bằng chứng dữ liệu chi tiết
-- Cố tình chạy chính xác Stored Procedure mà hệ thống API Node.js đang gọi
-- => So sánh kết quả bảng này với kết quả JSON trên Postman xem có khớp 100% không.
EXEC dbo.usp_Central_DanhSachTaiKhoanToanBo;
