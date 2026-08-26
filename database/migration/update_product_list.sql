-- ==========================================================
-- BỔ SUNG CẬP NHẬT STORE: usp_Chung_DanhSachHangHoa
-- (Chạy trên Database CentralDB)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

ALTER PROCEDURE [dbo].[usp_Chung_DanhSachHangHoa]
AS
BEGIN
    SET NOCOUNT ON;

    -- LƯU Ý: Không dùng WHERE TrangThai = 1 nữa, vì Frontend cần lấy 
    -- tất cả sản phẩm ra để hiển thị Tag "Ngừng kinh doanh" cho rõ ràng.
    SELECT
        MaSP AS productCode,
        TenHang AS productName,
        CAST(Gia AS DECIMAL(10,2)) AS unitPrice,
        MoTa AS description,         
        AnhSanPham AS imageUrl,       
        DonViTinh AS unit,
        TrangThai AS active
    FROM dbo.HangHoa
    ORDER BY MaSP;
END;
GO
