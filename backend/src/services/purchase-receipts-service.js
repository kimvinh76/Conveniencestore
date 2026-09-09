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
      
      // Gọi Stored Procedure để lưu Phiếu Nhập và tự động CỘNG Tồn Kho tại Central
      await centralPool.request()
        .input("MaPN", mssql.VarChar(50), data.maPN)
        .input("ChiNhanhLap", mssql.VarChar(10), branch)
        .input("GhiChu", mssql.NVarChar(255), data.ghiChu || null)
        .input("MaNCC", mssql.VarChar(50), data.maNCC || null)
        .input("ItemsJson", mssql.NVarChar(mssql.MAX), itemsJson)
        .execute("dbo.usp_Central_DongBoPhieuNhap");
        
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
