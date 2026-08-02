-- ==============================================================
-- TC_PRO_01: Kiểm tra API Xem Danh sách Sản phẩm (GET /api/products)
-- ==============================================================



SELECT 
    hh.MaSP, 
    hh.TenHang, 
    hh.DonViTinh, 
    hh.Gia, 
    ISNULL(tk.SoLuongTon, 0) AS SoLuongTon,
    hh.TrangThai
FROM dbo.HangHoa hh
LEFT JOIN dbo.TonKho tk ON hh.MaSP = tk.MaSP AND tk.ChiNhanh = 'HUE' -- Đổi thành chi nhánh bạn đang test
ORDER BY hh.MaSP ASC;
GO
