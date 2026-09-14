const { sql, getPool } = require("../db/sqlserver");
const { publishEvent } = require("../utils/rabbitmq");

const PROCS = {
  list: "dbo.usp_Chung_DanhSachHangHoaKemTonKho",
  byCode: "dbo.usp_Chung_HangHoaTheoMaSP",
  create: "dbo.usp_Central_ThemHangHoaMoi",
  update: "dbo.usp_Central_CapNhatHangHoa",
  delete: "dbo.usp_Central_XoaHangHoa"
};

async function listProducts(branch) {
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("ChiNhanh", sql.VarChar(10), branch)
    .execute(PROCS.list);
  return result.recordset;
}

async function getProductByCode(branch, productCode) {
  const pool = await getPool(branch);
  const rs = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .execute(PROCS.byCode);
  const row = rs.recordset[0];
  return row ? {
    branch,
    productCode: row.MaSP,
    productName: row.TenHang,
    unitPrice: Number(row.Gia || 0),
    description: row.MoTa,
    imageUrl: row.AnhSanPham,
    unit: row.DonViTinh,
    active: row.TrangThai !== undefined ? Boolean(row.TrangThai) : true,
    categoryCode: row.MaDM,
    categoryName: row.TenDM,
    brandCode: row.MaTH,
    brandName: row.TenTH,
    barcode: row.Barcode
  } : null;
}

async function createProduct(payload) {
  const { productCode, productName, unitPrice, description, imageUrl, unit, categoryCode, brandCode, barcode } = payload;
  
  // 1. Thực thi SP trên Central để tạo Sản phẩm và Tồn kho mặc định (cho cả 3 chi nhánh tại CentralDB)
  const poolCentral = await getPool("CENTRAL");
  await poolCentral.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("TenHang", sql.NVarChar(100), productName)
    .input("Gia", sql.Decimal(10, 2), unitPrice)
    .input("MoTa", sql.NVarChar(500), description || null)
    .input("AnhSanPham", sql.VarChar(255), imageUrl || null)
    .input("DonViTinh", sql.NVarChar(50), unit || null)
    .input("MaDM", sql.VarChar(20), categoryCode || null)
    .input("MaTH", sql.VarChar(20), brandCode || null)
    .input("Barcode", sql.VarChar(50), barcode || null)
    .execute(PROCS.create);

  // 2. Publish event to Message Queue
  await publishEvent("master_data_sync", {
    event: "product.created",
    data: payload
  });

  return { productCode, productName, unitPrice, description, imageUrl, unit, categoryCode, brandCode, barcode };
}

async function updateProduct(productCode, payload) {
  const { productName, unitPrice, description, imageUrl, unit, active, categoryCode, brandCode, barcode } = payload;
  
  const poolCentral = await getPool("CENTRAL");
  await poolCentral.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("TenHang", sql.NVarChar(100), productName)
    .input("Gia", sql.Decimal(10, 2), unitPrice)
    .input("MoTa", sql.NVarChar(500), description || null)
    .input("AnhSanPham", sql.VarChar(255), imageUrl || null)
    .input("DonViTinh", sql.NVarChar(50), unit || null)
    .input("MaDM", sql.VarChar(20), categoryCode || null)
    .input("MaTH", sql.VarChar(20), brandCode || null)
    .input("Barcode", sql.VarChar(50), barcode || null)
    .input("TrangThai", sql.Int, active === undefined ? null : (active ? 1 : 0))
    .execute(PROCS.update);

  await publishEvent("master_data_sync", {
    event: "product.updated",
    data: { productCode, ...payload }
  });

  return { productCode, ...payload };
}

async function toggleProductStatus(productCode, active) {
  const pool = await getPool("CENTRAL");
  await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("TrangThai", sql.Bit, active ? 1 : 0)
    .execute(PROCS.update);

  await publishEvent("master_data_sync", {
    event: "product.status_toggled",
    data: { productCode, active }
  });

  return { message: "Status updated" };
}

module.exports = {
  listProducts,
  getProductByCode,
  createProduct,
  updateProduct,
  toggleProductStatus
};