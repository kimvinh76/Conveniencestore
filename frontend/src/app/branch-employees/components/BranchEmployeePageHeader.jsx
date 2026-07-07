"use client";

export default function BranchEmployeePageHeader({ onAdd, onReload, loading, canManage }) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
        <h1 className="text-3xl font-bold text-slate-900">Quản lý Nhân viên</h1>
      </div>
      <div className="flex items-center gap-3">
        {canManage && (
          <button className="btn-primary" onClick={onAdd}>
            + Thêm nhân viên
          </button>
        )}
        <button className="btn-ghost border border-slate-200" onClick={onReload} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>
    </header>
  );
}