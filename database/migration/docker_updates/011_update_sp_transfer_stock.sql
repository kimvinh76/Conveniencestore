-- File: 011_update_sp_transfer_stock.sql
-- Description: Cập nhật SP Điều chuyển kho để ghi nhận sự thay đổi số lượng tồn kho trên chính DB Central

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE [dbo].[usp_Central_DieuChuyenKho]
    @TuChiNhanh VARCHAR(10),
    @DenChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50) = 'SYSTEM'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; 
	
    SET @TuChiNhanh = LTRIM(RTRIM(ISNULL(@TuChiNhanh, '')));
    SET @DenChiNhanh = LTRIM(RTRIM(ISNULL(@DenChiNhanh, '')));
    
    -- 1. Validate dữ liệu đầu vào
    IF @TuChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI') OR @DenChiNhanh NOT IN ('HUE', 'SAIGON', 'HANOI')
        THROW 50000, N'Chi nhánh điều chuyển không hợp lệ!', 1;

    IF @TuChiNhanh = @DenChiNhanh
        THROW 50000, N'Chi nhánh xuất và nhập không được trùng nhau!', 1;

    IF ISJSON(@ItemsJson) = 0 OR @ItemsJson IS NULL
        THROW 50000, N'Dữ liệu sản phẩm (JSON) không hợp lệ!', 1;

    -- 2. Ánh xạ tên Linked Server và Database tương ứng
    DECLARE @SrcServer NVARCHAR(50), @SrcDB NVARCHAR(50);
    DECLARE @DestServer NVARCHAR(50), @DestDB NVARCHAR(50);

    IF @TuChiNhanh = 'HUE' BEGIN SET @SrcServer = 'HUE_SERVER'; SET @SrcDB = 'Store_H'; END
    ELSE IF @TuChiNhanh = 'SAIGON' BEGIN SET @SrcServer = 'SG_SERVER'; SET @SrcDB = 'Store_SG'; END
    ELSE IF @TuChiNhanh = 'HANOI' BEGIN SET @SrcServer = 'HN_SERVER'; SET @SrcDB = 'Store_HN'; END

    IF @DenChiNhanh = 'HUE' BEGIN SET @DestServer = 'HUE_SERVER'; SET @DestDB = 'Store_H'; END
    ELSE IF @DenChiNhanh = 'SAIGON' BEGIN SET @DestServer = 'SG_SERVER'; SET @DestDB = 'Store_SG'; END
    ELSE IF @DenChiNhanh = 'HANOI' BEGIN SET @DestServer = 'HN_SERVER'; SET @DestDB = 'Store_HN'; END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lấy danh sách sản phẩm từ JSON lưu vào bảng tạm
        CREATE TABLE #TempItems (
            MaSP VARCHAR(50),
            SoLuongChuyen INT
        );

        INSERT INTO #TempItems (MaSP, SoLuongChuyen)
        SELECT 
            MaSP, 
            SoLuongChuyen 
        FROM OPENJSON(@ItemsJson)
        WITH (
            MaSP VARCHAR(50) '$.productCode',
            SoLuongChuyen INT '$.quantity'
        );

        -- Validate số lượng
        IF EXISTS (SELECT 1 FROM #TempItems WHERE SoLuongChuyen <= 0)
            THROW 50001, N'Có sản phẩm có số lượng điều chuyển <= 0!', 1;

        IF NOT EXISTS (SELECT 1 FROM #TempItems)
            THROW 50001, N'Không có sản phẩm nào để điều chuyển!', 1;

        -- 3. Kiểm tra tồn kho tại máy chủ nguồn qua Linked Server
        DECLARE @MaSP VARCHAR(50);
        DECLARE @SoLuongChuyen INT;
        DECLARE @SQL_Check NVARCHAR(MAX);
        DECLARE @TonKhoHienTai INT;
        
        DECLARE item_cursor CURSOR FOR SELECT MaSP, SoLuongChuyen FROM #TempItems;
        OPEN item_cursor;
        FETCH NEXT FROM item_cursor INTO @MaSP, @SoLuongChuyen;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @SQL_Check = N'SELECT @TonKhoOut = SoLuongTon FROM [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
            
            EXEC sp_executesql 
                @stmt = @SQL_Check, 
                @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @TonKhoOut INT OUTPUT', 
                @p_MaSP = @MaSP, 
                @p_ChiNhanh = @TuChiNhanh,
                @TonKhoOut = @TonKhoHienTai OUTPUT;

            IF @TonKhoHienTai IS NULL
            BEGIN
                DECLARE @ErrMsg1 NVARCHAR(100) = N'Sản phẩm ' + @MaSP + N' không tồn tại trong kho nguồn!';
                THROW 50002, @ErrMsg1, 1;
            END

            IF @TonKhoHienTai < @SoLuongChuyen
            BEGIN
                DECLARE @ErrMsg2 NVARCHAR(100) = N'Số lượng tồn kho không đủ để điều chuyển sản phẩm ' + @MaSP + '!';
                THROW 50003, @ErrMsg2, 1;
            END

            FETCH NEXT FROM item_cursor INTO @MaSP, @SoLuongChuyen;
        END

        CLOSE item_cursor;
        DEALLOCATE item_cursor;

        -- 4. Sinh Mã Phiếu Chuyển Kho tự động (Format: PCK-YYYYMMDD-HHMMSS)
        DECLARE @VNTime DATETIME = DATEADD(hour, 7, GETUTCDATE());
        DECLARE @MaPCK VARCHAR(50) = 'PCK-' + FORMAT(@VNTime, 'yyyyMMdd-HHmmss');

        -- 5. LƯU VẾT VÀO CENTRAL
        INSERT INTO [dbo].[PhieuChuyenKho] (MaPCK, TuChiNhanh, DenChiNhanh, NgayChuyen, NguoiChuyen, GhiChu)
        VALUES (@MaPCK, @TuChiNhanh, @DenChiNhanh, @VNTime, @NguoiChuyen, N'Điều chuyển nội bộ');

        INSERT INTO [dbo].[ChiTietChuyenKho] (MaPCK, MaSP, SoLuongChuyen)
        SELECT @MaPCK, MaSP, SoLuongChuyen FROM #TempItems;

        -- 6. THỰC THI GIAO DỊCH PHÂN TÁN (Trừ kho Nguồn, Cộng kho Đích thông qua Linked Server)
        DECLARE @SQL_Update NVARCHAR(MAX);

        DECLARE update_cursor CURSOR FOR SELECT MaSP, SoLuongChuyen FROM #TempItems;
        OPEN update_cursor;
        FETCH NEXT FROM update_cursor INTO @MaSP, @SoLuongChuyen;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Cập nhật kho nguồn (Trừ số lượng trên DB Nhánh Nguồn)
            SET @SQL_Update = N'UPDATE [' + @SrcServer + '].[' + @SrcDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon - @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh';
            EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @TuChiNhanh, @p_SoLuong = @SoLuongChuyen;

            -- Cập nhật kho đích (Cộng số lượng trên DB Nhánh Đích, nếu chưa có thì Insert)
            SET @SQL_Update = N'
                IF EXISTS(SELECT 1 FROM [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh)
                    UPDATE [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho SET SoLuongTon = SoLuongTon + @p_SoLuong WHERE MaSP = @p_MaSP AND ChiNhanh = @p_ChiNhanh;
                ELSE
                    INSERT INTO [' + @DestServer + '].[' + @DestDB + '].dbo.TonKho (MaSP, SoLuongTon, ChiNhanh) VALUES (@p_MaSP, @p_SoLuong, @p_ChiNhanh);
            ';
            EXEC sp_executesql @stmt = @SQL_Update, @params = N'@p_MaSP VARCHAR(50), @p_ChiNhanh VARCHAR(10), @p_SoLuong INT', @p_MaSP = @MaSP, @p_ChiNhanh = @DenChiNhanh, @p_SoLuong = @SoLuongChuyen;

            FETCH NEXT FROM update_cursor INTO @MaSP, @SoLuongChuyen;
        END
        
        CLOSE update_cursor;
        DEALLOCATE update_cursor;

        -- [BỔ SUNG VÀO BẢN VÁ 011]: 7. CẬP NHẬT TỒN KHO TẠI CENTRAL (Đồng bộ số lượng Tồn kho)
        -- Trừ kho Nguồn trên Central
        UPDATE tk SET tk.SoLuongTon = tk.SoLuongTon - a.SoLuongChuyen
        FROM dbo.TonKho tk INNER JOIN #TempItems a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @TuChiNhanh;

        -- Cộng kho Đích trên Central
        UPDATE tk SET tk.SoLuongTon = tk.SoLuongTon + a.SoLuongChuyen
        FROM dbo.TonKho tk INNER JOIN #TempItems a ON tk.MaSP = a.MaSP
        WHERE tk.ChiNhanh = @DenChiNhanh;
        
        -- Insert nếu kho đích trên Central chưa từng có mã này
        INSERT INTO dbo.TonKho (MaSP, ChiNhanh, SoLuongTon)
        SELECT a.MaSP, @DenChiNhanh, a.SoLuongChuyen
        FROM #TempItems a
        LEFT JOIN dbo.TonKho tk ON a.MaSP = tk.MaSP AND tk.ChiNhanh = @DenChiNhanh
        WHERE tk.MaSP IS NULL;

        DROP TABLE #TempItems;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
