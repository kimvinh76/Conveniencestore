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
        await pool
          .request()
          .input("MaNCC", mssql.VarChar, data.maNCC)
          .input("TenNCC", mssql.NVarChar, data.tenNCC)
          .input("DienThoai", mssql.VarChar, data.dienThoai || null)
          .input("DiaChi", mssql.NVarChar, data.diaChi || null)
          .input("Email", mssql.VarChar, data.email || null)
          .query("UPDATE dbo.NhaCungCap SET TenNCC = @TenNCC, DienThoai = @DienThoai, DiaChi = @DiaChi, Email = @Email, TrangThai = 1 WHERE MaNCC = @MaNCC");
        return { message: "Nhà cung cấp đã được kích hoạt lại hoạt động" };
      } else {
        throw new Error("Mã nhà cung cấp đã tồn tại và đang hoạt động");
      }
    }

    await pool
      .request()
      .input("MaNCC", mssql.VarChar, data.maNCC)
      .input("TenNCC", mssql.NVarChar, data.tenNCC)
      .input("DienThoai", mssql.VarChar, data.dienThoai || null)
      .input("DiaChi", mssql.NVarChar, data.diaChi || null)
      .input("Email", mssql.VarChar, data.email || null)
      .query("INSERT INTO dbo.NhaCungCap (MaNCC, TenNCC, DienThoai, DiaChi, Email, TrangThai) VALUES (@MaNCC, @TenNCC, @DienThoai, @DiaChi, @Email, 1)");
    return { message: "Tạo nhà cung cấp thành công" };
  }

async function updateSupplier(branch, id, data) {
    const pool = await getPool(branch);
    const result = await pool
      .request()
      .input("MaNCC", mssql.VarChar, id)
      .input("TenNCC", mssql.NVarChar, data.tenNCC)
      .input("DienThoai", mssql.VarChar, data.dienThoai || null)
      .input("DiaChi", mssql.NVarChar, data.diaChi || null)
      .input("Email", mssql.VarChar, data.email || null)
      .query("UPDATE dbo.NhaCungCap SET TenNCC = @TenNCC, DienThoai = @DienThoai, DiaChi = @DiaChi, Email = @Email WHERE MaNCC = @MaNCC");
    
    if (result.rowsAffected[0] === 0) {
      throw new Error("Không tìm thấy nhà cung cấp để cập nhật");
    }
    return { message: "Cập nhật nhà cung cấp thành công" };
  }

async function deleteSupplier(branch, id) {
    const pool = await getPool(branch);
    
    // Set TrangThai to 0 (Soft delete)
    const result = await pool
      .request()
      .input("MaNCC", mssql.VarChar, id)
      .query("UPDATE dbo.NhaCungCap SET TrangThai = 0 WHERE MaNCC = @MaNCC");

    if (result.rowsAffected[0] === 0) {
      throw new Error("Không tìm thấy nhà cung cấp để ngừng hoạt động");
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
