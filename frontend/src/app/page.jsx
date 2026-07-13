"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useBranch } from "@/hooks/useBranch";

export default function LoginPage() {
  const router = useRouter();
  const showNotification = useToast();
  const { auth, ready } = useBranch();

  useEffect(() => {
    if (ready && auth) {
      if (auth.branch === "CENTRAL") {
        router.replace("/central");
      } else if (auth.role === "NHAN_VIEN") {
        router.replace("/branch/invoices");
      } else {
        router.replace("/branch/dashboard");
      }
    }
  }, [ready, auth, router]);

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      showNotification("Đăng nhập thành công!", "success");

      // Dựa vào branch trả về để điều hướng
      if (res.branch === "CENTRAL") {
        router.push("/central");
      } else if (res.user?.role === "NHAN_VIEN") {
        router.push("/branch/invoices");
      } else {
        router.push("/branch/dashboard");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      showNotification(err.message || "Đăng nhập thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Vui lòng liên hệ với Quản lý chi nhánh hoặc Quản trị viên hệ thống để được cấp lại mật khẩu (Mật khẩu mặc định: 123456aA@).");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium font-sans">Đang tải.....</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Đăng nhập hệ thống</h1>
          <p className="text-slate-500 text-sm mb-8 text-center">Chào mừng bạn quay trở lại!</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <label className="block"><span className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</span><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500" /></label>
            <label className="block"><span className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500" /></label>
            <div className="flex justify-end"><button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-cyan-600 hover:underline">Quên mật khẩu?</button></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl px-4 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">{loading ? "Đang xử lý..." : "Đăng nhập"}</button>
          </form>
        </div>
      </div>


    </main>
  );
}