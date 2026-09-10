const { getPool } = require("../db/sqlserver");
const mssql = require("mssql");

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
        const branches = ["CENTRAL", "HANOI", "HUE", "SAIGON"];
        for (const b of branches) {
            try {
                const bPool = await getPool(b);
                await bPool.request()
                  .input("MaNCC", mssql.VarChar(50), data.maNCC)
                  .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
                  .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
                  .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
                  .input("Email", mssql.VarChar(100), data.email || null)
                  .input("TrangThai", mssql.Int, 1)
                  .execute("dbo.usp_Chung_DongBoNhaCungCap");
            } catch (e) {
                console.error(`Sync restore supplier ${data.maNCC} to ${b} failed:`, e.message);
            }
        }
        return { message: "Nhà cung cấp đã được kích hoạt lại hoạt động" };
      } else {
        throw new Error("Mã nhà cung cấp đã tồn tại và đang hoạt động");
      }
    }

    const branches = ["CENTRAL", "HANOI", "HUE", "SAIGON"];
    for (const b of branches) {
        try {
            const bPool = await getPool(b);
            await bPool.request()
              .input("MaNCC", mssql.VarChar(50), data.maNCC)
              .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
              .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
              .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
              .input("Email", mssql.VarChar(100), data.email || null)
              .input("TrangThai", mssql.Int, 1)
              .execute("dbo.usp_Chung_DongBoNhaCungCap");
        } catch (e) {
            console.error(`Sync create supplier ${data.maNCC} to ${b} failed:`, e.message);
        }
    }

    return { message: "Tạo nhà cung cấp thành công" };
  }

async function updateSupplier(branch, id, data) {
    const branches = ["CENTRAL", "HANOI", "HUE", "SAIGON"];
    let updated = false;
    for (const b of branches) {
        try {
            const bPool = await getPool(b);
            await bPool.request()
              .input("MaNCC", mssql.VarChar(50), id)
              .input("TenNCC", mssql.NVarChar(150), data.tenNCC)
              .input("DienThoai", mssql.VarChar(20), data.dienThoai || null)
              .input("DiaChi", mssql.NVarChar(255), data.diaChi || null)
              .input("Email", mssql.VarChar(100), data.email || null)
              .input("TrangThai", mssql.Int, 1) // Keep active
              .execute("dbo.usp_Chung_DongBoNhaCungCap");
            updated = true;
        } catch (e) {
            console.error(`Sync update supplier ${id} to ${b} failed:`, e.message);
        }
    }
    
    if (!updated) {
      throw new Error("Không thể cập nhật nhà cung cấp");
    }
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

    const branches = ["CENTRAL", "HANOI", "HUE", "SAIGON"];
    for (const b of branches) {
        try {
            const bPool = await getPool(b);
            await bPool.request()
              .input("MaNCC", mssql.VarChar(50), id)
              .input("TenNCC", mssql.NVarChar(150), supData.TenNCC)
              .input("DienThoai", mssql.VarChar(20), supData.DienThoai || null)
              .input("DiaChi", mssql.NVarChar(255), supData.DiaChi || null)
              .input("Email", mssql.VarChar(100), supData.Email || null)
              .input("TrangThai", mssql.Int, 0) // Soft delete
              .execute("dbo.usp_Chung_DongBoNhaCungCap");
        } catch (e) {
            console.error(`Sync delete supplier ${id} to ${b} failed:`, e.message);
        }
    }

    return { message: "Ngừng hoạt động nhà cung cấp thành công" };
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
