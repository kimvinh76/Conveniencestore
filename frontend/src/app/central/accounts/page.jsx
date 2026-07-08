"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useModal } from "@/hooks/useModal";

export default function Page() {
  const { auth } = useBranch({ requireCentral: true });
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ TenDangNhap: "", MatKhau: "", MaNV: "", Quyen: "NHAN_VIEN", TrangThai: 1 });
  const [result, setResult] = useState("Chưa có thao tác.");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = auth?.role === "ADMIN_TOAN_BO";

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/accounts/central");
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
    // Gọi đúng API endpoint và truyền tham số branch=CENTRAL để được cấp quyền
      const res = await apiFetch("/api/all-employees?branch=CENTRAL");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Không thể tải danh sách nhân viên.");
    }
  };

  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()]).catch(() => {});
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ TenDangNhap: "", MatKhau: "", MaNV: "", Quyen: "NHAN_VIEN", TrangThai: 1 });
    openFormModal();
  };

  const handleEdit = (acc) => {
    setIsEditing(true);
    setForm({ TenDangNhap: acc.TenDangNhap, MatKhau: "", MaNV: acc.MaNV, Quyen: acc.Quyen, TrangThai: acc.TrangThai });
    openFormModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/accounts/central/${form.TenDangNhap}` : "/api/accounts/central";
      const payload = isEditing ? { Quyen: form.Quyen } : form;
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(res, null, 2));
      closeFormModal();
      loadAccounts();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleLockToggle = async (acc) => {
    const isLocked = Number(acc.TrangThai) === 0;
    const endpoint = isLocked ? "unlock" : "lock";
    try {
      const res = await apiFetch(`/api/accounts/central/${acc.TenDangNhap}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: acc.ChiNhanh || "CENTRAL" }),
      });
      setResult(JSON.stringify(res, null, 2));
      loadAccounts();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };


  const roleBadge = (role) => {
    const map = {
      "ADMIN_TOAN_BO": { bg: "bg-purple-100", text: "text-purple-700", label: "Admin Toàn Bộ" },
      "ADMIN_CHI_NHANH": { bg: "bg-orange-100", text: "text-orange-700", label: "Admin Chi Nhánh" },
      "NHAN_VIEN": { bg: "bg-slate-100", text: "text-slate-600", label: "Nhân Viên" },
    };
    const s = map[role] || { bg: "bg-gray-100", text: "text-gray-600", label: role };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const lower = searchTerm.toLowerCase();
    return accounts.filter(acc => 
      (acc.TenDangNhap || "").toLowerCase().includes(lower) ||
      (acc.MaNV || "").toLowerCase().includes(lower) ||
      (acc.HoTen || "").toLowerCase().includes(lower) ||
      (acc.ChiNhanh || "").toLowerCase().includes(lower)
    );
  }, [accounts, searchTerm]);

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-indigo-200">
          <div>
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-1">Tác vụ Trung tâm</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tài khoản toàn hệ thống</h1>
            <p className="text-sm text-slate-500 mt-2">
              Xem và quản lý tài khoản của tất cả chi nhánh 
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={openAddModal}>+ Tạo tài khoản</button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>
        )}

        <div className="grid grid-cols-1 gap-6 w-full">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-5 gap-4">
              <h2 className="text-xl font-bold text-slate-800">
                Danh sách tài khoản 
                <span className="ml-2 text-sm font-normal text-slate-400">({filteredAccounts.length} tài khoản)</span>
              </h2>
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm tài khoản..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm bg-slate-50"
              />
            </div>
            <div className="table-wrap flex-1 overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>Tên đăng nhập</th>
                    <th>Nhân viên</th>
                    <th>Chi nhánh</th>
                    <th>Quyền</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(acc => (
                    <tr key={acc.TenDangNhap}>
                      <td className="font-medium text-slate-800">{acc.TenDangNhap}</td>
                      <td>{acc.HoTen} ({acc.MaNV})</td>
                      <td>{acc.ChiNhanh}</td>
                      <td>{roleBadge(acc.Quyen)}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          Number(acc.TrangThai) === 1 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${Number(acc.TrangThai) === 1 ? "bg-green-500" : "bg-red-500"}`}></span>
                          {Number(acc.TrangThai) === 1 ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className="text-right">
                        {acc.Quyen !== "ADMIN_TOAN_BO" ? (
                          <>
                            <button
                              onClick={() => handleEdit(acc)}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Sửa
                            </button>
                            {acc.Quyen === "NHAN_VIEN" && (
                              <button
                                onClick={() => handleLockToggle(acc)}
                                className={`text-sm font-semibold mr-3 ${
                                  Number(acc.TrangThai) === 1 ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"
                                }`}
                              >
                                {Number(acc.TrangThai) === 1 ? "Khóa" : "Mở khóa"}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">Bảo vệ bảo mật</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && !loading && (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-500">Chưa có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-indigo-950 text-green-400 p-4 rounded-xl shadow-inner font-mono text-sm overflow-x-auto h-48">
            <h3 className="text-indigo-300 mb-2 font-sans text-xs font-bold uppercase tracking-widest">Logs</h3>
            <pre>{result}</pre>
          </section>
        </div>
      </div>

      {/* Lọc danh sách nhân viên chưa có tài khoản */}
      {isFormOpen && (() => {
        const availableEmployees = isEditing 
          ? employees.filter(emp => emp.MaNV === form.MaNV) 
          : employees.filter(emp => !accounts.some(acc => acc.MaNV === emp.MaNV));
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">{isEditing ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}</h3>
                <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Tên đăng nhập</span>
                  <input value={form.TenDangNhap} onChange={(e) => setForm({ ...form, TenDangNhap: e.target.value })} required readOnly={isEditing} className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing ? 'bg-slate-100 border-slate-200 text-slate-500' : 'border-slate-300'}`} />
                </label>
                {!isEditing && (
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-700">Mật khẩu</span>
                    <input type="password" value={form.MatKhau} onChange={(e) => setForm({ ...form, MatKhau: e.target.value })} required className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </label>
                )}
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Mã nhân viên</span>
                  <select value={form.MaNV} onChange={(e) => setForm({ ...form, MaNV: e.target.value })} required disabled={isEditing} className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing ? 'bg-slate-100 border-slate-200 text-slate-500 appearance-none' : 'border-slate-300'}`}>
                    <option value="">-- Chọn nhân viên --</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.MaNV} value={emp.MaNV}>{emp.HoTen} ({emp.MaNV}) - {emp.ChiNhanh}</option>
                    ))}
                  </select>
                  {availableEmployees.length === 0 && !isEditing && (
                    <span className="text-xs text-red-500 mt-1">Tất cả nhân viên đều đã có tài khoản.</span>
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-slate-700">Quyền</span>
                  <select
                    value={form.Quyen}
                    onChange={(e) => setForm({ ...form, Quyen: e.target.value })}
                    required
                    disabled={isEditing && form.Quyen === "ADMIN_TOAN_BO"}
                    className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isEditing && form.Quyen === "ADMIN_TOAN_BO" ? 'bg-slate-100 border-slate-200 text-slate-500 appearance-none' : 'border-slate-300'}`}
                  >
                    {isEditing && form.Quyen === "ADMIN_TOAN_BO" ? (
                      <option key="ADMIN_TOAN_BO" value="ADMIN_TOAN_BO">ADMIN_TOAN_BO - Admin toàn bộ</option>
                    ) : (
                      ["NHAN_VIEN", "ADMIN_CHI_NHANH"].map(role => (
                        <option key={role} value={role}>
                          {role === "NHAN_VIEN" ? "NHAN_VIEN - Nhân viên" : "ADMIN_CHI_NHANH - Admin chi nhánh"}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <div className="flex gap-3 mt-2">
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex-1 transition-colors">{isEditing ? "Lưu thay đổi" : "Tạo tài khoản"}</button>
                  <button type="button" className="btn-ghost flex-1 border border-slate-200" onClick={closeFormModal}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}