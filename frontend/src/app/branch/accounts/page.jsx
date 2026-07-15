"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/contexts/ToastContext";
import AccountTable from "./components/AccountTable";
import CreateAccountModal from "./components/CreateAccountModal";
import ConfirmModal from "@/components/ConfirmModal";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [accounts, setAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ TenDangNhap: "", MatKhau: "", MaNV: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resetTarget, setResetTarget] = useState(null); // State cho modal reset pass

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  const showToast = useToast();
  const canManage = auth?.role === "ADMIN_CHI_NHANH" || auth?.role === "ADMIN_TOAN_BO";

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
    } catch (_) { }
  };

  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()]).catch(() => { });
  }, [branch]);

  const openAddModal = () => {
    setForm({ TenDangNhap: "", MatKhau: "", MaNV: "" });
    openFormModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branch) return;
    try {
      await apiFetch("/api/accounts/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TenDangNhap: form.TenDangNhap,
          MatKhau: form.MatKhau,
          MaNV: form.MaNV,
          ChiNhanh: branch,
        }),
      });
      closeFormModal();
      loadAccounts();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleLock = async (acc) => {
    if (!branch) return;
    const isLocked = Number(acc.TrangThai) === 0;
    const endpoint = isLocked ? "unlock" : "lock";
    try {
      await apiFetch(`/api/accounts/branch/${acc.TenDangNhap}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      loadAccounts();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleResetPassword = (acc) => {
    setResetTarget(acc);
  };

  const confirmResetPassword = async () => {
    if (!branch || !resetTarget) return;
    
    try {
      await apiFetch(`/api/accounts/branch/${resetTarget.TenDangNhap}/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      showToast(`Đã đặt lại mật khẩu cho ${resetTarget.TenDangNhap}. Mật khẩu mặc định là: 123456`, "success");
    } catch (err) {
      showToast(`Lỗi khi đặt lại mật khẩu: ${err.message || String(err)}`, "error");
    } finally {
      setResetTarget(null);
    }
  };

  // ───────────── Derived state ─────────────
  const availableEmployees = useMemo(
    () => employees.filter((emp) => !accounts.some((acc) => acc.MaNV === emp.MaNV)),
    [employees, accounts]
  );

  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const lower = searchTerm.toLowerCase();
    return accounts.filter(
      (acc) =>
        (acc.TenDangNhap || "").toLowerCase().includes(lower) ||
        (acc.MaNV || "").toLowerCase().includes(lower) ||
        (acc.HoTen || "").toLowerCase().includes(lower)
    );
  }, [accounts, searchTerm]);

  // Chặn truy cập nếu là NHAN_VIEN (ĐẶT SAU TOÀN BỘ HOOKS ĐỂ TRÁNH LỖI RULE OF HOOKS)
  if (auth?.role === "NHAN_VIEN") {
    return (
      <div className="bg-red-50 text-red-700 p-8 rounded-2xl border border-red-200 text-center mt-10">
        <h2 className="text-3xl font-bold mb-3">Truy cập bị từ chối</h2>
        <p className="text-lg">Bạn không có quyền xem trang Quản lý tài khoản chi nhánh.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {/* Page header */}
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
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        {/* Account list table */}
        <AccountTable
          accounts={accounts}
          loading={loading}
          employees={employees}
          canManage={canManage}
          onLock={handleLock}
          onResetPassword={handleResetPassword}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredAccounts={filteredAccounts}
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
        <CreateAccountModal
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