"use client";
import Link from "next/link";
import { useBranch } from "@/components/useBranch";

export default function CentralLayout({ active = "dashboard", children }) {
  const { logout } = useBranch({ requireCentral: true });

  const navItems = [
    { id: "dashboard", href: "/central", label: "Thống kê toàn cục" },
    { id: "products", href: "/central-products", label: "Sản phẩm" },
    { id: "invoices", href: "/central-invoices", label: "Hóa đơn" },
    { id: "employees", href: "/central-employees", label: "Nhân viên" },
    { id: "inventory", href: "/central-inventory", label: "Tồn kho" },
    { id: "transfer", href: "/central-transfer", label: "Chuyển kho" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar - Cố định bên trái */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col fixed inset-y-0 left-0 z-10 shadow-xl">
        <div className="p-6 border-b border-indigo-900">
          <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-1">DDBMS Demo</p>
          <h2 className="text-xl font-bold text-blue-400">Central Console</h2>
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
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
