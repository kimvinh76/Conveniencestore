"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBranch } from "@/hooks/useBranch";
import UserMenu from "@/components/UserMenu";

export default function BranchLayout({ children }) {
  const { branchLabel, logout, auth, ready } = useBranch({ requireLocal: true });
  const pathname = usePathname();

  if (!ready || !auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium font-sans">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", href: "/branch/dashboard", label: "Dashboard" },
    { id: "employees", href: "/branch/employees", label: "Nhân viên" },
    { id: "invoices", href: "/branch/invoices", label: "Hóa đơn" },
    { id: "products", href: "/branch/products", label: "Sản phẩm" },
    { id: "inventory", href: "/branch/inventory", label: "Tồn kho" },
    ...(auth?.role !== "NHAN_VIEN" ? [{ id: "accounts", href: "/branch/accounts", label: "Tài khoản" }] : []),
  ];

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const active = activeItem ? activeItem.id : "dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar - Cố định bên trái */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-10 shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">DDBMS Demo</p>
          <h2 className="text-xl font-bold text-teal-400">{branchLabel || "Chi nhánh"}</h2>
          <div className="mt-4 rounded-2xl bg-slate-800/80 border border-slate-700 px-3 py-3 text-sm space-y-1">
            <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Phiên đăng nhập</div>
            <div className="font-semibold text-white">{auth?.username || "Chưa xác định"}</div>
            <div className="text-slate-300 text-xs">{auth?.role || "-"}</div>
            <div className="text-slate-400 text-xs">{auth?.fullName || auth?.title || ""}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${active === item.id

                ? "bg-teal-600 text-white shadow-md"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors font-medium text-left"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content - Nằm bên phải */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <div className="w-full">
          <div className="flex justify-end mb-4">
            <UserMenu />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
