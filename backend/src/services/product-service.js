const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

const PROCS = {
  list: "dbo.usp_Chung_DanhSachHangHoa",
  byCode: "dbo.usp_Chung_HangHoaTheoMaSP",
  create: "dbo.usp_Central_ThemHangHoaMoi",
  update: "dbo.usp_Central_CapNhatHangHoa",
  delete: "dbo.usp_Central_XoaHangHoa"
};

async function listProducts(branch) {
  if (isMockMode()) {
    const list = mock.listProducts();
    if (branch === "CENTRAL") return list;
    const inv = mock.listInventory(branch);
    return list.map(p => {
      const stockItem = inv.find(i => i.productCode === p.productCode);
      return { ...p, stock: stockItem ? stockItem.quantity : 0 };
    });
  }
  const pool = await getPool(branch);
  if (branch !== "CENTRAL") {
    const query = `
      SELECT 
        hh.MaSP AS productCode,
        hh.TenHang AS productName,
        CAST(hh.Gia AS DECIMAL(10,2)) AS unitPrice,
        ISNULL(tk.SoLuongTon, 0) AS stock
      FROM dbo.HangHoa hh
      LEFT JOIN dbo.TonKho tk ON tk.MaSP = hh.MaSP AND tk.ChiNhanh = @Branch
      ORDER BY hh.MaSP;
    `;
    const result = await pool.request()
      .input("Branch", sql.VarChar(10), branch)
      .query(query);
    return result.recordset;
  }
  const result = await pool.request().execute(PROCS.list);
  return result.recordset;
}

async function getProductByCode(branch, productCode) {
  if (isMockMode()) return mock.getProductByCode(branch, productCode);
  const pool = await getPool(branch);
  const rs = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .execute(PROCS.byCode);
  const row = rs.recordset[0];
  return row ? { branch, productCode: row.MaSP, productName: row.TenHang, unitPrice: Number(row.Gia || 0) } : null;
}

async function createProduct(payload) {
  if (isMockMode()) return mock.createProduct(payload);
  const pool = await getPool("CENTRAL");
  const { productCode, productName, unitPrice } = payload;
  await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("TenHang", sql.NVarChar(100), productName)
    .input("Gia", sql.Decimal(10, 2), unitPrice)
    .execute(PROCS.create);
  return { productCode, productName, unitPrice };
}

async function updateProduct(productCode, payload) {
  if (isMockMode()) return mock.updateProduct(productCode, payload);
  const pool = await getPool("CENTRAL");
  await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("TenHang", sql.NVarChar(100), payload.productName || null)
    .input("Gia", sql.Decimal(10, 2), payload.unitPrice || null)
    .execute(PROCS.update);
  return { productCode, updated: true };
}

async function deleteProduct(productCode) {
  if (isMockMode()) return mock.deleteProduct(productCode);
  const pool = await getPool("CENTRAL");
  
  // Kiểm tra ràng buộc phân tán trước khi xóa tại Server Gốc
  const branchTargets = [
    { srv: "HUE_SERVER", db: "Store_H" },
    { srv: "SG_SERVER", db: "Store_SG" },
    { srv: "HN_SERVER", db: "Store_HN" }
  ];

  for (const t of branchTargets) {
    const check = await pool.request().input("MaSP", sql.VarChar(50), productCode)
      .query(`SELECT 1 FROM [${t.srv}].[${t.db}].dbo.ChiTietHoaDon WHERE MaSP = @MaSP`);
    if (check.recordset.length > 0) throw new Error(`Sản phẩm đã có hóa đơn tại server ${t.srv}`);
  }

  await pool.request().input("MaSP", sql.VarChar(50), productCode).execute(PROCS.delete);
  return { productCode, deleted: true };
}

module.exports = { listProducts, getProductByCode, createProduct, updateProduct, deleteProduct };