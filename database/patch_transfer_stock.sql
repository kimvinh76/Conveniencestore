USE [DDBMS]
GO

-- =============================================
-- 1. TẠO BẢNG LƯU VẾT CHUYỂN KHO (Chỉ chạy ở Server Central)
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PhieuChuyenKho]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PhieuChuyenKho](
        [MaPCK] [varchar](50) NOT NULL,
        [TuChiNhanh] [varchar](10) NOT NULL,
        [DenChiNhanh] [varchar](10) NOT NULL,
        [NgayChuyen] [datetime2](7) NOT NULL DEFAULT GETDATE(),
        [NguoiChuyen] [varchar](50) NULL,
        [GhiChu] [nvarchar](255) NULL,
        CONSTRAINT [PK_PhieuChuyenKho] PRIMARY KEY CLUSTERED ([MaPCK] ASC)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChiTietChuyenKho]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ChiTietChuyenKho](
        [MaPCK] [varchar](50) NOT NULL,
        [MaSP] [varchar](50) NOT NULL,
        [SoLuongChuyen] [int] NOT NULL,
        CONSTRAINT [PK_ChiTietChuyenKho] PRIMARY KEY CLUSTERED ([MaPCK] ASC, [MaSP] ASC),
        CONSTRAINT [FK_ChiTietChuyenKho_Phieu] FOREIGN KEY ([MaPCK]) REFERENCES [dbo].[PhieuChuyenKho] ([MaPCK])
    );
END
GO

-- =============================================
-- 2. CẬP NHẬT STORE PROCEDURE ĐIỀU CHUYỂN KHO 
-- Bổ sung Insert vào bảng lưu vết trước khi cập nhật Tồn kho
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DieuChuyenKho]
    @TuChiNhanh VARCHAR(10),
    @DenChiNhanh VARCHAR(10),
    @MaSP VARCHAR(50),
    @SoLuongChuyen INT,
    @NguoiChuyen VARCHAR(50) = 'SYSTEM'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 
	
    SET @TuChiNhanh = LTRIM(RTRIM(ISNULL(@TuChiNhanh, '')));
    SET @DenChiNhanh = LTRIM(RTRIM(ISNULL(@DenChiNhanh, '')));
    SET @MaSP = LTRIM(RTRIM(ISNULL(@MaSP, '')));
    
    -- 1. Validate dữ liệu đầu vào
    IF @TuChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI') OR @DenChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI')
        THROW 50000, N'Chi nhánh điều chuyển không hợp lệ!', 1;

    IF @TuChiNhanh = @DenChiNhanh
        THROW 50000, N'Chi nhánh xuất và nhập không được trùng nhau!', 1;

    IF NULLIF(LTRIM(RTRIM(@MaSP)), '') IS NULL
        THROW 50000, N'Mã sản phẩm không được để trống!', 1;

    IF @SoLuongChuyen <= 0
        THROW 50001, N'Số lượng điều chuyển phải lớn hơn 0!', 1;

    -- 2. Ánh xạ tên Linked Server và Database tương ứng
    DECLARE @SrcServer NVARCHAR(50), @SrcDB NVARCHAR(50);
    DECLARE @DestServer NVARCHAR(50), @DestDB NVARCHAR(50);

    -- Máy chủ Nguồn (TuChiNhanh)
    IF @TuChiNhanh = 'HUE' BEGIN SET @SrcServer = 'HUE_SERVER'; SET @SrcDB = 'Store_H'; END
    ELSE IF @TuChiNhanh = 'SAIGON' BEGIN SET @SrcServer = 'SG_SERVER'; SET @SrcDB = 'Store_SG'; END
    ELSE IF @TuChiNhanh = 'HANOI' BEGIN SET @SrcServer = 'HN_SERVER'; SET @SrcDB = 'Store_HN'; END

    -- Máy chủ Đích (DenChiNhanh)
    IF @DenChiNhanh = 'HUE' BEGIN SET @DestServer = 'HUE_SERVER'; SET @DestDB = 'Store_H'; END
    ELSE IF @DenChiNhanh = 'SAIGON' BEGIN SET @DestServer = 'SG_SERVER'; SET @DestDB = 'Store_SG'; END
    ELSE IF @DenChiNhanh = 'HANOI' BEGIN SET @DestServer = 'HN_SERVER'; SET @DestDB = 'Store_HN'; END

    -- 3. Kiểm tra tồn kho tại máy chủ nguồn qua Linked Server
    DECLARE @SQL_Check NVARCHAR(MAX);
    DECLARE @TonKhoHienTai INT;
    
    SET @SQL_Check = N'SELECT @TonKhoOut = SoLuongTon FROM [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
    
    EXEC sp_executesql 
        @stmt = @SQL_Check, 
        @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @TonKhoOut INT OUTPUT', 
        @p_MaSP = @MaSP, 
        @p_ChiNhanh = @TuChiNhanh,
        @TonKhoOut = @TonKhoHienTai OUTPUT;

    IF @TonKhoHienTai IS NULL
        THROW 50002, N'Sản phẩm không tồn tại trong kho nguồn!', 1;

    IF @TonKhoHienTai < @SoLuongChuyen
        THROW 50003, N'Số lượng tồn kho không đủ để điều chuyển!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 4. Sinh Mã Phiếu Chuyển Kho tự động (Format: PCK-YYYYMMDD-HHMMSS)
        DECLARE @MaPCK VARCHAR(50) = 'PCK-' + FORMAT(GETDATE(), 'yyyyMMdd-HHmmss');

        -- 5. LƯU VẾT VÀO CENTRAL (Bảng PhieuChuyenKho và ChiTietChuyenKho)
        INSERT INTO [dbo].[PhieuChuyenKho] (MaPCK, TuChiNhanh, DenChiNhanh, NgayChuyen, NguoiChuyen, GhiChu)
        VALUES (@MaPCK, @TuChiNhanh, @DenChiNhanh, GETDATE(), @NguoiChuyen, N'Điều chuyển nội bộ');

        INSERT INTO [dbo].[ChiTietChuyenKho] (MaPCK, MaSP, SoLuongChuyen)
        VALUES (@MaPCK, @MaSP, @SoLuongChuyen);

        -- 6. THỰC THI GIAO DỊCH PHÂN TÁN (Trừ kho Nguồn, Cộng kho Đích)
        DECLARE @SQL_Update NVARCHAR(MAX);

        -- Cập nhật kho nguồn (Trừ số lượng)
        SET @SQL_Update = N'UPDATE [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon - @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
        EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @TuChiNhanh, @p_SoLuong = @SoLuongChuyen;

        -- Cập nhật kho đích (Cộng số lượng, nếu chưa có thì Insert)
        -- LƯU Ý: Phải kiểm tra xem kho đích đã có dòng sản phẩm này chưa
        SET @SQL_Update = N'
            IF EXISTS(SELECT 1 FROM [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh)
                UPDATE [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon + @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh;
            ELSE
                INSERT INTO [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@p_MaSP, @p_SoLuong, @p_ChiNhanh);
        ';
        EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @DenChiNhanh, @p_SoLuong = @SoLuongChuyen;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
