-- ==========================================================
-- BỔ SUNG CẬP NHẬT STORE: usp_Local_DanhSachTonKho
-- (Chạy trên các Database Chi Nhánh: Store_HN, Store_H, Store_SG)

-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_Local_DanhSachTonKho]
AS
BEGIN
    SET NOCOUNT ON;

   
   
    
    SELECT t.MaSP, t.SoLuongTon
    FROM dbo.TonKho t
    INNER JOIN dbo.HangHoa h ON h.MaSP = t.MaSP
    WHERE t.ChiNhanh = 'SAIGON' -
      AND (h.TrangThai = 1 OR t.SoLuongTon > 0)
    ORDER BY t.MaSP;
END;
GO
