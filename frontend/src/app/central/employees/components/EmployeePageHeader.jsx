export default function EmployeePageHeader({
  selectedBranch,
  setSelectedBranch,
  onAdd,
  onReload,
  loading,
}) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
        <h1 className="text-3xl font-bold text-slate-900">Quản lý Nhân sự Trung tâm</h1>
      </div>
      <div className="flex gap-3 items-center">
        <span className="text-sm font-medium text-slate-600">Chọn chi nhánh:</span>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="HUE">HUE</option>
          <option value="SAIGON">SAIGON</option>
          <option value="HANOI">HANOI</option>
        </select>
        <button className="btn-primary" onClick={onAdd}>+ Thêm nhân viên mới</button>
      </div>
    </header>
  );
}