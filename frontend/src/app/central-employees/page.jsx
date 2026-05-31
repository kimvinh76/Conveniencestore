"use client";
import { useEffect, useState, useRef } from "react";

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
  const [toast, setToast] = useState({ message: "", type: null });
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const formModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 3000);
  };

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
    formModalRef.current?.showModal();
  };

  const handleEdit = (emp) => {
    setForm({ MaNV: emp.MaNV, HoTen: emp.HoTen, ChucVu: emp.ChucVu });
    setIsEditing(true);
    formModalRef.current?.showModal();
  };

  const handleDelete = async (maNV) => {
    setEmployeeToDelete(maNV);
    deleteModalRef.current?.showModal();
  };

  const confirmDelete = async () => {
    try {
      await apiFetch(`/api/employees/${employeeToDelete}?branch=${selectedBranch}`, { method: "DELETE" });
      deleteModalRef.current?.close();
      showNotification(`Đã xóa nhân viên ${employeeToDelete} thành công`);
      load();
    } catch (err) { showNotification(err.message, "error"); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/employees/${form.MaNV}?branch=${selectedBranch}` : `/api/employees`;
      const payload = isEditing ? { HoTen: form.HoTen, ChucVu: form.ChucVu } : { ...form, branch: selectedBranch };
      await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      showNotification(isEditing ? "Cập nhật nhân viên thành công" : "Thêm nhân viên mới thành công");
      formModalRef.current?.close();
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
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
            <button className="btn-primary" onClick={handleAdd}>+ Thêm nhân viên</button>
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

      {/* Form Modal Thêm/Sửa */}
      <dialog ref={formModalRef} className="modal w-full max-w-md bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">
            {isEditing ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
          </h3>
          <button onClick={() => formModalRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
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
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1">{isEditing ? "Lưu thay đổi" : "Thêm nhân viên"}</button>
            <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={() => formModalRef.current?.close()}>Hủy</button>
          </div>
        </form>
      </dialog>

      {/* Modal Xác nhận xóa */}
      <dialog ref={deleteModalRef} className="modal w-full max-w-sm bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-600">
          <h3 className="text-xl font-bold">Xác nhận xóa nhân sự</h3>
          <button onClick={() => deleteModalRef.current?.close()} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 text-center">Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-900">{employeeToDelete}</strong> tại chi nhánh {selectedBranch}? Dữ liệu sẽ được xóa khỏi phân mảnh tương ứng.</p>
          <div className="flex gap-3">
            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all">Xóa ngay</button>
            <button onClick={() => deleteModalRef.current?.close()} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
          </div>
        </div>
      </dialog>

      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl transition-all animate-bounce z-[100] flex items-center gap-3 border ${
          toast.type === "error" ? "bg-white border-red-200 text-red-600" : "bg-white border-emerald-200 text-emerald-600"
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${toast.type === "error" ? "bg-red-100" : "bg-emerald-100"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </CentralLayout>
  );
}
