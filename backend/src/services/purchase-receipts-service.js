const { getPool } = require("../db/sqlserver");
const mssql = require("mssql");

async function getReceipts(branch) {
    const pool = await getPool(branch);
    const result = await pool.request().execute("dbo.usp_Local_DanhSachPhieuNhap");
    return result.recordset;
  }

async function getReceiptDetails(branch, maPN) {
    const pool = await getPool(branch);
    const result = await pool
      .request()
      .input("MaPN", mssql.VarChar, maPN)
      .execute("dbo.usp_Local_DanhSachChiTietPhieuNhap");
    return result.recordset;
  }


async function createReceipt(branch, data) {
    const pool = await getPool(branch);
    // data.items must be an array of objects
    const itemsJson = JSON.stringify(data.items);


    const result = await pool
      .request()
      .input("MaPN", mssql.VarChar, data.maPN)
      .input("GhiChu", mssql.NVarChar, data.ghiChu || null)
      .input("ChiNhanhLap", mssql.VarChar, branch)
      .input("MaNCC", mssql.VarChar, data.maNCC || null)
      .input("ItemsJson", mssql.NVarChar, itemsJson)
      .execute("dbo.usp_Local_TaoPhieuNhapNhieuDong");

    // --- REPLICATION TO CENTRALDB ---
    try {
      const centralPool = await getPool("CENTRAL");
      
      // Compute TongTien
      let tongTien = 0;
      for (const it of data.items) {
        tongTien += Number(it.quantity) * Number(it.price || 0);
      }

      // 1. Insert PhieuNhap
      await centralPool.request()
        .input("MaPN", mssql.VarChar(50), data.maPN)
        .input("NgayNhap", mssql.DateTime, new Date())
        .input("ChiNhanh", mssql.VarChar(10), branch)
        .input("TongTien", mssql.Decimal(18,2), tongTien)
        .input("GhiChu", mssql.NVarChar(255), data.ghiChu || "")
        .input("MaNCC", mssql.VarChar(50), data.maNCC || null)
        .query(`
          INSERT INTO PhieuNhap (MaPN, NgayNhap, ChiNhanh, TongTien, GhiChu, MaNCC)
          VALUES (@MaPN, @NgayNhap, @ChiNhanh, @TongTien, @GhiChu, @MaNCC)
        `);

      // 2. Insert ChiTietPhieuNhap & Update TonKho
      for (const it of data.items) {
        await centralPool.request()
          .input("MaPN", mssql.VarChar(50), data.maPN)
          .input("MaSP", mssql.VarChar(50), it.productCode)
          .input("SoLuong", mssql.Int, it.quantity)
          .input("DonGiaNhap", mssql.Decimal(18,2), it.price || 0)
          .query(`
            INSERT INTO ChiTietPhieuNhap (MaPN, MaSP, SoLuong, DonGiaNhap)
            VALUES (@MaPN, @MaSP, @SoLuong, @DonGiaNhap);
            
            IF EXISTS (SELECT 1 FROM TonKho WHERE MaSP = @MaSP AND ChiNhanh = '${branch}')
            BEGIN
              UPDATE TonKho 
              SET SoLuongTon = SoLuongTon + @SoLuong 
              WHERE MaSP = @MaSP AND ChiNhanh = '${branch}';
            END
            ELSE
            BEGIN
              INSERT INTO TonKho (MaSP, ChiNhanh, SoLuongTon)
              VALUES (@MaSP, '${branch}', @SoLuong);
            END
          `);
      }
      
      console.log(`Successfully replicated receipt ${data.maPN} to CentralDB`);
    } catch (err) {
      console.error(`Replication to Central failed for ${data.maPN}:`, err.message);
    }

    return { message: "Tạo phiếu nhập thành công" };
}

module.exports = {
  getReceipts,
  getReceiptDetails,
  createReceipt
};
