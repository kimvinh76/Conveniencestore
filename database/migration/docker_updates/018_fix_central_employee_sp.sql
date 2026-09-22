-- File: 018_fix_central_employee_sp.sql
-- Description: Bổ sung cột Email và TrangThai vào Store Procedure lấy danh sách nhân viên trên Central DB

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DanhSachNhanVienToanBo]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT MaNV, HoTen, ChucVu, ChiNhanh, Email, TrangThai 
    FROM dbo.NhanVien 
    ORDER BY ChiNhanh, HoTen;
END;
GO
