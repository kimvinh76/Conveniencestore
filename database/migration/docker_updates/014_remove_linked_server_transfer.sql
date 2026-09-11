-- ==========================================================
-- BƯỚC 5: XÓA BỎ LINKED SERVER TRONG ĐIỀU CHUYỂN KHO
-- Thay vì 1 SP chứa Linked Server kết nối từ xa, ta chia làm 3 SP Local
-- để Message Queue gọi độc lập trên từng Server.
-- ==========================================================

USE CentralDB;
GO

-- 1. SP Update tồn kho lưu vết tại CENTRAL (Không dùng Linked Server)
CREATE OR ALTER PROCEDURE dbo.usp_Central_DieuChuyenKho_NoLinkedServer
    @TuChiNhanh VARCHAR(10),
    @DenChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @MaPhieu VARCHAR(50) = 'DC_' + CONVERT(VARCHAR, GETDATE(), 112) + '_' + CAST(DATEDIFF(s, '1970-01-01', GETUTCDATE()) AS VARCHAR);

        -- 1. Trừ tồn kho tại Chi nhánh xuất (Nhưng lưu trên CentralDB)
        UPDATE tk
        SET tk.SoLuongTon = tk.SoLuongTon - j.SoLuong
        FROM dbo.TonKho tk
        INNER JOIN OPENJSON(@ItemsJson)
          WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
          ON tk.MaSP = j.MaSP
        WHERE tk.ChiNhanh = @TuChiNhanh;

        -- 2. Cộng tồn kho tại Chi nhánh nhận (Lưu trên CentralDB)
        UPDATE tk
        SET tk.SoLuongTon = tk.SoLuongTon + j.SoLuong
        FROM dbo.TonKho tk
        INNER JOIN OPENJSON(@ItemsJson)
          WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
          ON tk.MaSP = j.MaSP
        WHERE tk.ChiNhanh = @DenChiNhanh;

        -- Nếu chưa có dòng Tồn kho ở Chi nhánh nhận, Insert mới
        INSERT INTO dbo.TonKho (ChiNhanh, MaSP, SoLuongTon, NguoiCapNhat)
        SELECT @DenChiNhanh, j.MaSP, j.SoLuong, @NguoiChuyen
        FROM OPENJSON(@ItemsJson)
          WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.TonKho WHERE ChiNhanh = @DenChiNhanh AND MaSP = j.MaSP
        );

        -- 3. Ghi Log Lịch sử (Optional - Dùng chung bảng nào đó hoặc bỏ qua)
        -- Tạm thời bỏ qua phần ghi log Lịch sử Điều Chuyển vì phức tạp và không bắt buộc theo design cũ.

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 2. Dành cho các Store Nhánh (HANOI, HUE, SAIGON)
-- (Tạo ra trên mọi DB để tiện gọi từ Node.js)
-- ==========================================================

USE Store_HN;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Branch_XuatChuyenKho
    @DenChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Trừ tồn kho tại kho xuất
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Branch_NhapChuyenKho
    @TuChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- Cộng tồn kho tại kho nhận
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon + j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;

    INSERT INTO dbo.TonKho (ChiNhanh, MaSP, SoLuongTon, NguoiCapNhat)
    SELECT 'LOCAL', j.MaSP, j.SoLuong, @NguoiChuyen
    FROM OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.TonKho WHERE MaSP = j.MaSP
    );
END;
GO

-- Copy cho Store_H và Store_SG
USE Store_H;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Branch_XuatChuyenKho
    @DenChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Branch_NhapChuyenKho
    @TuChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon + j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;
    INSERT INTO dbo.TonKho (ChiNhanh, MaSP, SoLuongTon, NguoiCapNhat)
    SELECT 'LOCAL', j.MaSP, j.SoLuong, @NguoiChuyen
    FROM OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
    WHERE NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = j.MaSP);
END;
GO

USE Store_SG;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Branch_XuatChuyenKho
    @DenChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon - j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_Branch_NhapChuyenKho
    @TuChiNhanh VARCHAR(10),
    @ItemsJson NVARCHAR(MAX),
    @NguoiChuyen VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tk
    SET tk.SoLuongTon = tk.SoLuongTon + j.SoLuong
    FROM dbo.TonKho tk
    INNER JOIN OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
      ON tk.MaSP = j.MaSP;
    INSERT INTO dbo.TonKho (ChiNhanh, MaSP, SoLuongTon, NguoiCapNhat)
    SELECT 'LOCAL', j.MaSP, j.SoLuong, @NguoiChuyen
    FROM OPENJSON(@ItemsJson)
      WITH (MaSP VARCHAR(50) '$.productCode', SoLuong INT '$.quantity') j
    WHERE NOT EXISTS (SELECT 1 FROM dbo.TonKho WHERE MaSP = j.MaSP);
END;
GO
