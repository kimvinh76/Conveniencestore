const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");
const { publishEvent } = require("../utils/rabbitmq");

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
  const { fromBranch, toBranch, items, nguoiChuyen } = payload;
  const itemsJson = JSON.stringify(items);
  
  // We do NOT call `dbo.usp_Central_DieuChuyenKho` via Linked Server anymore.
  // Instead, publish an event to MQ. The worker will handle executing local SPs on each DB.
  await publishEvent("inventory_transfer", {
    event: "inventory.transfer",
    data: {
      fromBranch,
      toBranch,
      itemsJson,
      nguoiChuyen: nguoiChuyen || 'SYSTEM'
    }
  });

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