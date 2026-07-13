"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBranch } from "@/hooks/useBranch";
import UserMenu from "@/components/UserMenu";

export default function CentralLayout({ children }) {
  const { logout, auth, ready } = useBranch({ requireCentral: true });
  const pathname = usePathname();

  if (!ready || !auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium font-sans">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", href: "/central", label: "Thống kê toàn cục" },
    { id: "products", href: "/central/products", label: "Sản phẩm" },
    { id: "customers", href: "/central/customers", label: "Khách hàng" },
    { id: "invoices", href: "/central/invoices", label: "Hóa đơn" },
    { id: "employees", href: "/central/employees", label: "Nhân viên" },
    { id: "suppliers", href: "/central/suppliers", label: "Nhà cung cấp" },
    { id: "inventory", href: "/central/inventory", label: "Tồn kho" },
    { id: "transfer", href: "/central/transfer", label: "Chuyển kho" },
    { id: "purchase-receipts", href: "/central/purchase-receipts", label: "Phiếu nhập kho" },
    { id: "accounts", href: "/central/accounts", label: "Tài khoản" },
  ];

  const activeItem = navItems.find((item) => {
    if (item.href === "/central") {
      return pathname === "/central";
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  });
  const active = activeItem ? activeItem.id : "";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - Cố định bên trái */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col fixed inset-y-0 left-0 z-10 shadow-xl">
        <div className="p-6 border-b border-indigo-900">
          <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-1">DDBMS Demo</p>
          <h2 className="text-xl font-bold text-blue-400">Central Console</h2>
          <div className="mt-4 rounded-2xl bg-indigo-900/80 border border-indigo-800 px-3 py-3 text-sm space-y-1">
            <div className="text-indigo-300 text-xs uppercase tracking-wider font-semibold">Phiên đăng nhập</div>
            <div className="font-semibold text-white">{auth?.username || "Chưa xác định"}</div>
            <div className="text-indigo-200 text-xs">{auth?.role || "-"}</div>
            <div className="text-indigo-300 text-xs">{auth?.fullName || auth?.title || ""}</div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.id} 
              href={item.href}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                active === item.id 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-indigo-900">
          <button 
            onClick={logout}
            className="w-full py-2 px-4 bg-indigo-900 hover:bg-red-600 text-indigo-200 hover:text-white rounded-lg transition-colors font-medium text-left"
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
