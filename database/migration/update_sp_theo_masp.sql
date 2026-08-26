-- ==========================================================
-- BỔ SUNG CẬP NHẬT STORE: usp_Chung_HangHoaTheoMaSP
-- (Chạy trên tất cả các Database: CentralDB, Store_HN, Store_H, Store_SG)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_Chung_HangHoaTheoMaSP]
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    SELECT TOP 1 
        MaSP, 
        TenHang, 
        CAST(Gia AS DECIMAL(10,2)) AS Gia,
        MoTa,
        AnhSanPham,
        DonViTinh,
        TrangThai -- Bổ sung trường TrangThai để Backend biết sản phẩm còn bán hay đã ngừng kinh doanh
    FROM dbo.HangHoa
    WHERE MaSP = @MaSP;
    -- LƯU Ý QUAN TRỌNG: KHÔNG THÊM "AND TrangThai = 1" Ở ĐÂY.
    -- Vì những Hóa Đơn cũ có chứa sản phẩm này vẫn cần gọi hàm này để xem chi tiết sản phẩm.
    -- Ta chỉ cần SELECT ra TrangThai để Frontend hiển thị chữ "Đã ngừng kinh doanh".
END;
GO
