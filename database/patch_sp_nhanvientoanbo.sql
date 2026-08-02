USE [DDBMS];
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Author:      Antigravity
-- Create date: 2026-07-27
-- Description: Lấy danh sách toàn bộ nhân viên trên toàn quốc (Central + Các chi nhánh)
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DanhSachNhanVienToanBo]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM dbo.NhanVien 
    WHERE ChiNhanh = 'CENTRAL'
    
    UNION ALL
    
    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM [HUE_SERVER].[Store_H].dbo.NhanVien 
    WHERE ChiNhanh = 'HUE'
    
    UNION ALL
    
    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM [SG_SERVER].[Store_SG].dbo.NhanVien 
    WHERE ChiNhanh = 'SAIGON'
    
    UNION ALL
    
    SELECT MaNV, HoTen, ChucVu, ChiNhanh 
    FROM [HN_SERVER].[Store_HN].dbo.NhanVien 
    WHERE ChiNhanh = 'HANOI'
    
    ORDER BY ChiNhanh, HoTen;
END
GO
