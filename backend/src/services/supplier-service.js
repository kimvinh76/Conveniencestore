const { getPool } = require("../db/sqlserver");
const mssql = require("mssql");
const { publishEvent } = require("../utils/rabbitmq");

async function listSuppliers(branch) {
    const pool = await getPool(branch);
    const result = await pool.request().query("SELECT MaNCC, TenNCC, DienThoai, DiaChi, Email, TrangThai FROM dbo.NhaCungCap ORDER BY TenNCC");
    return result.recordset;
  }

async function getSupplier(branch, id) {
    const pool = await getPool(branch);
    const result = await pool
      .request()
      .input("MaNCC", mssql.VarChar, id)
      .query("SELECT MaNCC, TenNCC, DienThoai, DiaChi, Email, TrangThai FROM dbo.NhaCungCap WHERE MaNCC = @MaNCC");
    return result.recordset[0] || null;
  }

async function createSupplier(branch, data) {
    const pool = await getPool(branch);
    
    // Check if supplier already exists (even if soft-deleted)
    const checkExist = await pool
      .request()
      .input("MaNCC", mssql.VarChar, data.maNCC)
      .query("SELECT TrangThai FROM dbo.NhaCungCap WHERE MaNCC = @MaNCC");

    if (checkExist.recordset.length > 0) {
      if (checkExist.recordset[0].TrangThai === 0) {
        // Reactivate soft-deleted supplier
        await pool.request()
          .input("MaNCC", mssql.VarChar(50), data.maNCC)
          .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
          .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
          .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
          .input("Email", mssql.VarChar(100), data.email || null)
          .input("TrangThai", mssql.Int, 1)
          .execute("dbo.usp_Chung_DongBoNhaCungCap");

        await publishEvent("master_data_sync", {
          event: "supplier.created",
          data
        });
        return { message: "Nhà cung cấp đã được kích hoạt lại hoạt động" };
      } else {
        throw new Error("Mã nhà cung cấp đã tồn tại và đang hoạt động");
      }
    }

    await pool.request()
      .input("MaNCC", mssql.VarChar(50), data.maNCC)
      .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
      .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
      .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
      .input("Email", mssql.VarChar(100), data.email || null)
      .input("TrangThai", mssql.Int, 1)
      .execute("dbo.usp_Chung_DongBoNhaCungCap");

    // 2. Publish event to MQ for branches
    await publishEvent("master_data_sync", {
      event: "supplier.created",
      data
    });

    return { message: "Tạo nhà cung cấp thành công" };
  }

async function updateSupplier(branch, id, data) {
    const pool = await getPool(branch);
    await pool.request()
      .input("MaNCC", mssql.VarChar(50), id)
      .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
      .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
      .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
      .input("Email", mssql.VarChar(100), data.email || null)
      .input("TrangThai", mssql.Int, 1) // Keep active
      .execute("dbo.usp_Chung_DongBoNhaCungCap");

    // Publish MQ Event for sync
    await publishEvent("master_data_sync", {
      event: "supplier.updated",
      data: { maNCC: id, ...data, active: 1 }
    });

    return { message: "Cập nhật nhà cung cấp thành công" };
  }

async function deleteSupplier(branch, id) {
    // Get existing supplier data from origin branch to retain information when setting TrangThai = 0
    const pool = await getPool(branch);
    const supplier = await pool.request().input("MaNCC", mssql.VarChar, id).query("SELECT * FROM dbo.NhaCungCap WHERE MaNCC = @MaNCC");
    
    if (supplier.recordset.length === 0) {
      throw new Error("Không tìm thấy nhà cung cấp để ngừng hoạt động");
    }
    const supData = supplier.recordset[0];

    await pool.request()
      .input("MaNCC", mssql.VarChar(50), id)
      .input("TenNCC", mssql.NVarChar(150), supData.TenNCC)
      .input("DienThoai", mssql.VarChar(20), supData.DienThoai || null)
      .input("DiaChi", mssql.NVarChar(255), supData.DiaChi || null)
      .input("Email", mssql.VarChar(100), supData.Email || null)
      .input("TrangThai", mssql.Int, 0) // Soft delete
      .execute("dbo.usp_Chung_DongBoNhaCungCap");

    // Publish MQ event
    await publishEvent("master_data_sync", {
      event: "supplier.status_toggled",
      data: { 
          maNCC: id, 
          tenNCC: supData.TenNCC,
          dienThoai: supData.DienThoai,
          diaChi: supData.DiaChi,
          email: supData.Email,
          active: 0 
      }
    });

    return { message: "Xóa nhà cung cấp (Soft Delete) thành công" };
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
