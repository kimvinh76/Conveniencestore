"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";
import { useModal } from "@/hooks/useModal";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ TenDangNhap: "", MatKhau: "", MaNV: "" });
  const [result, setResult] = useState("Chưa có thao tác.");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();

  // Chặn truy cập nếu là NHAN_VIEN cố tình gõ URL
  if (isNhanVien) {
    return (
      <BranchLayout active="accounts">
        <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center mt-10">
          <h2 className="text-3xl font-bold mb-3"> Truy cập bị từ chối</h2>
          <p className="text-lg">Bạn không có quyền xem trang Quản lý tài khoản chi nhánh.</p>
        </div>
      </BranchLayout>
    );
  }

  const loadAccounts = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/accounts/branch?branch=${branch}`);
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!branch) return;
    try {
      const res = await apiFetch(`/api/employees?branch=${branch}`);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (_) {}
  };

  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()]).catch(() => {});
  }, [branch]);

  const openAddModal = () => {
    setForm({ TenDangNhap: "", MatKhau: "", MaNV: "" });
    openFormModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch) return;
    try {
      const res = await apiFetch("/api/accounts/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenDangNhap: form.TenDangNhap,
          MatKhau: form.MatKhau,
          MaNV: form.MaNV,
          ChiNhanh: branch,
        }),
      });
      setResult(JSON.stringify(res, null, 2));
      closeFormModal();
      loadAccounts();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleLock = async (acc) => {
    if (!branch) return;
    const isLocked = Number(acc.TrangThai) === 0;
    const endpoint = isLocked ? "unlock" : "lock";
    try {
      const res = await apiFetch(`/api/accounts/branch/${acc.TenDangNhap}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      setResult(JSON.stringify(res, null, 2));
      loadAccounts();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const getEmployeeName = (maNV) => {
    const emp = employees.find(e => e.MaNV === maNV);
    return emp ? emp.HoTen : maNV;
  };

  return (
    <BranchLayout active="accounts">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tài khoản</h1>
          </div>
          <div className="flex gap-3">
            {canManage && (
              <button className="btn-primary" onClick={openAddModal}>
                + Tạo tài khoản
              </button>
            )}
            <button className="btn-ghost border border-slate-200" onClick={loadAccounts}>
              {loading ? "Đang tải..." : "Tải lại"}
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
            <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách tài khoản</h2>
            <div className="table-wrap flex-1 overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>Tên đăng nhập</th>
                    <th>Nhân viên</th>
                    <th>Quyền</th>
                    <th>Trạng thái</th>
                    {canManage && <th className="text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.TenDangNhap}>
                      <td className="font-medium text-slate-800">{acc.TenDangNhap}</td>
                      <td>{getEmployeeName(acc.MaNV)} ({acc.MaNV})</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          acc.Quyen === "ADMIN_TOAN_BO" ? "bg-purple-100 text-purple-700" :
                          acc.Quyen === "ADMIN_CHI_NHANH" ? "bg-orange-100 text-orange-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {acc.Quyen}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-block w-3 h-3 rounded-full ${Number(acc.TrangThai) === 1 ? "bg-green-500" : "bg-red-500"}`}></span>
                        <span className="ml-1 text-sm">{Number(acc.TrangThai) === 1 ? "Hoạt động" : "Đã khóa"}</span>
                      </td>
                      {canManage && (
                        <td className="text-right">
                          {acc.Quyen === "NHAN_VIEN" ? (
                            <>
                              <button
                                onClick={() => handleLock(acc)}
                                className={`text-sm font-semibold mr-3 ${Number(acc.TrangThai) === 1 ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}`}
                              >
                                {Number(acc.TrangThai) === 1 ? "Khóa" : "Mở khóa"}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">Bảo vệ bảo mật</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {accounts.length === 0 && !loading && (
                    <tr><td colSpan={canManage ? "5" : "4"} className="text-center py-8 text-slate-500">Chưa có dữ liệu</td></tr>
                  )}
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

      {/* Lọc danh sách nhân viên chưa có tài khoản */}
      {isFormOpen && (() => {
        const availableEmployees = employees.filter(emp => !accounts.some(acc => acc.MaNV === emp.MaNV));
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Tạo tài khoản mới</h3>
                <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Tên đăng nhập</span>
                  <input value={form.TenDangNhap} onChange={(e) => setForm({ ...form, TenDangNhap: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Mật khẩu</span>
                  <input type="password" value={form.MatKhau} onChange={(e) => setForm({ ...form, MatKhau: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Nhân viên</span>
                  <select value={form.MaNV} onChange={(e) => setForm({ ...form, MaNV: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">-- Chọn nhân viên --</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.MaNV} value={emp.MaNV}>{emp.MaNV} - {emp.HoTen}</option>
                    ))}
                  </select>
                  {availableEmployees.length === 0 && (
                    <span className="text-xs text-red-500 mt-1">Tất cả nhân viên đều đã có tài khoản.</span>
                  )}
                </label>
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg text-sm">
                   Tài khoản sẽ được tạo với quyền <strong>NHAN_VIEN</strong>. Muốn nâng quyền, liên hệ Admin Toàn Bộ.
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="submit" className="btn-primary flex-1">Tạo tài khoản</button>
                  <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={closeFormModal}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </BranchLayout>
  );
}