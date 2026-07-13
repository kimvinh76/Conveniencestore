const EmployeeFormModal = function EmployeeFormModal({ form, setForm, isEditing, handleSubmit, onClose, isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
            <select
              value={form.ChucVu || ''}
              onChange={(e) => setForm({ ...form, ChucVu: e.target.value })}
              required
              className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="" disabled>Chọn chức vụ</option>

              <option value="Quản lý chi nhánh">Quản lý chi nhánh</option>
              <option value="Nhân viên bán hàng">Nhân viên bán hàng</option>
              <option value="Nhân viên kho">Nhân viên kho</option>
            </select>
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
      </div>
    </div>
  );
};

export default EmployeeFormModal;