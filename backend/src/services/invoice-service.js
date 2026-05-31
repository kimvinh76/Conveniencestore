const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Local_DanhSachHoaDon",
  details: "dbo.usp_Local_ChiTietHoaDon",
  create: "dbo.usp_Local_TaoHoaDonNhieuDong"
};

async function listInvoicesByBranch(branch) {
  if (isMockMode()) return mock.listInvoicesByBranch(branch);
  const pool = await getPool(branch);
  const result = await pool.request().execute(PROCS.list);
  return result.recordset;
}

async function getInvoiceDetails(branch, invoiceId) {
  if (isMockMode()) return mock.getInvoiceDetailsLocal(branch, invoiceId);
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("MaHD", sql.VarChar(50), invoiceId)
    .execute(PROCS.details);
  return result.recordset;
}

async function createInvoice(payload) {
  if (isMockMode()) return mock.createInvoiceLocal(payload);
  const { branch, employeeId, items, note } = payload;
  const pool = await getPool(branch);
  const maHD = `HD_${Date.now()}`;

  // Chuẩn bị JSON cho Procedure xử lý nhiều dòng (Atomicity)
  const itemsPayload = items.map(it => ({
    MaSP: it.productCode,
    SoLuong: it.quantity,
    DonGia: it.unitPrice
  }));

  await pool.request()
    .input("MaHD", sql.VarChar(50), maHD)
    .input("MaNV", sql.VarChar(50), employeeId)
    .input("GhiChu", sql.NVarChar(255), note)
    .input("ChiNhanhLap", sql.VarChar(10), branch)
    .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(itemsPayload))
    .execute(PROCS.create);

  return { maHD, branch, totalAmount: payload.totalAmount };
}

module.exports = { listInvoicesByBranch, getInvoiceDetails, createInvoice };