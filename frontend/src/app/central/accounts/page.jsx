"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useModal } from "@/hooks/useModal";
import CentralAccountTable from "./components/CentralAccountTable";
import AccountFormModal from "./components/AccountFormModal";

export default function Page() {
  const { auth } = useBranch({ requireCentral: true });
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ TenDangNhap: "", MatKhau: "", MaNV: "", Quyen: "NHAN_VIEN", TrangThai: 1 });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      const res = await apiFetch("/api/all-employees?branch=CENTRAL");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Không thể tải danh sách nhân viên.");
    }
  };

  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()]).catch(() => { });
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setForm({ TenDangNhap: "", MatKhau: "", MaNV: "", Quyen: "NHAN_VIEN", TrangThai: 1 });
    openFormModal();
  };

  const handleEdit = (acc) => {
    setIsEditing(true);
    // Gán đúng MaNV từ row tài khoản → dropdown sẽ hiển thị tên nhân viên đúng
    setForm({ TenDangNhap: acc.TenDangNhap, MatKhau: "", MaNV: acc.MaNV, Quyen: acc.Quyen, TrangThai: acc.TrangThai });
    openFormModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/accounts/central/${form.TenDangNhap}` : "/api/accounts/central";
      // Khi edit chỉ gửi Quyen (không gửi MaNV/MatKhau)
      const payload = isEditing ? { Quyen: form.Quyen } : form;
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      closeFormModal();
      loadAccounts();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleLockToggle = async (acc) => {
    const isLocked = Number(acc.TrangThai) === 0;
    const endpoint = isLocked ? "unlock" : "lock";
    try {
      await apiFetch(`/api/accounts/central/${acc.TenDangNhap}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: acc.ChiNhanh || "CENTRAL" }),
      });
      loadAccounts();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  // ───────────── Derived state ─────────────
  /**
   * Khi Tạo mới: chỉ nhân viên chưa có tài khoản
   * Khi Edit:    chỉ 1 nhân viên = chính nhân viên của acc đó (disabled select, chỉ xem)
   */
  const availableEmployees = useMemo(() => {
    if (isEditing) {
      return employees.filter((emp) => emp.MaNV === form.MaNV);
    }
    return employees.filter((emp) => !accounts.some((acc) => acc.MaNV === emp.MaNV));
  }, [isEditing, employees, accounts, form.MaNV]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const lower = searchTerm.toLowerCase();
    return accounts.filter(
      (acc) =>
        (acc.TenDangNhap || "").toLowerCase().includes(lower) ||
        (acc.MaNV || "").toLowerCase().includes(lower) ||
        (acc.HoTen || "").toLowerCase().includes(lower) ||
        (acc.ChiNhanh || "").toLowerCase().includes(lower)
    );
  }, [accounts, searchTerm]);

  // ───────────── Render ─────────────
  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Page header */}
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-indigo-200">
          <div>
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-1">Tác vụ Trung tâm</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tài khoản toàn hệ thống</h1>
            <p className="text-sm text-slate-500 mt-2">Xem và quản lý tài khoản của tất cả chi nhánh</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={openAddModal}>+ Tạo tài khoản</button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>
        )}

        {/* Bảng tài khoản */}
        <CentralAccountTable
          accounts={accounts}
          loading={loading}
          filteredAccounts={filteredAccounts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={handleEdit}
          onLockToggle={handleLockToggle}
        />
      </div>





      {/* Modal Tạo mới / Cập nhật tài khoản */}
      {isFormOpen && (
        <AccountFormModal
          isEditing={isEditing}
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={closeFormModal}
          availableEmployees={availableEmployees}
        />
      )}

    </>
  );
}