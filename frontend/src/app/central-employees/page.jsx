"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import DataTable from "@/components/DataTable";
import { apiFetch } from "@/components/api";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ MaNV: "", HoTen: "", ChucVu: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = async (branch = selectedBranch) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/employees?branch=${branch}`);
      setRows(Array.isArray(result.data) ? result.data : result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const handleAdd = () => {
    setForm({ MaNV: "", HoTen: "", ChucVu: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setForm({ MaNV: emp.MaNV, HoTen: emp.HoTen, ChucVu: emp.ChucVu });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (maNV) => {
    if (!confirm(`Xóa nhân viên ${maNV} tại ${selectedBranch}?`)) return;
    try {
      await apiFetch(`/api/employees/${maNV}?branch=${selectedBranch}`, { method: "DELETE" });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/employees/${form.MaNV}?branch=${selectedBranch}` : `/api/employees`;
      const payload = isEditing ? { HoTen: form.HoTen, ChucVu: form.ChucVu } : { ...form, branch: selectedBranch };
      await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <CentralLayout active="employees">
      <div className="flex flex-col gap-6 w-full">
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
            <button className="btn-primary !bg-green-600" onClick={handleAdd}>+ Thêm NV</button>
            <button className="btn-primary" onClick={() => load()} disabled={loading}>
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Danh sách nhân viên tại {selectedBranch}</h2>
          </div>
          <div className="table-wrap">
            {loading && <p className="text-center py-10 text-slate-500">Đang truy vấn dữ liệu phân tán...</p>}
            {!loading && (
              <table>
                <thead>
                  <tr><th>Mã NV</th><th>Họ tên</th><th>Chức vụ</th><th className="text-right">Thao tác</th></tr>
                </thead>
                <tbody>
                  {rows.map(emp => (
                    <tr key={emp.MaNV}>
                      <td className="font-medium">{emp.MaNV}</td>
                      <td>{emp.HoTen}</td>
                      <td>{emp.ChucVu}</td>
                      <td className="text-right">
                        <button className="text-blue-600 mr-4 font-semibold" onClick={() => handleEdit(emp)}>Sửa</button>
                        <button className="text-red-600 font-semibold" onClick={() => handleDelete(emp.MaNV)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white max-w-md p-6 rounded-2xl">
             <h3 className="text-xl font-bold mb-4">{isEditing ? "Cập nhật NV" : "Thêm NV mới"} tại {selectedBranch}</h3>
             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <input placeholder="Mã NV" value={form.MaNV} onChange={e => setForm({...form, MaNV: e.target.value})} readOnly={isEditing} className="px-4 py-2 border rounded-lg" required />
               <input placeholder="Họ tên" value={form.HoTen} onChange={e => setForm({...form, HoTen: e.target.value})} className="px-4 py-2 border rounded-lg" required />
               <input placeholder="Chức vụ" value={form.ChucVu} onChange={e => setForm({...form, ChucVu: e.target.value})} className="px-4 py-2 border rounded-lg" required />
               <button type="submit" className="btn-primary">Lưu</button>
               <button type="button" className="btn-ghost border" onClick={() => setShowModal(false)}>Hủy</button>
             </form>
          </div>
        </dialog>
      )}
    </CentralLayout>
  );
}
