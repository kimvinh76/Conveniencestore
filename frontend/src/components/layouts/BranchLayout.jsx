"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { useBranch } from "@/components/useBranch";
import { apiFetch } from "@/components/api";

export default function BranchLayout({ active = "dashboard", children }) {
  const { branchLabel, logout, auth } = useBranch({ requireLocal: true });
  const [showMenu, setShowMenu] = useState(false);
  const profileRef = useRef(null);
  const passwordRef = useRef(null);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });

  // Lọc bỏ tab Tài khoản nếu là NHAN_VIEN
  const navItems = [
    { id: "dashboard", href: "/branch-dashboard", label: "Dashboard" },
    { id: "accounts", href: "/branch-accounts", label: "Tài khoản" },
    { id: "employees", href: "/branch-employees", label: "Nhân viên" },
    { id: "invoices", href: "/branch-invoices", label: "Hóa đơn" },
    { id: "products", href: "/branch-products", label: "Sản phẩm" },
    { id: "inventory", href: "/branch-inventory", label: "Tồn kho" },
  ].filter(item => !(item.id === "accounts" && auth?.role === "NHAN_VIEN"));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/accounts/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwdForm),
      });
      alert("Đổi mật khẩu thành công!");
      setPwdForm({ oldPassword: "", newPassword: "" });
      passwordRef.current?.close();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar - Cố định bên trái */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-10 shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">DDBMS Demo</p>
          <h2 className="text-xl font-bold text-teal-400">{branchLabel || "Chi nhánh"}</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.id} 
              href={item.href}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                active === item.id 
                  ? "bg-teal-600 text-white shadow-md" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content - Nằm bên phải */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Topbar: Thông tin User */}
          <header className="flex justify-end items-center mb-6 relative">
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-3 hover:bg-slate-200 p-2 rounded-xl transition-colors outline-none">
              <div className="text-right hidden md:block">
                <div className="font-bold text-slate-800 text-sm">{auth?.fullName || auth?.username}</div>
                <div className="text-xs text-slate-500 font-medium">{auth?.role}</div>
              </div>
              <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                {auth?.username?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute top-14 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  <button onClick={() => { setShowMenu(false); profileRef.current?.showModal(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 font-medium">Thông tin cá nhân</button>
                  <button onClick={() => { setShowMenu(false); passwordRef.current?.showModal(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 font-medium">Đổi mật khẩu</button>
                  <hr className="my-1 border-slate-100" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold">Đăng xuất</button>
                </div>
              </>
            )}
          </header>

          {children}
        </div>
      </main>

      {/* Modal Thông tin cá nhân Global */}
      <dialog ref={profileRef} className="modal w-full max-w-sm bg-white rounded-3xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Thông tin cá nhân</h3>
          <button onClick={() => profileRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
            {auth?.username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{auth?.fullName || auth?.username}</h2>
          <p className="text-slate-500 font-medium mt-1">{auth?.title || "Nhân viên"} - {auth?.branch}</p>
          <div className="w-full mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Tên đăng nhập:</span><span className="font-semibold text-slate-700">{auth?.username}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 text-sm">Quyền hạn:</span><span className="font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded text-xs">{auth?.role}</span></div>
          </div>
        </div>
      </dialog>

      {/* Modal Đổi mật khẩu Global */}
      <dialog ref={passwordRef} className="modal w-full max-w-md bg-white rounded-3xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Đổi mật khẩu</h3>
          <button onClick={() => passwordRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Mật khẩu cũ</span>
            <input type="password" value={pwdForm.oldPassword} onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })} required className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Mật khẩu mới</span>
            <input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
          </label>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1 py-3">Xác nhận đổi</button>
            <button type="button" className="btn-ghost flex-1 border border-slate-200 py-3" onClick={() => passwordRef.current?.close()}>Hủy</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
