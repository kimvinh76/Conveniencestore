const { getPool } = require("../db/sqlserver");
const mssql = require("mssql");

class PurchaseReceiptService {
  async getReceipts(branch) {
    const pool = await getPool(branch);
    const result = await pool.request().execute("dbo.usp_Local_DanhSachPhieuNhap");
    return result.recordset;
  }

  async getReceiptDetails(branch, maPN) {
    const pool = await getPool(branch);
    const result = await pool
      .request()
      .input("MaPN", mssql.VarChar, maPN)
      .execute("dbo.usp_Local_DanhSachChiTietPhieuNhap");
    return result.recordset;
  }


  async createReceipt(branch, data) {
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

    return { message: "Tạo phiếu nhập thành công" };
  }
}

module.exports = new PurchaseReceiptService();
