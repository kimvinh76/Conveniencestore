"use client";
import { useRouter } from "next/navigation";
import { useBranch } from "@/components/useBranch";

export default function Page() {
  const router = useRouter();
  const { setBranch } = useBranch();

  const go = (branch) => {
    setBranch(branch);
    router.push(branch === "CENTRAL" ? "/central" : "/branch-dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-7xl w-full flex flex-col gap-10">
        <header className="text-center">
          <p className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em] mb-2">Hệ Thống Cơ Sở Dữ Liệu Phân Tán</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Chuỗi Cửa Hàng Tiện Lợi</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">Vui lòng chọn cổng đăng nhập tương ứng với khu vực làm việc của bạn để truy cập quản trị hệ thống.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Login Card: HUE */}
          <LoginBox 
            title="Chi nhánh Huế" 
            branch="HUE" 
            colorClass="border-teal-500" 
            btnClass="bg-teal-600 hover:bg-teal-700"
            onLogin={() => go("HUE")}
          />

          {/* Login Card: SAIGON */}
          <LoginBox 
            title="Chi nhánh Sài Gòn" 
            branch="SAIGON" 
            colorClass="border-orange-500" 
            btnClass="bg-orange-600 hover:bg-orange-700"
            onLogin={() => go("SAIGON")}
          />

          {/* Login Card: HANOI */}
          <LoginBox 
            title="Chi nhánh Hà Nội" 
            branch="HANOI" 
            colorClass="border-blue-500" 
            btnClass="bg-blue-600 hover:bg-blue-700"
            onLogin={() => go("HANOI")}
          />

          {/* Login Card: CENTRAL */}
          <LoginBox 
            title="Tổng Công Ty" 
            branch="CENTRAL" 
            colorClass="border-indigo-600" 
            btnClass="bg-indigo-900 hover:bg-black"
            isHQ={true}
            onLogin={() => go("CENTRAL")}
          />
        </div>

        <footer className="text-center text-slate-400 text-sm mt-4">
          &copy; 2024 DDBMS Project - Distributed Database Management System
        </footer>
      </div>
    </main>
  );
}

function LoginBox({ title, branch, colorClass, btnClass, onLogin, isHQ = false }) {
  return (
    <section className={`bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 ${colorClass} transition-transform hover:-translate-y-1`}>
      <div className="p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            {isHQ ? "Quản trị Toàn cục" : "Cơ sở dữ liệu Chi nhánh"}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <input type="text" placeholder="Tên đăng nhập" defaultValue="admin" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex flex-col gap-1">
            <input type="password" placeholder="Mật khẩu" defaultValue="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
        </div>

        <button onClick={onLogin} className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${btnClass}`}>
          Đăng nhập {branch}
        </button>
      </div>
    </section>
  );
}
