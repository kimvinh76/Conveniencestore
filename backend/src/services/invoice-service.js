const { sql, getPool } = require("../db/sqlserver");

const PROCS = {
  list: "dbo.usp_Local_DanhSachHoaDon",
  details: "dbo.usp_Local_ChiTietHoaDon",
  create: "dbo.usp_Local_TaoHoaDonNhieuDong"
};

const formatInvoiceDate = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

async function listInvoicesByBranch(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute(PROCS.list);
  const rows = result.recordset || [];

  return rows.map(r => ({
    ...r,
    NgayTao: formatInvoiceDate(r.NgayTao)
  }));
}


async function getInvoiceDetails(branch, invoiceId) {
  const pool = await getPool(branch);
  const result = await pool.request()
    .input("MaHD", sql.VarChar(50), invoiceId)
    .execute(PROCS.details);

  // Store mới usp_Local_ChiTietHoaDon trả về 2 kết quả (Multiple Recordsets)
  // - result.recordsets[0]: Chứa danh sách các món hàng (Chi tiết hóa đơn)
  // - result.recordsets[1]: Chứa danh sách các mã khuyến mãi đã được áp dụng cho hóa đơn này
  return {
    items: result.recordsets[0] || [],
    promos: result.recordsets[1] || []
  };
}

async function createInvoice(payload) {
  const { branch, employeeId, customerId, items, note, promos, diemSuDung } = payload;
  const pool = await getPool(branch);
  const maHD = `HD_${Date.now()}`;

  // Chuẩn bị JSON cho Procedure xử lý nhiều dòng (Atomicity)
  const itemsPayload = items.map(it => ({
    MaSP: it.productCode,
    SoLuong: it.quantity,
    DonGia: it.unitPrice
  }));

  const request = pool.request()
    .input("MaHD", sql.VarChar(50), maHD)
    .input("MaNV", sql.VarChar(50), employeeId)
    .input("MaKH", sql.VarChar(50), customerId || null)
    .input("GhiChu", sql.NVarChar(255), note || "")
    .input("ChiNhanhLap", sql.VarChar(10), branch)
    .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(itemsPayload));

  // Chuẩn bị mảng JSON Khuyến Mãi (Nếu có)
  // payload.promos truyền từ FE lên có dạng mảng string: ["KM_HE_2026", "KM_FREESHIP"]
  // Ta phải map sang mảng Object để OPENJSON trong Store đọc được: [{"MaKM": "KM_HE_2026"}, ...]
  if (promos && promos.length > 0) {
    const promosPayload = promos.map(km => ({ MaKM: km }));
    request.input("PromosJson", sql.NVarChar(sql.MAX), JSON.stringify(promosPayload));
  } else {
    request.input("PromosJson", sql.NVarChar(sql.MAX), null);
  }

  // Truyền số điểm tích lũy khách hàng muốn tiêu vào Store
  // Tỷ giá quy đổi (1 điểm = 100đ) sẽ được tính toán tự động trong Store Procedure
  request.input("DiemSuDung", sql.Int, diemSuDung || 0);

  await request.execute(PROCS.create);

  // --- REPLICATION TO CENTRAL ---
  if (branch !== "CENTRAL") {
    try {
      const centralPool = await getPool("CENTRAL");
      const centralReq = centralPool.request()
        .input("MaHD", sql.VarChar(50), maHD)
        .input("MaNV", sql.VarChar(50), employeeId)
        .input("MaKH", sql.VarChar(50), customerId || null)
        .input("GhiChu", sql.NVarChar(255), note || "")
        .input("ChiNhanhLap", sql.VarChar(10), branch)
        .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(itemsPayload));

      if (promos && promos.length > 0) {
        centralReq.input("PromosJson", sql.NVarChar(sql.MAX), JSON.stringify(promos.map(km => ({ MaKM: km }))));
      } else {
        centralReq.input("PromosJson", sql.NVarChar(sql.MAX), null);
      }
      centralReq.input("DiemSuDung", sql.Int, diemSuDung || 0);

      await centralReq.execute("dbo.usp_Central_DongBoHoaDon");
    } catch (err) {
      console.error(`[SYNC ERROR] Could not sync invoice ${maHD} to CENTRAL:`, err.message);
    }
  }

  // --- REPLICATION OF CUSTOMER POINTS TO OTHER BRANCHES (P2P SYNC) ---
  if (customerId) {
    // Tính toán lượng điểm thay đổi: Điểm cộng (10k = 1đ) trừ đi Điểm sử dụng
    const finalAmount = payload.totalAmount || 0;
    const diemCong = Math.floor(finalAmount / 10000);
    const diemThayDoi = diemCong - (diemSuDung || 0);

    if (diemThayDoi !== 0) {
      const ALL_BRANCHES = ["CENTRAL", "HUE", "SAIGON", "HANOI"];
      for (const b of ALL_BRANCHES) {
        // Bỏ qua chi nhánh lập hóa đơn (đã tự cập nhật local) 
        // Bỏ qua CENTRAL (đã được cập nhật trong Store Đồng bộ Hóa đơn ở trên)
        if (b !== branch && b !== "CENTRAL") {
          try {
            const syncPool = await getPool(b);
            await syncPool.request()
              .input("MaKH", sql.VarChar(50), customerId)
              .input("DiemThayDoi", sql.Int, diemThayDoi)
              .execute("dbo.usp_Branch_DongBoDiemKhachHang");
          } catch (err) {
            console.error(`[SYNC ERROR] Could not sync customer points for ${customerId} to branch ${b}:`, err.message);
          }
        }
      }
    }
  }

  return { maHD, branch, customerId, totalAmount: payload.totalAmount };
}

module.exports = { listInvoicesByBranch, getInvoiceDetails, createInvoice };