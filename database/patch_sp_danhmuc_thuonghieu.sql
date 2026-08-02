USE [DDBMS]; -- Chạy trên Server CENTRAL (và các chi nhánh nếu cần)
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- =============================================
-- Lấy danh sách danh mục sản phẩm
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachDanhMuc]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaDM AS categoryCode,
        TenDM AS categoryName,
        MoTa AS description
    FROM dbo.DanhMuc
    ORDER BY MaDM;
END
GO

-- =============================================
-- Lấy danh sách thương hiệu sản phẩm
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachThuongHieu]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaTH AS brandCode,
        TenTH AS brandName,
        QuocGia AS country
    FROM dbo.ThuongHieu
    ORDER BY MaTH;
END
GO
