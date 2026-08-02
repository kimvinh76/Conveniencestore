USE [Store_H] 
GO

-- =============================================
-- FIX BUG: Chuyển đổi Xóa cứng (Hard Delete) sang Xóa mềm (Soft Delete) Nhân viên
-- =============================================
CREATE OR ALTER PROCEDURE dbo.usp_Local_XoaNhanVien
    @MaNV VARCHAR(50),
    @ChiNhanh VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    IF NULLIF(LTRIM(RTRIM(@MaNV)), '') IS NULL
        THROW 50000, N'Mã nhân viên không được để trống!', 1;

    -- Kiểm tra nhân viên có tồn tại và đang làm việc không
    DECLARE @TrangThaiHienTai BIT;
    SELECT @TrangThaiHienTai = TrangThai FROM dbo.NhanVien WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    IF @TrangThaiHienTai IS NULL
        THROW 50001, N'Không tìm thấy nhân viên để xóa!', 1;
        
    IF @TrangThaiHienTai = 0
        THROW 50002, N'Nhân viên này đã nghỉ việc từ trước!', 1;

    -- XÓA MỀM (Chuyển trạng thái = 0 thay vì DELETE)
    UPDATE dbo.NhanVien
    SET TrangThai = 0
    WHERE MaNV = @MaNV AND ChiNhanh = @ChiNhanh;

    SELECT CAST(1 AS BIT) AS deleted, @MaNV AS MaNV;
END;
GO
