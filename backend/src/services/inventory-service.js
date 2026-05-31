const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Local_DanhSachTonKho",
  update: "dbo.usp_Local_CapNhatTonKhoTongQuat",
  transfer: "dbo.usp_Central_DieuChuyenKho"
};

async function listInventory(branch) {
  if (isMockMode()) return mock.listInventory(branch);
  const pool = await getPool(branch);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset.map(row => ({
    productCode: row.MaSP,
    quantity: Number(row.SoLuongTon || 0)
  }));
}

async function updateInventoryItem(branch, productCode, quantity) {
  if (isMockMode()) return mock.updateInventoryItem(branch, productCode, quantity);
  const pool = await getPool(branch);
  await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("SoLuongTonMoi", sql.Int, quantity)
    .input("ChiNhanhLap", sql.VarChar(10), branch)
    .execute(PROCS.update);
  return { branch, productCode, quantity };
}

async function transferStockDistributed(payload) {
  if (isMockMode()) return mock.transferStock(payload);
  const pool = await getPool("CENTRAL"); // Transaction phân tán gọi từ Central
  const { fromBranch, toBranch, productCode, quantity } = payload;

  await pool.request()
    .input("TuChiNhanh", sql.VarChar(10), fromBranch)
    .input("DenChiNhanh", sql.VarChar(10), toBranch)
    .input("MaSP", sql.VarChar(50), productCode)
    .input("SoLuongChuyen", sql.Int, quantity)
    .execute(PROCS.transfer);

  return {
    status: "SUCCESS",
    fromBranch,
    toBranch,
    productCode,
    quantity,
    timestamp: new Date().toISOString()
  };
}

module.exports = { listInventory, updateInventoryItem, transferStockDistributed };