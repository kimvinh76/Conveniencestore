const { sql, getPool } = require("../db/sqlserver");
const { publishEvent } = require("../utils/rabbitmq");

const PROCS = {
  list: "dbo.usp_Chung_DanhSachKhachHang",
  create: "dbo.usp_Local_ThemKhachHang",
  update: "dbo.usp_Local_CapNhatKhachHang"
};

async function searchCustomers(branch, query) {
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("SearchTerm", sql.NVarChar(100), query || null)
    .execute(PROCS.list);
  return result.recordset || [];
}

async function createCustomer(branch, data) {
  // Bỏ qua điểm tích lũy, hệ thống luôn khởi tạo = 0
  const { customerId, fullName, phoneNumber, branchId } = data;
  const pool = await getPool(branch);
  const req = pool.request()
    .input("MaKH", sql.VarChar(50), customerId)
    .input("HoTen", sql.NVarChar(120), fullName)
    .input("SoDienThoai", sql.VarChar(15), phoneNumber || null)
    .input("ChiNhanhDK", sql.VarChar(10), branchId);
  
  await req.execute(PROCS.create); // Execute standard create on origin (Local Branch)

  // Publish event to queue for other branches to pick up
  await publishEvent("master_data_sync", {
    event: "customer.created",
    data: { customerId, fullName, phoneNumber, branchId, originBranch: branch }
  });

  return { customerId, fullName, phoneNumber, branchId };
}

async function updateCustomer(branch, customerId, data) {
  // KHÔNG có cập nhật điểm tích lũy ở đây!
  const { fullName, phoneNumber } = data;
  const pool = await getPool(branch);

  await pool.request()
    .input("MaKH", sql.VarChar(50), customerId)
    .input("HoTen", sql.NVarChar(120), fullName)
    .input("SoDienThoai", sql.VarChar(15), phoneNumber || null)
    .execute(PROCS.update);

  // Sync to other branches via MQ
  await publishEvent("master_data_sync", {
    event: "customer.updated",
    data: { customerId, fullName, phoneNumber, originBranch: branch }
  });

  return { customerId, updated: true };
}

module.exports = {
  searchCustomers,
  createCustomer,
  updateCustomer
};
