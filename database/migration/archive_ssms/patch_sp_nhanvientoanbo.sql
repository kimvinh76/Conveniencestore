USE [DDBMS];
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO


CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DanhSachNhanVienToanBo]
AS
BEGIN
    SET NOCOUNT ON;
    -- Lấy luôn từ bản sao (Replication) đã đồng bộ tại Central cho lẹ!
    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM dbo.NhanVien 
    ORDER BY ChiNhanh, HoTen;
END
GO