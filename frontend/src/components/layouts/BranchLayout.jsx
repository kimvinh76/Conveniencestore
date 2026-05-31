"use client";
import Link from "next/link";
import { useBranch } from "@/components/useBranch";

export default function BranchLayout({ active = "dashboard", children }) {
  const { branchLabel, logout } = useBranch({ requireLocal: true });

  const navItems = [
    { id: "dashboard", href: "/branch-dashboard", label: "Dashboard" },
    { id: "employees", href: "/branch-employees", label: "Nhân viên" },
    { id: "invoices", href: "/branch-invoices", label: "Hóa đơn" },
    { id: "products", href: "/branch-products", label: "Sản phẩm" },
    { id: "inventory", href: "/branch-inventory", label: "Tồn kho" },
  ];

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
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
