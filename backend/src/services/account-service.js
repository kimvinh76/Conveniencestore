const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../db/sqlserver");
const { publishEvent } = require("../utils/rabbitmq");

// ========== HELPER FUNCTIONS ==========

/**
 * Lookup nhân viên trên các node phân tán → tự động ánh xạ ChucVu → Quyen
 * @param {string} MaNV - Mã nhân viên
 * @param {string|null} targetBranch - Chi nhánh cụ thể (nếu null → tìm trên tất cả node)
 * @returns {{ assignedRole: string, chiNhanh: string }}
 */
async function resolveEmployeeRole(MaNV, targetBranch = null) {
  const branches = targetBranch ? [targetBranch] : ["CENTRAL", "HANOI", "HUE", "SAIGON"];

  for (const b of branches) {
    try {
      const pool = await getPool(b);
      const result = await pool.request()
        .input("MaNV", sql.VarChar(50), MaNV)
        .query("SELECT ChucVu, ChiNhanh FROM dbo.NhanVien WHERE MaNV = @MaNV");

      if (result.recordset && result.recordset.length > 0) {
        const { ChucVu, ChiNhanh } = result.recordset[0];
        const assignedRole =
          ChucVu === "Quản trị hệ thống" ? "ADMIN_TOAN_BO" :
          ChucVu === "Quản lý chi nhánh" ? "ADMIN_CHI_NHANH" :
          "NHAN_VIEN";
        return { assignedRole, chiNhanh: ChiNhanh || b };
      }
    } catch (err) {
      // Node không khả dụng → bỏ qua, tìm node tiếp
      console.warn(`[resolveEmployeeRole] Không thể truy cập node ${b}:`, err.message);
    }
  }

  // Không tìm thấy nhân viên trên bất kỳ node nào
  const err = new Error("Nhân viên không tồn tại trong hệ thống!");
  err.statusCode = 400;
  throw err;
}

// ========== SERVICE DÀNH CHO CENTRAL (ADMIN_TOAN_BO) ==========

/**
 * Xem toàn bộ tài khoản từ tất cả các node (parallel fetch, dedup by TenDangNhap)
 */
async function listAllAccountsFromCentral() {
  const BRANCHES = ["CENTRAL", "HANOI", "HUE", "SAIGON"];
  const accountsMap = new Map();

  await Promise.all(
    BRANCHES.map(async (branch) => {
      try {
        const pool = await getPool(branch);
        const result = await pool.request().execute("dbo.usp_Local_DanhSachTaiKhoan");
        const rows = result.recordset || [];
        for (const row of rows) {
          const acc = {
            TenDangNhap: row.TenDangNhap,
            MaNV: row.MaNV,
            HoTen: row.HoTen,
            Quyen: row.Quyen,
            TrangThai: row.TrangThai,
            ChiNhanh: row.ChiNhanh || branch
          };
          if (!accountsMap.has(acc.TenDangNhap)) {
            accountsMap.set(acc.TenDangNhap, acc);
          }
        }
      } catch (err) {
        console.error(`[ACCOUNT SERVICE] Lỗi lấy danh sách tài khoản từ ${branch}:`, err.message);
      }
    })
  );

  return Array.from(accountsMap.values());
}

/**
 * Tạo tài khoản mới — tự resolve ChucVu → Quyen từ DB
 * Flow: resolve role → hash password → insert CENTRAL → sync Branch
 * @param {Object} payload - { TenDangNhap, MatKhau, MaNV, TrangThai, targetBranch? }
 *   - targetBranch: nếu có → chỉ tìm NV ở branch đó (cho Admin Chi nhánh)
 *   - nếu không → tìm trên tất cả node (cho Admin Toàn bộ)
 */
async function createAccount(payload) {
  // 1. Resolve chức vụ → quyền tự động từ DB
  const { assignedRole, chiNhanh } = await resolveEmployeeRole(
    payload.MaNV,
    payload.targetBranch || null
  );

  // 2. Hash mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.MatKhau, salt);
  const trangThai = payload.TrangThai !== undefined ? (payload.TrangThai ? 1 : 0) : 1;

  // 3. Insert vào CENTRAL (SP sẽ THROW nếu trùng Username hoặc NV đã có tài khoản)
  const centralPool = await getPool("CENTRAL");
  await centralPool
    .request()
    .input("TenDangNhap", sql.VarChar(50), payload.TenDangNhap)
    .input("MatKhau", sql.VarChar(255), hashedPassword)
    .input("MaNV", sql.VarChar(50), payload.MaNV)
    .input("Quyen", sql.NVarChar(50), assignedRole)
    .input("TrangThai", sql.Bit, trangThai)
    .execute("dbo.usp_Chung_ThemTaiKhoan");

  // 4. Publish event to MQ for branch sync
  if (chiNhanh && chiNhanh !== "CENTRAL") {
    await publishEvent("master_data_sync", {
      event: "account.created",
      data: { 
        TenDangNhap: payload.TenDangNhap, 
        MatKhau: hashedPassword, 
        MaNV: payload.MaNV, 
        Quyen: assignedRole, 
        TrangThai: trangThai,
        ChiNhanh: chiNhanh 
      }
    });
  }

  return { TenDangNhap: payload.TenDangNhap, MaNV: payload.MaNV, Quyen: assignedRole };
}

/**
 * Khóa tài khoản (CENTRAL + sync Branch)
 * SP usp_Chung_CapNhatTrangThaiTaiKhoan sẽ THROW 50003 nếu tài khoản là Admin
 */
async function lockAccount(username, branch) {
  // Gọi thẳng SP trên CENTRAL — SP đã chặn khóa Admin (THROW 50003)
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("TrangThai", sql.Bit, 0)
    .execute("dbo.usp_Chung_CapNhatTrangThaiTaiKhoan");

  // Publish event to MQ
  if (branch && branch !== "CENTRAL") {
    await publishEvent("master_data_sync", {
      event: "account.status_toggled",
      data: { TenDangNhap: username, TrangThai: 0, ChiNhanh: branch }
    });
  }

  return { TenDangNhap: username, TrangThai: 0 };
}

/**
 * Mở khóa tài khoản (CENTRAL + sync Branch)
 * SP sẽ THROW 50001 nếu tài khoản không tồn tại
 */
async function unlockAccount(username, branch) {
  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("TrangThai", sql.Bit, 1)
    .execute("dbo.usp_Chung_CapNhatTrangThaiTaiKhoan");

  // Publish event to MQ
  if (branch && branch !== "CENTRAL") {
    await publishEvent("master_data_sync", {
      event: "account.status_toggled",
      data: { TenDangNhap: username, TrangThai: 1, ChiNhanh: branch }
    });
  }

  return { TenDangNhap: username, TrangThai: 1 };
}

/**
 * Reset password — Admin gọi, force mật khẩu mới (CENTRAL + sync Branch)
 */
async function resetPassword(username, newPassword, branch) {
  const { hashPassword } = require("./auth-service");
  const hashedNewPassword = await hashPassword(newPassword);

  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .execute("dbo.usp_Chung_CapNhatMatKhau");

  // Publish event to MQ
  if (branch && branch !== "CENTRAL") {
    await publishEvent("master_data_sync", {
      event: "account.password_reset",
      data: { TenDangNhap: username, MatKhau: hashedNewPassword, ChiNhanh: branch }
    });
  }

  return { TenDangNhap: username };
}

// ========== SERVICE DÀNH CHO CHI NHÁNH (ADMIN_CHI_NHANH) ==========

/**
 * Xem danh sách tài khoản của 1 chi nhánh (gọi xuống local DB)
 */
async function listAccountsByBranch(branch) {
  const pool = await getPool(branch);
  const result = await pool.request().execute("dbo.usp_Local_DanhSachTaiKhoan");
  return result.recordset;
}



// ========== SERVICE CHO NHAN_VIEN ==========

/**
 * Đổi mật khẩu cá nhân (xác thực mật khẩu cũ → cập nhật CENTRAL + sync Branch)
 */
async function changeOwnPassword(username, oldPassword, newPassword) {
  const { findAccountForLogin, hashPassword, verifyPassword } = require("./auth-service");

  // Xác thực mật khẩu cũ
  const account = await findAccountForLogin(username);
  if (!account) {
    const err = new Error("Không tìm thấy tài khoản!");
    err.statusCode = 400;
    throw err;
  }

  const passwordOk = await verifyPassword(oldPassword, account.MatKhau);
  if (!passwordOk) {
    const err = new Error("Mật khẩu cũ không chính xác!");
    err.statusCode = 400;
    throw err;
  }

  const hashedNewPassword = await hashPassword(newPassword);

  const centralPool = await getPool("CENTRAL");
  await centralPool.request()
    .input("TenDangNhap", sql.VarChar(50), username)
    .input("MatKhau", sql.VarChar(255), hashedNewPassword)
    .execute("dbo.usp_Chung_CapNhatMatKhau");

  // Publish event to MQ
  if (account.ChiNhanh && account.ChiNhanh !== "CENTRAL") {
    await publishEvent("master_data_sync", {
      event: "account.password_reset",
      data: { TenDangNhap: username, MatKhau: hashedNewPassword, ChiNhanh: account.ChiNhanh }
    });
  }

  return { message: "Đổi mật khẩu thành công" };
}



module.exports = {
  // Helper (export cho test/reuse nếu cần)
  resolveEmployeeRole,

  // Central functions
  listAllAccountsFromCentral,
  createAccount,
  lockAccount,
  unlockAccount,
  resetPassword,

  // Branch functions
  listAccountsByBranch,

  // Personal
  changeOwnPassword,
};