const { sql, isMockMode, getPool } = require("../db/sqlserver");
const mock = require("../data/mock-store");

async function getNationalRevenue(callerBranch) {
  if (isMockMode()) return mock.revenueReport();
  const pool = await getPool(callerBranch === "CENTRAL" ? "CENTRAL" : callerBranch);
  
  let rows;
  if (callerBranch === "CENTRAL") {
    const rs = await pool.request().execute("usp_Central_DoanhThuQuocGia");
    rows = rs.recordset;
  } else {
    const rs = await pool.request().query("SELECT ChiNhanh AS BranchCode, SUM(ThanhTien) AS Revenue FROM dbo.v_HoaDonChiTiet_ToanQuoc GROUP BY ChiNhanh");
    rows = rs.recordset;
  }

  const byBranch = rows.map(r => ({ branch: r.BranchCode || r.ChiNhanh, revenue: Number(r.Revenue || 0) }));
  return {
    mode: callerBranch === "CENTRAL" ? "SQL_SERVER_CENTRAL_PROC" : "SQL_SERVER_BRANCH_VIEW",
    byBranch,
    nationalRevenue: byBranch.reduce((sum, b) => sum + b.revenue, 0)
  };
}

async function getCentralAnalyticsOverview(callerBranch) {
  if (isMockMode()) return mock.analyticsOverview();
  const pool = await getPool(callerBranch === "CENTRAL" ? "CENTRAL" : callerBranch);
  
  const [dailyRows, weeklyRows, topEmployeeRows, topProductRows, compareRows] = await Promise.all([
    pool.request().execute(callerBranch === "CENTRAL" ? "usp_Central_DoanhThuVaSoDon_TheoNgay" : "usp_DoanhThuVaSoDon_TheoNgay"),
    pool.request().execute(callerBranch === "CENTRAL" ? "usp_Central_DoanhThuVaSoDon_TheoTuan" : "usp_DoanhThuVaSoDon_TheoTuan"),
    pool.request().execute(callerBranch === "CENTRAL" ? "usp_Central_NhanVienBanTotNhatTuan" : "usp_NhanVienBanTotNhatTuan"),
    pool.request().execute(callerBranch === "CENTRAL" ? "usp_Central_SanPhamBanChayNhat_MoiChiNhanh" : "usp_SanPhamBanChayNhat_MoiChiNhanh"),
    pool.request().execute(callerBranch === "CENTRAL" ? "usp_Central_SoSanhDoanhThuTuan" : "usp_SoSanhDoanhThuTuan")
  ]);

  return {
    daily: dailyRows.recordset.map(r => ({ branch: r.ChiNhanh, date: r.Ngay, totalRevenue: Number(r.TongDoanhThu || 0) })),
    weekly: weeklyRows.recordset.map(r => ({ branch: r.ChiNhanh, year: r.Nam, week: r.TuanTrongNam, totalRevenue: Number(r.TongDoanhThu || 0) })),
    topEmployees: topEmployeeRows.recordset.map(r => ({ branch: r.ChiNhanh, employeeName: r.HoTen, totalRevenue: Number(r.TongDoanhThu || 0) })),
    topProducts: topProductRows.recordset.map(r => ({ branch: r.ChiNhanh, productName: r.TenHang, totalSold: r.TongSoLuongBan })),
    weekCompare: compareRows.recordset.map(r => ({ branch: r.ChiNhanh, thisWeekRevenue: Number(r.DoanhThuTuanNay || 0), lastWeekRevenue: Number(r.DoanhThuTuanTruoc || 0) }))
  };
}

async function getBranchDashboard(branch) {
  if (isMockMode()) return mock.branchDashboard(branch);
  const pool = await getPool(branch);
  const [summaryRs, revenueRs, topStockRs] = await Promise.all([
    pool.request().execute("dbo.usp_Local_DashboardTongQuan"),
    pool.request().execute("dbo.usp_Local_DashboardDoanhThu7Ngay"),
    pool.request().input("TopN", sql.Int, 8).execute("dbo.usp_Local_DashboardTopTonKho"),
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

module.exports = { getNationalRevenue, getCentralAnalyticsOverview, getBranchDashboard };