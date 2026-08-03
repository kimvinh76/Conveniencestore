
SELECT tk.MaNV, tk.TenDangNhap, tk.Quyen, nv.ChiNhanh, tk.TrangThai 
FROM dbo.TaiKhoan tk
INNER JOIN dbo.NhanVien nv ON tk.MaNV = nv.MaNV
WHERE nv.ChiNhanh = 'HUE';



