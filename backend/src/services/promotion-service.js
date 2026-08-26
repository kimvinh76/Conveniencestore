const { sql, getPool } = require("../db/sqlserver");

const PROCS = {
  list: "dbo.usp_Central_DanhSachKhuyenMai",
  listActive: "dbo.usp_Central_DanhSachKhuyenMaiHieuLuc",
  create: "dbo.usp_Central_ThemKhuyenMai",
  update: "dbo.usp_Central_CapNhatKhuyenMai",
  delete: "dbo.usp_Central_XoaKhuyenMai",
  localList: "dbo.usp_Local_DanhSachKhuyenMai",
  localListActive: "dbo.usp_Local_DanhSachKhuyenMaiHieuLuc",
  localCheck: "dbo.usp_Local_KiemTraKhuyenMai"
};

async function listPromotions(branch) {
  const pool = await getPool(branch);
  const proc = branch === "CENTRAL" ? PROCS.list : PROCS.localList;
  const result = await pool.request().execute(proc);
  return result.recordset || [];
}

async function listActivePromotions(branch) {
  const pool = await getPool(branch);
  const proc = branch === "CENTRAL" ? PROCS.listActive : PROCS.localListActive;
  const result = await pool.request().execute(proc);
  return result.recordset || [];
}

async function checkPromotion(branch, promoCode) {
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("MaKM", sql.VarChar(50), promoCode)
    .execute(PROCS.localCheck);
  return result.recordset[0] || null;
}

async function createPromotion(payload) {
  const pool = await getPool("CENTRAL"); // Only Central can create
  await pool.request()
    .input("MaKM", sql.VarChar(50), payload.MaKM)
    .input("TenChuongTrinh", sql.NVarChar(150), payload.TenChuongTrinh)
    .input("PhanTramGiam", sql.Int, payload.PhanTramGiam || 0)
    .input("NgayBatDau", sql.DateTime2, payload.NgayBatDau)
    .input("NgayKetThuc", sql.DateTime2, payload.NgayKetThuc)
    .input("LoaiKhuyenMai", sql.VarChar(20), payload.LoaiKhuyenMai || "PERCENTAGE")
    .input("SoTienGiamTrucTiep", sql.Decimal(15, 2), payload.SoTienGiamTrucTiep || 0)
    .input("GiamToiDa", sql.Decimal(15, 2), payload.GiamToiDa || null)
    .input("DonHangToiThieu", sql.Decimal(15, 2), payload.DonHangToiThieu || 0)
    .input("SoLuongGioiHan", sql.Int, payload.SoLuongGioiHan || null)
    .input("ChoPhepCongDon", sql.Bit, payload.ChoPhepCongDon === undefined ? 1 : payload.ChoPhepCongDon)
    .input("TrangThai", sql.Bit, payload.TrangThai === undefined ? 1 : payload.TrangThai)
    .execute(PROCS.create);
  return payload;
}

async function updatePromotion(promoCode, payload) {
  const pool = await getPool("CENTRAL"); // Only Central can update
  await pool.request()
    .input("MaKM", sql.VarChar(50), promoCode)
    .input("TenChuongTrinh", sql.NVarChar(150), payload.TenChuongTrinh || null)
    .input("PhanTramGiam", sql.Int, payload.PhanTramGiam === undefined ? null : payload.PhanTramGiam)
    .input("NgayBatDau", sql.DateTime2, payload.NgayBatDau || null)
    .input("NgayKetThuc", sql.DateTime2, payload.NgayKetThuc || null)
    .input("LoaiKhuyenMai", sql.VarChar(20), payload.LoaiKhuyenMai || null)
    .input("SoTienGiamTrucTiep", sql.Decimal(15, 2), payload.SoTienGiamTrucTiep === undefined ? null : payload.SoTienGiamTrucTiep)
    .input("GiamToiDa", sql.Decimal(15, 2), payload.GiamToiDa === undefined ? null : payload.GiamToiDa)
    .input("DonHangToiThieu", sql.Decimal(15, 2), payload.DonHangToiThieu === undefined ? null : payload.DonHangToiThieu)
    .input("SoLuongGioiHan", sql.Int, payload.SoLuongGioiHan === undefined ? null : payload.SoLuongGioiHan)
    .input("ChoPhepCongDon", sql.Bit, payload.ChoPhepCongDon === undefined ? null : payload.ChoPhepCongDon)
    .input("TrangThai", sql.Bit, payload.TrangThai === undefined ? null : payload.TrangThai)
    .execute(PROCS.update);
  return { MaKM: promoCode, updated: true };
}

async function deletePromotion(promoCode) {
  const pool = await getPool("CENTRAL"); // Only Central can delete
  await pool.request()
    .input("MaKM", sql.VarChar(50), promoCode)
    .execute(PROCS.delete);
  return { MaKM: promoCode, deleted: true };
}

module.exports = {
  listPromotions,
  listActivePromotions,
  checkPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
};
