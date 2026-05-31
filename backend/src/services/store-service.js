const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

function dbNameByBranch(branch) {
  if (branch === "HUE") return "Store_H";
  if (branch === "SAIGON") return "Store_SG";
  return "Store_HN";
}

function linkedServerNames() {
  return {
    HUE: process.env.LINKED_HUE || "HUE_SERVER",
    SAIGON: process.env.LINKED_SAIGON || "SG_SERVER",
    HANOI: process.env.LINKED_HANOI || "HN_SERVER",
  };
}

function localProcNamesByBranch() {
  return {
    listEmployees: "dbo.usp_Local_DanhSachNhanVien",
    createEmployee: "dbo.usp_Local_ThemNhanVien",
    updateEmployee: "dbo.usp_Local_CapNhatNhanVien",
    deleteEmployee: "dbo.usp_Local_XoaNhanVien",
    listInvoices: "dbo.usp_Local_DanhSachHoaDon",
    invoiceDetails: "dbo.usp_Local_ChiTietHoaDon",
    createInvoiceLines: "dbo.usp_Local_TaoHoaDonNhieuDong",
    listInventory: "dbo.usp_Local_DanhSachTonKho",
    inventoryByCode: "dbo.usp_Local_TonKhoTheoMaSP",
    updateInventory: "dbo.usp_Local_CapNhatTonKhoTongQuat",
    dashboardSummary: "dbo.usp_Local_DashboardTongQuan",
    dashboardRevenue7d: "dbo.usp_Local_DashboardDoanhThu7Ngay",
    dashboardTopStock: "dbo.usp_Local_DashboardTopTonKho",
  };
}

function centralProcNames() {
  return {
    createProduct: "dbo.usp_Central_ThemHangHoaMoi",
    updateProduct: "dbo.usp_Central_CapNhatHangHoa",
    deleteProduct: "dbo.usp_Central_XoaHangHoa",
  };
}

function commonProcNames() {
  return {
    listProducts: "dbo.usp_Chung_DanhSachHangHoa",
    productByCode: "dbo.usp_Chung_HangHoaTheoMaSP",
  };
}

function normalizeAnalyticsBranch(branch) {
  const normalized = String(branch || "").trim().toUpperCase();
  if (["HUE", "SAIGON", "HANOI"].includes(normalized)) {
    return normalized;
  }
  return "HUE";
}

function sourceInfoByBranch(branch) {
  const linked = linkedServerNames();
  if (branch === "HUE") return { server: linked.HUE, db: dbNameByBranch("HUE") };
  if (branch === "SAIGON") return { server: linked.SAIGON, db: dbNameByBranch("SAIGON") };
  return { server: linked.HANOI, db: dbNameByBranch("HANOI") };
}

async function executeAnalyticsProcOnBranch(pool, procName) {
  const rs = await pool.request().execute(`dbo.${procName}`);
  return rs.recordset || [];
}

async function executeAnalyticsProcOnCentral(pool, procName) {
  const rs = await pool.request().execute(`dbo.${procName}`);
  return rs.recordset || [];
}

async function hasHoaDonEmployeeColumnWithPool(pool) {
  const rs = await pool
    .request()
    .query("SELECT CASE WHEN COL_LENGTH('dbo.HoaDon', 'MaNV') IS NULL THEN 0 ELSE 1 END AS hasColumn;");
  return Boolean((rs.recordset[0] || {}).hasColumn);
}

async function listEmployeesByBranch(branch) {
  if (isMockMode()) return mock.listEmployeesByBranch(branch);
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  const result = await pool.request().execute(procs.listEmployees);
  return result.recordset;
}

async function createEmployee(branch, payload) {
  if (isMockMode()) return mock.createEmployee(branch, payload);
  if (!["HUE", "SAIGON", "HANOI"].includes(branch)) {
    throw new Error("ChiNhanh is required and must be HUE/SAIGON/HANOI");
  }
  const pool = await getPool(branch);
  const localProcs = localProcNamesByBranch();
  const maNV = payload.MaNV || `${branch[0]}${String(Date.now()).slice(-4)}`;
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), maNV)
    .input("HoTen", sql.NVarChar(120), payload.HoTen)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu)
    .execute(localProcs.createEmployee);
  return rs.recordset[0] || null;
}

async function updateEmployee(branch, employeeId, payload) {
  if (isMockMode()) return mock.updateEmployee(branch, employeeId, payload);
  if (!["HUE", "SAIGON", "HANOI"].includes(branch)) {
    throw new Error("ChiNhanh is required and must be HUE/SAIGON/HANOI");
  }
  const pool = await getPool(branch);
  const localProcs = localProcNamesByBranch();
  const rs = await pool
    .request()
    .input("MaNV", sql.VarChar(50), employeeId)
    .input("HoTen", sql.NVarChar(120), payload.HoTen || null)
    .input("ChucVu", sql.NVarChar(80), payload.ChucVu || null)
    .execute(localProcs.updateEmployee);
  if (!rs.recordset || !rs.recordset.length) {
    throw new Error(`Employee ${employeeId} not found in ${branch}`);
  }
  return rs.recordset[0];
}

async function deleteEmployee(branch, employeeId) {
  if (isMockMode()) return mock.deleteEmployee(branch, employeeId);
  if (!["HUE", "SAIGON", "HANOI"].includes(branch)) {
    throw new Error("ChiNhanh is required and must be HUE/SAIGON/HANOI");
  }
  const pool = await getPool(branch);
  const localProcs = localProcNamesByBranch();
  const beforeDelete = await pool
    .request()
    .input("MaNV", sql.VarChar(50), employeeId)
    .query("SELECT TOP 1 * FROM NhanVien WHERE MaNV = @MaNV;");
  if (!beforeDelete.recordset.length) {
    throw new Error(`Employee ${employeeId} not found in ${branch}`);
  }
  await pool.request().input("MaNV", sql.VarChar(50), employeeId).execute(localProcs.deleteEmployee);
  return beforeDelete.recordset[0];
}

async function listInvoicesByBranch(branch) {
  if (isMockMode()) return mock.listInvoicesByBranch(branch);
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  const result = await pool.request().execute(procs.listInvoices);
  return result.recordset;
}

async function getInvoiceDetails(branch, invoiceId) {
  if (isMockMode()) return mock.getInvoiceDetailsLocal(branch, invoiceId);
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  const result = await pool.request().input("MaHD", sql.VarChar(50), invoiceId).execute(procs.invoiceDetails);
  return result.recordset;
}

async function createInvoice(payload) {
  if (isMockMode()) return mock.createInvoiceLocal(payload);
  const pool = await getPool(payload.branch);
  const procs = localProcNamesByBranch();
  const maHD = `HD_${Date.now()}`;
  const employeeId = String(payload.employeeId || "").trim();
  if (!employeeId) {
    throw new Error("employeeId is required for invoice creation");
  }
  const rawItems = Array.isArray(payload.items) && payload.items.length
    ? payload.items
    : [{ productCode: payload.productCode, unitPrice: payload.unitPrice, quantity: payload.quantity }];
  const mergedByProduct = new Map();
  for (const rawItem of rawItems) {
    const productCode = String(rawItem?.productCode || "").trim();
    const quantity = Number(rawItem?.quantity || 0);
    const unitPrice = Number(rawItem?.unitPrice || 0);
    if (!productCode || quantity <= 0) {
      throw new Error("Each invoice item must include productCode and quantity > 0");
    }
    const existing = mergedByProduct.get(productCode);
    if (!existing) {
      mergedByProduct.set(productCode, { MaSP: productCode, SoLuong: quantity, DonGia: unitPrice > 0 ? unitPrice : null });
      continue;
    }
    existing.SoLuong += quantity;
    if (existing.DonGia === null && unitPrice > 0) existing.DonGia = unitPrice;
  }
  const itemsPayload = Array.from(mergedByProduct.values());
  await pool
    .request()
    .input("MaHD", sql.VarChar(50), maHD)
    .input("MaNV", sql.VarChar(50), employeeId)
    .input("GhiChu", sql.NVarChar(255), String(payload.note || "").trim())
    .input("ChiNhanhLap", sql.VarChar(10), payload.branch)
    .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(itemsPayload))
    .execute(procs.createInvoiceLines);

  const hasMaNV = await hasHoaDonEmployeeColumnWithPool(pool);
  const header = await pool
    .request()
    .input("MaHD", sql.VarChar(50), maHD)
    .query(
      hasMaNV
        ? "SELECT TOP 1 MaHD, GhiChu, NgayTao, ChiNhanh, MaNV FROM HoaDon WHERE MaHD = @MaHD;"
        : "SELECT TOP 1 MaHD, GhiChu, NgayTao, ChiNhanh, NULL AS MaNV FROM HoaDon WHERE MaHD = @MaHD;",
    );

  const lines = await getInvoiceDetails(payload.branch, maHD);
  const totalAmount = lines.reduce((sum, line) => sum + Number(line.ThanhTien || 0), 0);
  const first = lines[0] || null;
  const hd = header.recordset[0] || {
    MaHD: maHD,
    GhiChu: String(payload.note || "").trim(),
    NgayTao: new Date(),
    ChiNhanh: payload.branch,
    MaNV: employeeId,
  };

  return {
    MaHD: hd.MaHD,
    TongTien: totalAmount,
    GhiChu: hd.GhiChu,
    ChiNhanh: hd.ChiNhanh,
    MaNV: hd.MaNV,
    items: lines.map((line) => ({
      productCode: line.MaSP,
      productName: line.TenHang,
      quantity: Number(line.SoLuong || 0),
      unitPrice: Number(line.DonGia || 0),
      totalAmount: Number(line.ThanhTien || 0),
    })),
    ...(first ? { MaSP: first.MaSP, SoLuong: Number(first.SoLuong || 0), TenHang: first.TenHang, DonGia: Number(first.DonGia || 0) } : {}),
    NgayTao: new Date(hd.NgayTao || new Date()).toISOString(),
  };
}

async function listInventory(branch, productCode) {
  if (isMockMode()) {
    if (!productCode) return mock.listInventory(branch);
    return mock.getInventory(branch, productCode);
  }
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  if (!productCode) {
    const rows = await pool.request().execute(procs.listInventory);
    return rows.recordset.map((row) => ({ branch, productCode: row.MaSP, quantity: Number(row.SoLuongTon || 0) }));
  }
  const result = await pool.request().input("MaSP", sql.VarChar(50), productCode).execute(procs.inventoryByCode);
  const row = result.recordset[0] || { MaSP: productCode, SoLuongTon: 0 };
  return { branch, productCode: row.MaSP, quantity: Number(row.SoLuongTon || 0) };
}

async function getProductByCode(branch, productCode) {
  if (isMockMode()) return mock.getProductByCode(branch, productCode);
  const code = String(productCode || "").trim();
  if (!code) throw new Error("productCode is required");
  const pool = await getPool(branch);
  const commonProcs = commonProcNames();
  const rs = await pool.request().input("MaSP", sql.VarChar(50), code).execute(commonProcs.productByCode);
  const row = rs.recordset[0] || null;
  if (!row) return null;
  return { branch, productCode: row.MaSP, productName: row.TenHang, unitPrice: Number(row.Gia || 0) };
}

async function listProducts(branch) {
  if (isMockMode()) return mock.listProducts();
  if (!branch) throw new Error("branch is required");
  const pool = await getPool(branch);
  const commonProcs = commonProcNames();
  const result = await pool.request().execute(commonProcs.listProducts);
  return result.recordset;
}

async function createProduct(payload) {
  if (isMockMode()) return mock.createProduct(payload);
  const pool = await getPool("CENTRAL");
  const centralProcs = centralProcNames();
  const code = String(payload.productCode || "").trim();
  const name = String(payload.productName || code).trim();
  const price = Number(payload.unitPrice || 0);
  await pool.request()
    .input("MaSP", sql.VarChar(50), code)
    .input("TenHang", sql.NVarChar(100), name)
    .input("Gia", sql.Decimal(10, 2), price)
    .execute(centralProcs.createProduct);
  return { productCode: code, productName: name, unitPrice: price };
}

async function updateProduct(productCode, payload) {
  if (isMockMode()) return mock.updateProduct(productCode, payload);
  const pool = await getPool("CENTRAL");
  const centralProcs = centralProcNames();
  const code = String(productCode || "").trim();
  await pool.request()
    .input("MaSP", sql.VarChar(50), code)
    .input("TenHang", sql.NVarChar(100), payload.productName !== undefined ? String(payload.productName).trim() : null)
    .input("Gia", sql.Decimal(10, 2), payload.unitPrice !== undefined ? Number(payload.unitPrice || 0) : null)
    .execute(centralProcs.updateProduct);
  return { updated: true, productCode: code };
}

async function deleteProduct(productCode) {
  if (isMockMode()) return mock.deleteProduct(productCode);
  const pool = await getPool("CENTRAL");
  const centralProcs = centralProcNames();
  const code = String(productCode || "").trim();
  const branchTargets = [
    { code: "HUE", server: "HUE_SERVER", db: "Store_H" },
    { code: "SAIGON", server: "SG_SERVER", db: "Store_SG" },
    { code: "HANOI", server: "HN_SERVER", db: "Store_HN" },
  ];

  for (const target of branchTargets) {
    await pool.request()
      .input("MaSP", sql.VarChar(50), code)
      .query(`
        IF EXISTS (SELECT 1 FROM [${target.server}].[${target.db}].dbo.ChiTietHoaDon WHERE MaSP = @MaSP)
        BEGIN
          THROW 50002, N'Loi: San pham da phat sinh hoa don tai chi nhanh ${target.code}, khong the xoa!', 1;
        END
        IF EXISTS (SELECT 1 FROM [${target.server}].[${target.db}].dbo.HangHoa WHERE MaSP = @MaSP)
        BEGIN
          DELETE FROM [${target.server}].[${target.db}].dbo.TonKho WHERE MaSP = @MaSP;
          DELETE FROM [${target.server}].[${target.db}].dbo.HangHoa WHERE MaSP = @MaSP;
        END
      `);
  }

  await pool.request().input("MaSP", sql.VarChar(50), code).execute(centralProcs.deleteProduct);
  return { deleted: true, productCode: code };
}

async function updateInventoryItem(branch, productCode, quantity) {
  if (isMockMode()) return mock.updateInventoryItem(branch, productCode, quantity);
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  const targetQty = Number(quantity || 0);
  const updatedRs = await pool
    .request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("SoLuongTonMoi", sql.Int, targetQty)
    .input("ChiNhanhLap", sql.VarChar(10), branch)
    .execute(procs.updateInventory);
  const updated = (updatedRs.recordset || [])[0] || null;
  if (!updated) throw new Error(`Product ${productCode} not found in ${branch}`);
  return { branch, productCode: updated.MaSP, quantity: Number(updated.SoLuongTon || 0) };
}

async function getBranchDashboard(branch) {
  if (isMockMode()) return mock.branchDashboard(branch);
  const pool = await getPool(branch);
  const procs = localProcNamesByBranch();
  const [summaryRs, revenueRs, topStockRs] = await Promise.all([
    pool.request().execute(procs.dashboardSummary),
    pool.request().execute(procs.dashboardRevenue7d),
    pool.request().input("TopN", sql.Int, 8).execute(procs.dashboardTopStock),
  ]);
  const summary = (summaryRs.recordset || [])[0] || {};
  const sevenDayRevenue = {};
  for (const row of revenueRs.recordset || []) {
    const key = new Date(row.Ngay || Date.now()).toISOString().slice(0, 10);
    sevenDayRevenue[key] = Number(row.DoanhThu || 0);
  }
  const topStockByProduct = (topStockRs.recordset || []).map((row) => ({
    productCode: row.MaSP,
    productName: row.TenHang,
    quantity: Number(row.SoLuongTon || 0),
  }));
  return {
    mode: "SQL_SERVER_PROC",
    branch,
    employeeCount: Number(summary.employeeCount || 0),
    invoiceCount: Number(summary.invoiceCount || 0),
    revenue: Number(summary.revenue || 0),
    totalStockUnits: Number(summary.totalStockUnits || 0),
    lowStockProducts: Number(summary.lowStockProducts || 0),
    sevenDayRevenue,
    topStockByProduct,
    generatedAt: new Date().toISOString(),
  };
}

async function getNationalRevenue(callerBranch) {
  if (isMockMode()) return mock.revenueReport();
  const normalizedCaller = String(callerBranch || "").trim().toUpperCase();
  let rows;
  let mode;
  if (normalizedCaller === "CENTRAL") {
    const pool = await getPool("CENTRAL");
    rows = await executeAnalyticsProcOnCentral(pool, "usp_Central_DoanhThuQuocGia");
    mode = "SQL_SERVER_CENTRAL_PROC";
  } else {
    const pool = await getPool(normalizedCaller);
    const rs = await pool.request().query(`
      SELECT ChiNhanh AS BranchCode, SUM(ThanhTien) AS Revenue
      FROM dbo.v_HoaDonChiTiet_ToanQuoc
      GROUP BY ChiNhanh;
    `);
    rows = rs.recordset || [];
    mode = "SQL_SERVER_BRANCH_VIEW";
  }
  const byBranch = rows.map((row) => ({ branch: row.BranchCode, revenue: Number(row.Revenue || 0) }));
  const nationalRevenue = byBranch.reduce((sum, item) => sum + item.revenue, 0);
  return { mode, callerBranch: normalizedCaller, generatedAt: new Date().toISOString(), byBranch, nationalRevenue };
}

async function getCentralAnalyticsOverview(callerBranch, sourceBranch) {
  if (isMockMode()) {
    return {
      mode: "MOCK",
      analyticsSourceBranch: normalizeAnalyticsBranch(sourceBranch),
      generatedAt: new Date().toISOString(),
      daily: [],
      weekly: [],
      topEmployees: [],
      topProducts: [],
      weekCompare: [],
    };
  }
  const normalizedCaller = String(callerBranch || "").trim().toUpperCase();
  let analyticsSourceBranch;
  let mode;
  let dailyRows;
  let weeklyRows;
  let topEmployeeRows;
  let topProductRows;
  let compareRows;
  if (normalizedCaller === "CENTRAL") {
    const pool = await getPool("CENTRAL");
    analyticsSourceBranch = "CENTRAL";
    mode = "SQL_SERVER_CENTRAL_PROC";
    [dailyRows, weeklyRows, topEmployeeRows, topProductRows, compareRows] = await Promise.all([
      executeAnalyticsProcOnCentral(pool, "usp_Central_DoanhThuVaSoDon_TheoNgay"),
      executeAnalyticsProcOnCentral(pool, "usp_Central_DoanhThuVaSoDon_TheoTuan"),
      executeAnalyticsProcOnCentral(pool, "usp_Central_NhanVienBanTotNhatTuan"),
      executeAnalyticsProcOnCentral(pool, "usp_Central_SanPhamBanChayNhat_MoiChiNhanh"),
      executeAnalyticsProcOnCentral(pool, "usp_Central_SoSanhDoanhThuTuan"),
    ]);
  } else {
    const pool = await getPool(normalizedCaller);
    analyticsSourceBranch = normalizeAnalyticsBranch(sourceBranch || normalizedCaller || process.env.ANALYTICS_SP_SOURCE_BRANCH || "HUE");
    mode = "SQL_SERVER_BRANCH_VIEW_PROC";
    [dailyRows, weeklyRows, topEmployeeRows, topProductRows, compareRows] = await Promise.all([
      executeAnalyticsProcOnBranch(pool, "usp_DoanhThuVaSoDon_TheoNgay"),
      executeAnalyticsProcOnBranch(pool, "usp_DoanhThuVaSoDon_TheoTuan"),
      executeAnalyticsProcOnBranch(pool, "usp_NhanVienBanTotNhatTuan"),
      executeAnalyticsProcOnBranch(pool, "usp_SanPhamBanChayNhat_MoiChiNhanh"),
      executeAnalyticsProcOnBranch(pool, "usp_SoSanhDoanhThuTuan"),
    ]);
  }
  const daily = dailyRows.map((row) => ({ branch: row.ChiNhanh, date: row.Ngay, totalOrders: Number(row.TongSoDonHang || 0), totalRevenue: Number(row.TongDoanhThu || 0) }));
  const weekly = weeklyRows.map((row) => ({ branch: row.ChiNhanh, year: Number(row.Nam || 0), week: Number(row.TuanTrongNam || 0), totalOrders: Number(row.TongSoDonHang || 0), totalRevenue: Number(row.TongDoanhThu || 0) }));
  const topEmployees = topEmployeeRows.map((row) => ({ branch: row.ChiNhanh, employeeId: row.MaNV, employeeName: row.HoTen, totalRevenue: Number(row.TongDoanhThu || 0) }));
  const topProducts = topProductRows.map((row) => ({ branch: row.ChiNhanh, productCode: row.MaSP, productName: row.TenHang, totalSold: Number(row.TongSoLuongBan || 0) }));
  const weekCompare = compareRows.map((row) => ({ branch: row.ChiNhanh, thisWeekRevenue: Number(row.DoanhThuTuanNay || 0), lastWeekRevenue: Number(row.DoanhThuTuanTruoc || 0) }));
  return { mode, callerBranch: normalizedCaller, analyticsSourceBranch, generatedAt: new Date().toISOString(), daily, weekly, topEmployees, topProducts, weekCompare };
}

async function transferStockDistributed(payload) {
  if (isMockMode()) return mock.transferStock(payload);
  const pool = await getPool("CENTRAL");
  const quantity = Number(payload.quantity || 0);
  const fromBranch = String(payload.fromBranch || "").toUpperCase();
  const toBranch = String(payload.toBranch || "").toUpperCase();
  const productCode = String(payload.productCode || "").trim();
  const linked = linkedServerNames();
  const fromServer = linked[fromBranch];
  const toServer = linked[toBranch];
  const fromDb = dbNameByBranch(fromBranch);
  const toDb = dbNameByBranch(toBranch);
  if (!fromServer || !toServer) throw new Error("Cannot resolve linked server names for transfer");

  const beforeFrom = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("FromBranch", sql.VarChar(10), fromBranch)
    .query(`SELECT TOP 1 SoLuongTon FROM [${fromServer}].[${fromDb}].dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = @FromBranch;`);
  const beforeTo = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("ToBranch", sql.VarChar(10), toBranch)
    .query(`SELECT TOP 1 SoLuongTon FROM [${toServer}].[${toDb}].dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = @ToBranch;`);
  const beforeFromQty = Number((beforeFrom.recordset[0] || {}).SoLuongTon || 0);
  const beforeToQty = Number((beforeTo.recordset[0] || {}).SoLuongTon || 0);

  try {
    await pool
      .request()
      .input("TuChiNhanh", sql.VarChar(10), fromBranch)
      .input("DenChiNhanh", sql.VarChar(10), toBranch)
      .input("MaSP", sql.VarChar(50), productCode)
      .input("SoLuongChuyen", sql.Int, quantity)
      .execute("dbo.usp_Central_DieuChuyenKho");
  } catch (error) {
    const message = String(error.message || "");
    const linkedHints = message.toLowerCase().includes("distributed transaction") || message.toLowerCase().includes("msdtc") || message.toLowerCase().includes("linked server");
    if (linkedHints) {
      throw new Error(`Transfer failed due to linked-server/distributed-transaction setup. Original error: ${message}`);
    }
    throw error;
  }

  const afterFrom = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("FromBranch", sql.VarChar(10), fromBranch)
    .query(`SELECT TOP 1 SoLuongTon FROM [${fromServer}].[${fromDb}].dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = @FromBranch;`);
  const afterTo = await pool.request()
    .input("MaSP", sql.VarChar(50), productCode)
    .input("ToBranch", sql.VarChar(10), toBranch)
    .query(`SELECT TOP 1 SoLuongTon FROM [${toServer}].[${toDb}].dbo.TonKho WHERE MaSP = @MaSP AND ChiNhanh = @ToBranch;`);
  const afterFromQty = Number((afterFrom.recordset[0] || {}).SoLuongTon || 0);
  const afterToQty = Number((afterTo.recordset[0] || {}).SoLuongTon || 0);
  return {
    mode: "SQL_SERVER_PROC",
    status: "COMMITTED",
    productCode,
    quantity,
    fromBranch,
    toBranch,
    before: { from: beforeFromQty, to: beforeToQty },
    after: { from: afterFromQty, to: afterToQty },
    committedAt: new Date().toISOString(),
  };
}

async function listAllEmployeesFromCentral() {
  if (isMockMode()) return mock.listAllEmployees();
  const pool = await getPool("CENTRAL");
  const linked = linkedServerNames();
  const branches = ["HUE", "SAIGON", "HANOI"];
  const results = [];
  for (const branch of branches) {
    const server = linked[branch];
    const db = dbNameByBranch(branch);
    const rs = await pool.request().query(`SELECT * FROM [${server}].[${db}].dbo.NhanVien;`);
    results.push(...(rs.recordset || []));
  }
  return results;
}

module.exports = {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployeesByBranch,
  listInvoicesByBranch,
  getInvoiceDetails,
  createInvoice,
  getNationalRevenue,
  getCentralAnalyticsOverview,
  transferStockDistributed,
  listInventory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByCode,
  updateInventoryItem,
  getBranchDashboard,
  listAllEmployeesFromCentral,
};
