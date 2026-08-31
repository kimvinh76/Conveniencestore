const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Local_DanhSachTonKho",
  transfer: "dbo.usp_Central_DieuChuyenKho"
};

async function listInventory(branch) {


  const pool = await getPool(branch);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset.map(row => ({
    branch: branch,
    productCode: row.MaSP,
    quantity: Number(row.SoLuongTon || 0)
  }));
}



async function transferStockDistributed(payload) {
  if (isMockMode()) return mock.transferStock(payload);
  const pool = await getPool("CENTRAL"); // Transaction phân tán gọi từ Central
  const { fromBranch, toBranch, items, nguoiChuyen } = payload;
  const itemsJson = JSON.stringify(items);

  await pool.request()
    .input("TuChiNhanh", sql.VarChar(10), fromBranch)
    .input("DenChiNhanh", sql.VarChar(10), toBranch)
    .input("ItemsJson", sql.NVarChar(sql.MAX), itemsJson)
    .input("NguoiChuyen", sql.VarChar(50), nguoiChuyen || 'SYSTEM')
    .execute(PROCS.transfer);

  return {
    status: "SUCCESS",
    fromBranch,
    toBranch,
    items,
    nguoiChuyen,
    timestamp: new Date().toISOString()
  };
}

module.exports = { listInventory, transferStockDistributed };