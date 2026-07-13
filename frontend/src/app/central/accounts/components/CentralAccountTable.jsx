"use client";
import React from "react";

/**
 * CentralAccountTable — bảng danh sách tài khoản toàn hệ thống
 */
export default function CentralAccountTable({
  accounts,
  loading,
  filteredAccounts,
  searchTerm,
  setSearchTerm,
  onLockToggle,
  onResetPassword,
}) {
  const roleBadge = (role) => {
    const map = {
      ADMIN_TOAN_BO: { cls: "bg-purple-100 text-purple-700", label: "Admin Toàn Bộ" },
      ADMIN_CHI_NHANH: { cls: "bg-orange-100 text-orange-700", label: "Admin Chi Nhánh" },
      NHAN_VIEN: { cls: "bg-slate-100 text-slate-600", label: "Nhân Viên" },
    };
    const s = map[role] || { cls: "bg-gray-100 text-gray-600", label: role };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>{s.label}</span>;
  };

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col min-h-[500px]">
      {/* Thanh tiêu đề + tìm kiếm */}
      <div className="flex justify-between items-center mb-5 gap-4">
        <h2 className="text-xl font-bold text-slate-800">
          Danh sách tài khoản
          <span className="ml-2 text-sm font-normal text-slate-400">({filteredAccounts.length} tài khoản)</span>
        </h2>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm tài khoản..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm bg-slate-50"
        />
      </div>

      {/* Table */}
      <div className="table-wrap flex-1 overflow-y-auto">
        <table>
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Nhân viên (Mã NV)</th>
              <th>Chi nhánh</th>
              <th>Quyền</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.TenDangNhap}>
                <td className="font-medium text-slate-800">{acc.TenDangNhap}</td>
                <td>
                  <span className="font-semibold">{acc.HoTen}</span>
                  <span className="ml-1.5 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    {acc.MaNV}
                  </span>
                </td>
                <td>{acc.ChiNhanh}</td>
                <td>{roleBadge(acc.Quyen)}</td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      Number(acc.TrangThai) === 1 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        Number(acc.TrangThai) === 1 ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {Number(acc.TrangThai) === 1 ? "Hoạt động" : "Đã khóa"}
                  </span>
                </td>
                <td className="text-right">
                  {acc.Quyen !== "ADMIN_TOAN_BO" ? (
                    <>
                      <button
                        onClick={() => onResetPassword(acc)}
                        className="text-sm font-semibold px-2 py-1 mr-2 rounded-lg transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        Cấp lại MK
                      </button>
                      <button
                        onClick={() => onLockToggle(acc)}
                        className={`text-sm font-semibold px-2 py-1 rounded-lg transition-colors ${
                          Number(acc.TrangThai) === 1
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
              </tr>
            ))}
            {accounts.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
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
