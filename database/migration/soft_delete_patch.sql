-- ==========================================================
-- SCRIPT CẬP NHẬT DATABASE CHO TÍNH NĂNG XÓA MỀM (SOFT DELETE)
-- (BẢN FULL GIỮ NGUYÊN LOGIC VALIDATE VÀ TRANSACTION CŨ)
-- ==========================================================
-- Hướng dẫn sử dụng nếu bạn không muốn xóa volume Docker:
-- 1. Chạy phần 1 trên toàn bộ các Database (CentralDB, Store_HN, Store_H, Store_SG)
-- 2. Chạy phần 2, 3, 4 trên Database nào chứa Store Procedure tương ứng.
-- ==========================================================


-- ==========================================================
-- 1. THÊM CỘT TRANG THÁI VÀO BẢNG HÀNG HÓA
-- ==========================================================
ALTER TABLE dbo.HangHoa
ADD TrangThai BIT NOT NULL DEFAULT 1;
GO

-- ==========================================================
-- 2. CẬP NHẬT STORE XÓA SẢN PHẨM (Chạy trên CentralDB)
-- (Giữ nguyên Validate, sửa DELETE thành UPDATE)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_Central_XoaHangHoa]
    @MaSP VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50001, N'Không tìm thấy sản phẩm để xóa!', 1;


    BEGIN TRY
        BEGIN TRANSACTION;

   

        -- Thay vì DELETE FROM dbo.HangHoa, ta cập nhật TrangThai
        UPDATE dbo.HangHoa SET TrangThai = 0 WHERE MaSP = @MaSP;

        COMMIT TRANSACTION;

        SELECT CAST(1 AS BIT) AS deleted, @MaSP AS productCode;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ==========================================================
-- 3. CẬP NHẬT STORE LẤY DANH SÁCH (Chạy trên tất cả các DB)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_Chung_DanhSachHangHoa]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaSP AS productCode,
        TenHang AS productName,
        CAST(Gia AS DECIMAL(10,2)) AS unitPrice,
        MoTa AS description,         
        AnhSanPham AS imageUrl,       
        DonViTinh AS unit            
    FROM dbo.HangHoa
    
    ORDER BY MaSP;
END;
GO

-- ==========================================================
-- 4. CẬP NHẬT STORE THÊM MỚI SẢN PHẨM (Chạy trên CentralDB)
-- (Giữ nguyên toàn bộ logic thêm Tồn Kho cho 3 chi nhánh)
-- ==========================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[usp_Central_ThemHangHoaMoi]
    @MaSP VARCHAR(50),
    @TenHang NVARCHAR(100),
    @Gia DECIMAL(10,2),
    @MoTa NVARCHAR(500) = NULL,
    @AnhSanPham VARCHAR(255) = NULL,
    @DonViTinh NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF NULLIF(LTRIM(RTRIM(@TenHang)), '') IS NULL
        THROW 50000, N'Tên hàng không được để trống!', 1;

    IF @Gia <= 0
        THROW 50000, N'Giá bán phải lớn hơn 0!', 1;

    IF EXISTS (SELECT 1 FROM dbo.HangHoa WHERE MaSP = @MaSP)
        THROW 50000, N'Mã sản phẩm đã tồn tại tại Server Gốc!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Đã bổ sung cột TrangThai = 1
        INSERT INTO dbo.HangHoa (MaSP, TenHang, Gia, MoTa, AnhSanPham, DonViTinh, TrangThai)
        VALUES (@MaSP, @TenHang, @Gia, @MoTa, @AnhSanPham, @DonViTinh, 1);

        -- Chèn Tồn Kho ban đầu (Số lượng = 0) cho 3 Chi nhánh
        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HUE')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HUE');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'SAIGON')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'SAIGON');

        IF NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = 'HANOI')
            INSERT INTO dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@MaSP, 0, 'HANOI');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
