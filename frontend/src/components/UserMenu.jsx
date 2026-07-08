"use client";
import { useState } from "react";
import { useBranch } from "@/hooks/useBranch";
import { useToast } from "@/contexts/ToastContext";
import { apiFetch } from "@/services/api";

export default function UserMenu() {
  const { auth, logout } = useBranch();
  const [open, setOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const showNotification = useToast();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/accounts/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      showNotification("Đổi mật khẩu thành công");
      setChangeOpen(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      showNotification(err.message || "Đổi mật khẩu thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-sm"
      >
        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
          {(auth?.fullName || auth?.username || "?").charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-slate-800">{auth?.fullName || auth?.username || "User"}</div>
          <div className="text-xs text-slate-500">{auth?.role || ""}</div>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">{auth?.fullName || auth?.username}</p>
              <p className="text-xs text-slate-500">{auth?.title || auth?.role || ""}</p>
            </div>
            <button
              onClick={() => { setOpen(false); setChangeOpen(true); }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Đổi mật khẩu
            </button>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}

      {changeOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4" onClick={() => setChangeOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-900 mb-4">Đổi mật khẩu</h3>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu hiện tại</span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
                  required
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
                  required
                />
              </label>
              <button type="submit" disabled={loading} className="w-full rounded-2xl px-4 py-3 font-bold text-white shadow-lg bg-cyan-700 hover:bg-cyan-800 disabled:opacity-70">
                {loading ? "Đang xử lý..." : "Lưu thay đổi"}
              </button>
              <button type="button" onClick={() => setChangeOpen(false)} className="w-full rounded-2xl px-4 py-3 font-bold text-slate-700 border border-slate-200 hover:bg-slate-50">
                Hủy bỏ 
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}