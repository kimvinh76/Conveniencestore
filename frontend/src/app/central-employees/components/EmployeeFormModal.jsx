import { forwardRef } from "react";

const EmployeeFormModal = forwardRef(function EmployeeFormModal({ form, setForm, isEditing, handleSubmit, onClose }, ref) {
  return (
    <dialog ref={ref} className="modal w-full max-w-md bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">
          {isEditing ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Mã nhân viên</span>
          <input value={form.MaNV} onChange={(e) => setForm({ ...form, MaNV: e.target.value })} required readOnly={isEditing} className={`px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? "bg-slate-100 text-slate-500" : ""}`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Họ tên</span>
          <input value={form.HoTen} onChange={(e) => setForm({ ...form, HoTen: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Chức vụ</span>
          <input value={form.ChucVu} onChange={(e) => setForm({ ...form, ChucVu: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input type="email" value={form.Email || ''} onChange={(e) => setForm({ ...form, Email: e.target.value })} className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </label>
        <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1">{isEditing ? "Lưu thay đổi" : "Thêm nhân viên"}</button>
            <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={onClose}>Hủy</button>
        </div>
      </form>
    </dialog>
  );
});

export default EmployeeFormModal;