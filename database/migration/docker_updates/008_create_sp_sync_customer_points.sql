-- File: 008_create_sp_sync_customer_points.sql
-- Description: Tạo SP đồng bộ Điểm tích lũy ngang hàng giữa các Chi nhánh khi có phát sinh Hóa đơn

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Branch_DongBoDiemKhachHang]
    @MaKH VARCHAR(50),
    @DiemThayDoi INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NOT NULL AND @DiemThayDoi <> 0
    BEGIN
        -- Nếu Khách hàng có tồn tại ở chi nhánh này thì mới cộng/trừ điểm
        IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        BEGIN
            UPDATE dbo.KhachHang 
            SET DiemTichLuy = DiemTichLuy + @DiemThayDoi 
            WHERE MaKH = @MaKH;
        END
    END
END;
GO
