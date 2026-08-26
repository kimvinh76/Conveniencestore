-- ==========================================================
-- DỮ LIỆU MẪU: BẢNG KHACHHANG
-- Chạy trên CentralDB (Replication sẽ tự đẩy về các chi nhánh)
-- ==========================================================

INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, NgayDangKy, ChiNhanhDK)
VALUES 
('KH001', N'Nguyễn Văn An', '0901111111', 150, '2023-01-15 08:30:00', 'SAIGON'),
('KH002', N'Trần Thị Bích', '0902222222', 0, '2023-05-20 14:45:00', 'HANOI'),
('KH003', N'Lê Hoàng Cường', '0903333333', 500, '2023-08-10 09:15:00', 'HUE'),
('KH004', N'Phạm Thị Dung', '0904444444', 50, '2023-11-05 16:20:00', 'SAIGON'),
('KH005', N'Vũ Đức Duy', '0905555555', 1200, '2024-01-22 10:00:00', 'HANOI');
GO
