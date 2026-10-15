CREATE OR ALTER PROCEDURE dbo.usp_Chung_DangNhap
    @TenDangNhap VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1
        tk.TenDangNhap,
        tk.MatKhau,
        tk.MaNV,
        tk.Quyen,
        tk.TrangThai,
        nv.HoTen,
        nv.ChucVu,
        nv.Email,
        nv.ChiNhanh
    FROM dbo.TaiKhoan tk
    INNER JOIN dbo.NhanVien nv ON nv.MaNV = tk.MaNV
    WHERE tk.TenDangNhap = @TenDangNhap;
END;
GO
