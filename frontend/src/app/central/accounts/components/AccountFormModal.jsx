"use client";
import React from "react";

/**
 * AccountFormModal — dùng chung cho tạo mới tài khoản tại Central
 */
export default function AccountFormModal({
  form,
  setForm,
  onSubmit,
  onClose,
  availableEmployees,
}) {
  const allAssigned = availableEmployees.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="p-6 border-b border-indigo-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            Tạo tài khoản mới
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {/* Tên đăng nhập */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Tên đăng nhập</span>
            <input
              value={form.TenDangNhap}
              onChange={(e) => setForm({ ...form, TenDangNhap: e.target.value })}
              required
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          {/* Mật khẩu */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Mật khẩu</span>
            <input
              type="password"
              value={form.MatKhau}
              onChange={(e) => setForm({ ...form, MatKhau: e.target.value })}
              required
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          {/* Nhân viên */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">
              Nhân viên chưa có tài khoản
            </span>

            <select
              value={form.MaNV}
              onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
              required
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Chọn nhân viên --</option>
              {availableEmployees.map((emp) => (
                <option key={emp.MaNV} value={emp.MaNV}>
                  {emp.HoTen} ({emp.MaNV}) - {emp.ChiNhanh}
                </option>
              ))}
            </select>

            {allAssigned && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                Tất cả nhân viên đều đã có tài khoản. Thêm nhân viên mới trước khi tạo tài khoản.
              </div>
            )}
          </div>



          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={allAssigned}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex-1 transition-colors"
            >
              Tạo tài khoản
            </button>
            <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
