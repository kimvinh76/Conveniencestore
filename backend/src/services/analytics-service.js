const { sql, getPool } = require("../db/sqlserver");

async function getNationalRevenue() {
  const pool = await getPool("CENTRAL");

  const rs = await pool.request().execute("usp_Central_DoanhThuQuocGia");
  const rows = rs.recordset;

  const byBranch = rows.map(r => ({ branch: r.BranchCode || r.ChiNhanh, revenue: Number(r.Revenue || 0) }));
  return {
    mode: "SQL_SERVER_CENTRAL_PROC",
    byBranch,
    nationalRevenue: byBranch.reduce((sum, b) => sum + b.revenue, 0)
  };
}

async function getCentralAnalyticsOverview() {
  const pool = await getPool("CENTRAL");

  const [dailyRows, weeklyRows, topEmployeeRows, topProductRows, compareRows] = await Promise.all([
    pool.request().execute("usp_Central_DoanhThuVaSoDon_TheoNgay"),
    pool.request().execute("usp_Central_DoanhThuVaSoDon_TheoTuan"),
    pool.request().execute("usp_Central_NhanVienBanTotNhatTuan"),
    pool.request().execute("usp_Central_SanPhamBanChayNhat_MoiChiNhanh"),
    pool.request().execute("usp_Central_SoSanhDoanhThuTuan")
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
  const pool = await getPool(branch);
  const [summaryRs, revenueRs, topStockRs] = await Promise.all([
    pool.request().input("ChiNhanh", sql.VarChar(10), branch).execute("dbo.usp_Local_DashboardTongQuan"),
    pool.request().input("ChiNhanh", sql.VarChar(10), branch).execute("dbo.usp_Local_DashboardDoanhThu7Ngay"),
    pool.request().input("ChiNhanh", sql.VarChar(10), branch).input("TopN", sql.Int, 8).execute("dbo.usp_Local_DashboardTopTonKho"),
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