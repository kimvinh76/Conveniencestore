"use client";
import { useEffect, useState, useRef } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ MaNV: "", HoTen: "", ChucVu: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [result, setResult] = useState("Chưa có thao tác.");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const canManage = auth?.role === "ADMIN_CHI_NHANH" || auth?.role === "ADMIN_TOAN_BO";

  const formModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  const loadEmployees = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/employees?branch=${branch}`);
      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees().catch(() => {});
  }, [branch]);

  const openAddModal = () => {
    setForm({ MaNV: "", HoTen: "", ChucVu: "" });
    setIsEditing(false);
    formModalRef.current?.showModal();
  };

  const openEditModal = (emp) => {
    setForm({ MaNV: emp.MaNV, HoTen: emp.HoTen, ChucVu: emp.ChucVu });
    setIsEditing(true);
    formModalRef.current?.showModal();
  };

  const closeFormModal = () => {
    formModalRef.current?.close();
  };

  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    deleteModalRef.current?.showModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch) return;
    try {
      const payload = { ...form, branch };
      let res;
      if (isEditing) {
        res = await apiFetch(`/api/employees/${form.MaNV}?branch=${branch}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ HoTen: payload.HoTen, ChucVu: payload.ChucVu }),
        });
      } else {
        res = await apiFetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setResult(JSON.stringify(res, null, 2));
      closeFormModal();
      loadEmployees();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const confirmDelete = async () => {
    if (!employeeToDelete || !branch) return;
    try {
      const res = await apiFetch(`/api/employees/${employeeToDelete.MaNV}?branch=${branch}`, {
        method: "DELETE",
      });
      setResult(JSON.stringify(res, null, 2));
      deleteModalRef.current?.close();
      loadEmployees();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  return (
    <BranchLayout active="employees">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý nhân viên</h1>
          </div>
          <div className="flex gap-3">
            {canManage && (
              <button className="btn-primary" onClick={openAddModal}>
                + Thêm nhân viên
              </button>
            )}
            <button className="btn-ghost border border-slate-200" onClick={loadEmployees}>
              {loading ? "Đang tải..." : "Tải lại danh sách"}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 w-full">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
            <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách nhân viên</h2>
            <div className="table-wrap flex-1 overflow-y-auto">
              <table>
                <thead>
                  <tr><th>Mã NV</th><th>Họ tên</th><th>Chức vụ</th>{canManage && <th className="text-right">Thao tác</th>}</tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.MaNV}>
                      <td className="font-medium text-slate-800">{emp.MaNV}</td>
                      <td>{emp.HoTen}</td>
                      <td>{emp.ChucVu}</td>
                      {canManage && (
                        <td className="text-right">
                          <button onClick={() => openEditModal(emp)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-semibold">Sửa</button>
                          <button onClick={() => openDeleteModal(emp)} className="text-red-600 hover:text-red-800 text-sm font-semibold">Xóa</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {employees.length === 0 && !loading && <tr><td colSpan={canManage ? "4" : "3"} className="text-center py-8 text-slate-500">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-slate-900 text-green-400 p-4 rounded-xl shadow-inner font-mono text-sm overflow-x-auto h-48">
            <h3 className="text-slate-400 mb-2 font-sans text-xs font-bold uppercase tracking-widest">Logs</h3>
            <pre>{result}</pre>
          </section>
        </div>
      </div>

      {/* Form Modal Thêm/Sửa */}
      <dialog ref={formModalRef} className="modal w-full max-w-md bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">{isEditing ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}</h3>
          <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Mã nhân viên</span>
            <input value={form.MaNV} onChange={(e) => setForm({ ...form, MaNV: e.target.value })} required readOnly={isEditing} className={`px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isEditing ? "bg-slate-100 text-slate-500" : ""}`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Họ tên</span>
            <input value={form.HoTen} onChange={(e) => setForm({ ...form, HoTen: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Chức vụ</span>
            <input value={form.ChucVu} onChange={(e) => setForm({ ...form, ChucVu: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </label>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1">{isEditing ? "Lưu thay đổi" : "Thêm nhân viên"}</button>
            <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={closeFormModal}>Hủy</button>
          </div>
        </form>
      </dialog>

      {/* Modal Xác nhận Xóa */}
      <dialog ref={deleteModalRef} className="modal w-full max-w-sm bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-red-600">Xác nhận xóa</h3>
          <button onClick={() => deleteModalRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6">Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-900">{employeeToDelete?.HoTen}</strong> ({employeeToDelete?.MaNV}) không? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3">
            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex-1 transition-colors">
              Xóa nhân viên
            </button>
            <button onClick={() => deleteModalRef.current?.close()} className="btn-ghost flex-1 border border-slate-200">Hủy</button>
          </div>
        </div>
      </dialog>
    </BranchLayout>
  );
}