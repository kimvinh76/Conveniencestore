

-- 1. TÌM NHÂN VIÊN CHƯA CÓ TÀI KHOẢN (Dùng cho Kịch bản Happy Path)

SELECT  nv.MaNV, nv.HoTen, nv.ChiNhanh
FROM dbo.NhanVien nv
LEFT JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV
WHERE tk.TenDangNhap IS NULL; 

-- 2. TÌM NHÂN VIÊN ĐÃ CÓ TÀI KHOẢN (Dùng cho Kịch bản Negative: 1 người 2 acc)

SELECT TOP 1 nv.MaNV, tk.TenDangNhap 
FROM dbo.NhanVien nv
INNER JOIN dbo.TaiKhoan tk ON nv.MaNV = tk.MaNV;



-- 3. CHỨNG MINH TÀI KHOẢN ĐÃ ĐƯỢC INSERT THÀNH CÔNG VÀO DB

SELECT * FROM dbo.TaiKhoan 
WHERE TenDangNhap = 'nv_test_moi';
