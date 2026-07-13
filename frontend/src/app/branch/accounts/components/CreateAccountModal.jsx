"use client";
import React from "react";

/**
 * CreateAccountModal — Modal tạo tài khoản mới cho nhân viên chi nhánh
 * 
 * Chỉ hiện nhân viên CHƯA có tài khoản (availableEmployees)
 * Nếu tất cả đã có acc → vô hiệu hóa nút Submit
 */
export default function CreateAccountModal({ form, setForm, onSubmit, onClose, availableEmployees }) {
  const allAssigned = availableEmployees.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Modal box */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Tạo tài khoản mới</h3>
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
              placeholder="VD: nhanvien01"
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </label>

          {/* Chọn nhân viên — chỉ nhân viên chưa có tài khoản */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">
              Nhân viên chưa có tài khoản
            </span>
            <select
              value={form.MaNV}
              onChange={(e) => setForm({ ...form, MaNV: e.target.value })}
              required
              disabled={allAssigned}
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">-- Chọn nhân viên --</option>
              {availableEmployees.map((emp) => (
                /* Hiển thị: Mã NV - Họ tên (để tránh nhầm lẫn) */
                <option key={emp.MaNV} value={emp.MaNV}>
                  {emp.MaNV} — {emp.HoTen}
                </option>
              ))}
            </select>

            {allAssigned && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                Tất cả nhân viên đều đã có tài khoản. Thêm nhân viên mới trước khi tạo tài khoản.
              </div>
            )}
          </label>



          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={allAssigned}
              className="btn-primary flex-1 disabled:bg-slate-300 disabled:cursor-not-allowed"
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
