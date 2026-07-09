"use client";
import React from "react";

/**
 * AccountFormModal — dùng chung cho cả TẠO MỚI và CẬP NHẬT tài khoản tại Central
 *
 * Khi isEditing = false → Tạo mới: hiện dropdown nhân viên chưa có acc
 * Khi isEditing = true  → Cập nhật: MaNV và TenDangNhap bị khóa (readOnly/disabled),
 *                          chỉ cho phép đổi Quyền

 */
export default function AccountFormModal({
  isEditing,
  form,
  setForm,
  onSubmit,
  onClose,
  availableEmployees,
}) {
  const allAssigned = availableEmployees.length === 0 && !isEditing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="p-6 border-b border-indigo-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            {isEditing ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-4">
          {/* Tên đăng nhập — readOnly khi edit */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Tên đăng nhập</span>
            <input
              value={form.TenDangNhap}
              onChange={(e) => setForm({ ...form, TenDangNhap: e.target.value })}
              required
              readOnly={isEditing}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" : "border-slate-300"
                }`}
            />
          </label>

          {/* Mật khẩu — chỉ hiện khi tạo mới */}
          {!isEditing && (
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
          )}

          {/* Nhân viên */}
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">
              {isEditing ? "Nhân viên" : "Nhân viên chưa có tài khoản"}
            </span>

            {isEditing ? (
              /* Chế độ Edit: hiện info card thay vì select disabled (rõ hơn, không bị mờ) */
              (() => {
                const emp = availableEmployees[0];
                return emp ? (
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {emp.HoTen?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{emp.HoTen}</p>
                      <p className="text-xs text-slate-400">
                        <span className="font-mono bg-slate-100 px-1 rounded">{emp.MaNV}</span>
                        <span className="mx-1">·</span>
                        {emp.ChiNhanh}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Trường hợp employees chưa load xong */
                  <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm font-mono">
                    {form.MaNV}
                  </div>
                );
              })()
            ) : (
              /* Chế độ Tạo mới: dropdown chọn nhân viên chưa có acc */
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
            )}

            {allAssigned && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                Tất cả nhân viên đều đã có tài khoản. Thêm nhân viên mới trước khi tạo tài khoản.
              </div>
            )}
          </div>

          {/* Quyền — disabled nếu đang edit tài khoản ADMIN_TOAN_BO */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Quyền</span>
            <select
              value={form.Quyen}
              onChange={(e) => setForm({ ...form, Quyen: e.target.value })}
              required
              disabled={isEditing && form.Quyen === "ADMIN_TOAN_BO"}
              className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing && form.Quyen === "ADMIN_TOAN_BO"
                ? "bg-slate-100 border-slate-200 text-slate-500 appearance-none"
                : "border-slate-300"
                }`}
            >
              {isEditing && form.Quyen === "ADMIN_TOAN_BO" ? (
                <option value="ADMIN_TOAN_BO">ADMIN_TOAN_BO - Admin toàn bộ</option>
              ) : (
                ["NHAN_VIEN", "ADMIN_CHI_NHANH"].map((role) => (
                  <option key={role} value={role}>
                    {role === "NHAN_VIEN" ? "NHAN_VIEN - Nhân viên" : "ADMIN_CHI_NHANH - Admin chi nhánh"}
                  </option>
                ))
              )}
            </select>
          </label>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={allAssigned}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex-1 transition-colors"
            >
              {isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}
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
