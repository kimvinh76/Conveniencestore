"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/contexts/ToastContext";
import CentralAccountTable from "./components/CentralAccountTable";
import AccountFormModal from "./components/AccountFormModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function Page() {
  const { auth } = useBranch({ requireCentral: true });
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ TenDangNhap: "", MatKhau: "", MaNV: "", Quyen: "NHAN_VIEN", TrangThai: 1 });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetTarget, setResetTarget] = useState(null);

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  const showToast = useToast();

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
      const res = await apiFetch("/api/employees/all?branch=CENTRAL");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Không thể tải danh sách nhân viên.");
    }
  };

  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()]).catch(() => { });
  }, []);

  const openAddModal = () => {
    setForm({ TenDangNhap: "", MatKhau: "", MaNV: "", TrangThai: 1 });
    openFormModal();
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/accounts/central", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      closeFormModal();
      loadAccounts();
    } catch (err) {
      showToast(`Lỗi: ${err.message || String(err)}`, "error");
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
      showToast(`Lỗi: ${err.message || String(err)}`, "error");
    }
  };

  const handleResetPassword = (acc) => {
    setResetTarget(acc);
  };

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    
    try {
      await apiFetch(`/api/accounts/central/${resetTarget.TenDangNhap}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: resetTarget.ChiNhanh || "CENTRAL" }),
      });
      showToast(`Đã đặt lại mật khẩu cho ${resetTarget.TenDangNhap}. Mật khẩu mặc định là: 123456`, "success");
    } catch (err) {
      showToast(`Lỗi khi đặt lại mật khẩu: ${err.message || String(err)}`, "error");
    } finally {
      setResetTarget(null);
    }
  };

  // ───────────── Derived state ─────────────
  /**
   * Khi Tạo mới: chỉ nhân viên chưa có tài khoản
   */
  const availableEmployees = useMemo(() => {
    return employees.filter((emp) => !accounts.some((acc) => acc.MaNV === emp.MaNV));
  }, [employees, accounts]);

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
          onLockToggle={handleLockToggle}
          onResetPassword={handleResetPassword}
        />
        
        <ConfirmModal
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          onConfirm={confirmResetPassword}
          title="Xác nhận cấp lại mật khẩu"
          message={`Bạn có chắc chắn muốn đặt lại mật khẩu của nhân viên ${resetTarget?.HoTen || resetTarget?.TenDangNhap} về mặc định không?`}
          confirmText="Cấp lại"
          cancelText="Hủy"
        />
      </div>





      {/* Modal tạo tài khoản mới */}
      {isFormOpen && (
        <AccountFormModal
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