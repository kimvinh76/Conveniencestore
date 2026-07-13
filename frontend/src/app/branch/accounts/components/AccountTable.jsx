"use client";
import React from "react";

/**
 * AccountTable — hiển thị danh sách tài khoản và nút thao tác
 */
export default function AccountTable({ accounts, loading, employees, canManage, onLock, onResetPassword, searchTerm, setSearchTerm, filteredAccounts }) {
  const getEmployeeName = (maNV) => {
    const emp = employees.find((e) => e.MaNV === maNV);
    return emp ? emp.HoTen : maNV;
  };

  const roleBadge = (role) => {
    const s =
      role === "ADMIN_TOAN_BO"
        ? "bg-purple-100 text-purple-700"
        : role === "ADMIN_CHI_NHANH"
          ? "bg-orange-100 text-orange-700"
          : "bg-slate-100 text-slate-600";
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s}`}>
        {role}
      </span>
    );
  };

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
      {/* Header thanh tìm kiếm */}
      <div className="flex justify-between items-center mb-5 gap-4">
        <h2 className="text-xl font-bold text-slate-800">
          Danh sách tài khoản
          <span className="ml-2 text-sm font-normal text-slate-400">({filteredAccounts.length})</span>
        </h2>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm tài khoản..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 w-64 text-sm bg-slate-50"
        />
      </div>

      {/* Bảng tài khoản */}
      <div className="table-wrap flex-1 overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Nhân viên (Mã NV)</th>
              <th>Quyền</th>
              <th>Trạng thái</th>
              {canManage && <th className="text-right">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.TenDangNhap}>
                <td className="font-medium text-slate-800">{acc.TenDangNhap}</td>
                <td>
                  <span className="font-semibold">{getEmployeeName(acc.MaNV)}</span>
                  <span className="ml-1.5 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{acc.MaNV}</span>
                </td>
                <td>{roleBadge(acc.Quyen)}</td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${Number(acc.TrangThai) === 1 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${Number(acc.TrangThai) === 1 ? "bg-green-500" : "bg-red-500"}`}></span>
                    {Number(acc.TrangThai) === 1 ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                {canManage && (
                  <td className="text-right">
                    {acc.Quyen === "NHAN_VIEN" ? (
                      <>
                        <button
                          onClick={() => onResetPassword(acc)}
                          className="text-sm font-semibold px-2 py-1 mr-2 rounded-lg transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          Cấp lại MK
                        </button>
                        <button
                          onClick={() => onLock(acc)}
                          className={`text-sm font-semibold px-3 py-1 rounded-lg transition-colors ${Number(acc.TrangThai) === 1
                            ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                        >
                          {Number(acc.TrangThai) === 1 ? "Khóa" : "Mở khóa"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">Bảo vệ bảo mật</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {accounts.length === 0 && !loading && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="text-center py-8 text-slate-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
