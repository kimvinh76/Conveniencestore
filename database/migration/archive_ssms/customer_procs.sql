-- ==========================================================
-- STORED PROCEDURES CHO KHÁCH HÀNG
-- Chạy script này trên tất cả các Database (CentralDB, Store_HN, Store_H, Store_SG)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. LẤY DANH SÁCH & TÌM KIẾM KHÁCH HÀNG
CREATE OR ALTER PROCEDURE [dbo].[usp_Chung_DanhSachKhachHang]
    @SearchTerm NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaKH AS customerId,
        HoTen AS fullName,
        SoDienThoai AS phoneNumber,
        DiemTichLuy AS points,
        ChiNhanhDK AS branchId,
        NgayDangKy AS registeredAt
    FROM dbo.KhachHang
    WHERE (@SearchTerm IS NULL 
           OR HoTen LIKE '%' + @SearchTerm + '%'
           OR SoDienThoai LIKE '%' + @SearchTerm + '%')
    ORDER BY NgayDangKy DESC;
END;
GO

-- 2. THÊM KHÁCH HÀNG MỚI
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_ThemKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15),
    @ChiNhanhDK VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaKH)), '') IS NULL
        THROW 50000, N'Mã khách hàng không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.KhachHang WHERE SoDienThoai = @SoDienThoai)
        THROW 50001, N'Số điện thoại đã được đăng ký cho một khách hàng khác!', 1;

    IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        THROW 50002, N'Mã khách hàng đã tồn tại!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.KhachHang (MaKH, HoTen, SoDienThoai, DiemTichLuy, ChiNhanhDK, NgayDangKy)
        VALUES (@MaKH, @HoTen, @SoDienThoai, 0, @ChiNhanhDK, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. CẬP NHẬT THÔNG TIN CƠ BẢN (Không cho phép cập nhật điểm)
CREATE OR ALTER PROCEDURE [dbo].[usp_Local_CapNhatKhachHang]
    @MaKH VARCHAR(50),
    @HoTen NVARCHAR(120),
    @SoDienThoai VARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@HoTen)), '') IS NULL
        THROW 50000, N'Họ tên không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKH = @MaKH)
        THROW 50001, N'Không tìm thấy khách hàng!', 1;

    IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.KhachHang WHERE SoDienThoai = @SoDienThoai AND MaKH <> @MaKH)
        THROW 50002, N'Số điện thoại đã được sử dụng bởi khách hàng khác!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.KhachHang
        SET HoTen = @HoTen,
            SoDienThoai = @SoDienThoai
        WHERE MaKH = @MaKH;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
