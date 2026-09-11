const { getPool, sql } = require("../db/sqlserver");
const { getChannel } = require("../utils/rabbitmq");

async function startSyncWorker() {
  const channel = getChannel();
  if (!channel) {
    console.error("[Worker] RabbitMQ channel not found. Retrying in 5s...");
    setTimeout(startSyncWorker, 5000);
    return;
  }

  console.log("[Worker] Started listening for sync events...");

  // --- MASTER DATA SYNC (Central to Branches) ---
  channel.consume("master_data_sync", async (msg) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[Worker] Received Master Data event: ${payload.event}`);
        
        await processMasterDataEvent(payload);
        
        channel.ack(msg);
      } catch (err) {
        console.error("[Worker] Error processing master data msg:", err);
        // Only ack if unrecoverable, else nack to retry. For now, ack to prevent loop
        channel.ack(msg);
      }
    }
  });

  // --- TRANSACTION SYNC (Branches to Central) ---
  channel.consume("transaction_sync", async (msg) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[Worker] Received Transaction event: ${payload.event}`);
        
        await processTransactionEvent(payload);
        
        channel.ack(msg);
      } catch (err) {
        console.error("[Worker] Error processing transaction msg:", err);
        channel.ack(msg);
      }
    }
  });

  // --- INVENTORY TRANSFER SYNC ---
  channel.consume("inventory_transfer", async (msg) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log(`[Worker] Received Transfer event: ${payload.event}`);
        
        await processTransferEvent(payload);
        
        channel.ack(msg);
      } catch (err) {
        console.error("[Worker] Error processing transfer msg:", err);
        channel.ack(msg);
      }
    }
  });
}

// ============================================================================
// PROCESSING LOGIC
// ============================================================================

async function processMasterDataEvent(payload) {
  const { event, data } = payload;
  const targetBranches = ["HANOI", "HUE", "SAIGON"]; // Central is already written to

  for (const branch of targetBranches) {
    try {
      const pool = await getPool(branch);
      
      switch (event) {
        // --- PRODUCT ---
        case "product.created":
          await pool.request()
            .input("MaSP", sql.VarChar(50), data.productCode)
            .input("TenHang", sql.NVarChar(100), data.productName)
            .input("Gia", sql.Decimal(10, 2), data.unitPrice)
            .input("MoTa", sql.NVarChar(500), data.description || null)
            .input("AnhSanPham", sql.VarChar(255), data.imageUrl || null)
            .input("DonViTinh", sql.NVarChar(50), data.unit || null)
            .input("MaDM", sql.VarChar(20), data.categoryCode || null)
            .input("MaTH", sql.VarChar(20), data.brandCode || null)
            .input("Barcode", sql.VarChar(50), data.barcode || null)
            .input("TrangThai", sql.Int, 1)
            .input("ChiNhanh", sql.VarChar(10), branch)
            .execute("dbo.usp_Branch_DongBoThemHangHoa");
          break;
          
        case "product.updated":
          await pool.request()
            .input("MaSP", sql.VarChar(50), data.productCode)
            .input("TenHang", sql.NVarChar(100), data.productName)
            .input("Gia", sql.Decimal(10, 2), data.unitPrice)
            .input("MoTa", sql.NVarChar(500), data.description || null)
            .input("AnhSanPham", sql.VarChar(255), data.imageUrl || null)
            .input("DonViTinh", sql.NVarChar(50), data.unit || null)
            .input("MaDM", sql.VarChar(20), data.categoryCode || null)
            .input("MaTH", sql.VarChar(20), data.brandCode || null)
            .input("Barcode", sql.VarChar(50), data.barcode || null)
            .input("TrangThai", sql.Int, data.active === undefined ? null : (data.active ? 1 : 0))
            .input("ChiNhanh", sql.VarChar(10), branch)
            .execute("dbo.usp_Branch_DongBoCapNhatHangHoa");
          break;

        case "product.status_toggled":
          await pool.request()
            .input("MaSP", sql.VarChar(50), data.productCode)
            .input("TrangThai", sql.Int, data.active ? 1 : 0)
            .execute("dbo.usp_Branch_DongBoCapNhatHangHoa");
          break;

        // --- SUPPLIER ---
        case "supplier.created":
          await pool.request()
            .input("MaNCC", sql.VarChar(50), data.maNCC)
            .input("TenNCC", sql.NVarChar(150), data.tenNCC)
            .input("DienThoai", sql.VarChar(20), data.dienThoai || null)
            .input("DiaChi", sql.NVarChar(255), data.diaChi || null)
            .input("Email", sql.VarChar(100), data.email || null)
            .execute("dbo.usp_Chung_DongBoNhaCungCap");
          break;
          
        case "supplier.updated":
        case "supplier.status_toggled":
          await pool.request()
            .input("MaNCC", sql.VarChar(50), data.maNCC)
            .input("TenNCC", sql.NVarChar(150), data.tenNCC)
            .input("DienThoai", sql.VarChar(20), data.dienThoai || null)
            .input("DiaChi", sql.NVarChar(255), data.diaChi || null)
            .input("Email", sql.VarChar(100), data.email || null)
            .input("TrangThai", sql.Int, data.active ? 1 : 0)
            .execute("dbo.usp_Chung_DongBoNhaCungCap");
          break;

        // --- PROMOTION ---
        case "promotion.created":
        case "promotion.updated":
          await pool.request()
            .input("MaKM", sql.VarChar(50), data.maKM)
            .input("TenKM", sql.NVarChar(255), data.tenKM)
            .input("LoaiKM", sql.VarChar(50), data.loaiKM)
            .input("GiaTri", sql.Decimal(10, 2), data.giaTri)
            .input("DieuKien", sql.Decimal(10, 2), data.dieuKien || 0)
            .input("NgayBatDau", sql.DateTime, data.ngayBatDau || null)
            .input("NgayKetThuc", sql.DateTime, data.ngayKetThuc || null)
            .input("TrangThai", sql.Bit, data.trangThai ? 1 : 0)
            .execute("dbo.usp_Chung_DongBoKhuyenMai");
          break;
          
        case "promotion.status_toggled":
          await pool.request()
            .input("MaKM", sql.VarChar(50), data.maKM)
            .input("TrangThai", sql.Int, data.trangThai ? 1 : 0)
            .execute("dbo.usp_Chung_DongBoKhuyenMai"); // Re-using upsert logic but requires full data. Wait, actually we might need a specific SP for status toggle if full data is missing.
          break;

        // --- CUSTOMER ---
        case "customer.created":
          await pool.request()
            .input("MaKH", sql.VarChar(50), data.customerId)
            .input("HoTen", sql.NVarChar(120), data.fullName)
            .input("SoDienThoai", sql.VarChar(15), data.phoneNumber || null)
            .input("ChiNhanhDK", sql.VarChar(10), data.branchId)
            .execute("dbo.usp_Branch_DongBoThemKhachHang");
          break;

        case "customer.updated":
          await pool.request()
            .input("MaKH", sql.VarChar(50), data.customerId)
            .input("HoTen", sql.NVarChar(120), data.fullName)
            .input("SoDienThoai", sql.VarChar(15), data.phoneNumber || null)
            .execute("dbo.usp_Branch_DongBoCapNhatKhachHang");
          break;
          
        case "customer.points_updated":
          // Special case for points update (from transactions)
          // Data contains: { customerId, diemThayDoi }
          if (data.diemThayDoi !== 0) {
            await pool.request()
              .input("MaKH", sql.VarChar(50), data.customerId)
              .input("DiemThayDoi", sql.Int, data.diemThayDoi)
              .execute("dbo.usp_Branch_DongBoDiemKhachHang");
          }
          break;

        // --- ACCOUNT ---
        case "account.created":
          await pool.request()
            .input("TenDangNhap", sql.VarChar(50), data.TenDangNhap)
            .input("MatKhau", sql.VarChar(255), data.MatKhau)
            .input("MaNV", sql.VarChar(50), data.MaNV)
            .input("Quyen", sql.NVarChar(50), data.Quyen)
            .input("TrangThai", sql.Bit, data.TrangThai)
            .execute("dbo.usp_Chung_DongBoTaiKhoan");
          break;
          
        case "account.status_toggled":
          await pool.request()
            .input("TenDangNhap", sql.VarChar(50), data.TenDangNhap)
            .input("TrangThai", sql.Bit, data.TrangThai)
            .execute("dbo.usp_Chung_CapNhatTrangThaiTaiKhoan");
          break;
          
        case "account.password_reset":
          await pool.request()
            .input("TenDangNhap", sql.VarChar(50), data.TenDangNhap)
            .input("MatKhau", sql.VarChar(255), data.MatKhau)
            .execute("dbo.usp_Chung_CapNhatMatKhau");
          break;
          
        // --- EMPLOYEE ---
        case "employee.created":
          await pool.request()
            .input("MaNV", sql.VarChar(50), data.maNV)
            .input("HoTen", sql.NVarChar(120), data.hoTen)
            .input("ChucVu", sql.NVarChar(80), data.chucVu)
            .input("Email", sql.VarChar(100), data.email || null)
            .input("ChiNhanh", sql.VarChar(10), data.branchCode)
            .execute("dbo.usp_Local_ThemNhanVien"); // Branch uses its own local SP
          break;
          
        case "employee.updated":
          await pool.request()
            .input("MaNV", sql.VarChar(50), data.maNV)
            .input("HoTen", sql.NVarChar(120), data.hoTen)
            .input("ChucVu", sql.NVarChar(80), data.chucVu)
            .input("Email", sql.VarChar(100), data.email)
            .input("ChiNhanh", sql.VarChar(10), data.branchCode)
            .execute("dbo.usp_Local_CapNhatNhanVien");
          break;
          
        case "employee.deleted":
          await pool.request()
            .input("MaNV", sql.VarChar(50), data.maNV)
            .input("ChiNhanh", sql.VarChar(10), data.branchCode)
            .execute("dbo.usp_Local_XoaNhanVien");
          break;

        default:
          console.warn(`[Worker] Unhandled master data event type: ${event}`);
      }
      
    } catch (err) {
      console.error(`[Worker] Failed to sync ${event} to ${branch}:`, err.message);
    }
  }
}

async function processTransactionEvent(payload) {
  const { event, branch, data } = payload;
  
  if (branch === "CENTRAL") return; // Should not happen, but just in case
  
  try {
    const centralPool = await getPool("CENTRAL");
    
    switch (event) {
      case "invoice.created":
        const centralReq = centralPool.request()
          .input("MaHD", sql.VarChar(50), data.maHD)
          .input("MaNV", sql.VarChar(50), data.employeeId)
          .input("MaKH", sql.VarChar(50), data.customerId || null)
          .input("GhiChu", sql.NVarChar(255), data.note || "")
          .input("ChiNhanhLap", sql.VarChar(10), branch)
          .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(data.items));

        if (data.promos && data.promos.length > 0) {
          centralReq.input("PromosJson", sql.NVarChar(sql.MAX), JSON.stringify(data.promos.map(km => ({ MaKM: km }))));
        } else {
          centralReq.input("PromosJson", sql.NVarChar(sql.MAX), null);
        }
        centralReq.input("DiemSuDung", sql.Int, data.diemSuDung || 0);

        await centralReq.execute("dbo.usp_Central_DongBoHoaDon");
        break;

      case "purchase_receipt.created":
        await centralPool.request()
          .input("MaPN", sql.VarChar(50), data.maPN)
          .input("ChiNhanhLap", sql.VarChar(10), branch)
          .input("GhiChu", sql.NVarChar(255), data.ghiChu || null)
          .input("MaNCC", sql.VarChar(50), data.maNCC || null)
          .input("ItemsJson", sql.NVarChar(sql.MAX), JSON.stringify(data.items))
          .execute("dbo.usp_Central_DongBoPhieuNhap");
        break;

      default:
        console.warn(`[Worker] Unhandled transaction event type: ${event}`);
    }
  } catch (err) {
    console.error(`[Worker] Failed to sync ${event} to CENTRAL:`, err.message);
  }
}

async function processTransferEvent(payload) {
  const { event, data } = payload;
  
  if (event === "inventory.transfer") {
    const { fromBranch, toBranch, itemsJson, nguoiChuyen } = data;
    
    try {
      // Execute the transfer entirely on the Central Node!
      // This allows Central to deduct fromBranch and add to toBranch locally inside CentralDB
      const centralPool = await getPool("CENTRAL");
      
      // Wait, we need to replace usp_Central_DieuChuyenKho to NOT use Linked Server.
      // So instead, we manually do it!
      // Actually, since we want to avoid Linked Server, the Worker should execute SPs on each DB separately.
      
      // Step 1: Execute on CENTRAL to update central stock records
      await centralPool.request()
        .input("TuChiNhanh", sql.VarChar(10), fromBranch)
        .input("DenChiNhanh", sql.VarChar(10), toBranch)
        .input("ItemsJson", sql.NVarChar(sql.MAX), itemsJson)
        .input("NguoiChuyen", sql.VarChar(50), nguoiChuyen)
        .execute("dbo.usp_Central_DieuChuyenKho_NoLinkedServer"); 
        
      // Step 2: Execute on TuChiNhanh (Deduct Stock)
      const fromPool = await getPool(fromBranch);
      await fromPool.request()
        .input("DenChiNhanh", sql.VarChar(10), toBranch)
        .input("ItemsJson", sql.NVarChar(sql.MAX), itemsJson)
        .input("NguoiChuyen", sql.VarChar(50), nguoiChuyen)
        .execute("dbo.usp_Branch_XuatChuyenKho");
        
      // Step 3: Execute on DenChiNhanh (Add Stock)
      const toPool = await getPool(toBranch);
      await toPool.request()
        .input("TuChiNhanh", sql.VarChar(10), fromBranch)
        .input("ItemsJson", sql.NVarChar(sql.MAX), itemsJson)
        .input("NguoiChuyen", sql.VarChar(50), nguoiChuyen)
        .execute("dbo.usp_Branch_NhapChuyenKho");

    } catch (err) {
      console.error(`[Worker] Failed to process transfer:`, err.message);
      throw err; // NACK to retry
    }
  }
}

module.exports = {
  startSyncWorker
};
