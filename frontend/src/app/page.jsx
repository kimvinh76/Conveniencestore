"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/components/api";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const showNotification = useToast();

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

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
      } else {
        router.push("/branch-dashboard");
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      showNotification(err.message || "Đăng nhập thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      showNotification(res.message || "Yêu cầu đã được gửi. Vui lòng kiểm tra email.", "success");
      setForgotOpen(false);
    } catch (err) {
      showNotification(err.message || "Yêu cầu thất bại", "error");
    } finally {
      setForgotLoading(false);
    }
  };

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
            <div className="flex justify-end"><button type="button" onClick={() => setForgotOpen(true)} className="text-sm font-semibold text-cyan-600 hover:underline">Quên mật khẩu?</button></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl px-4 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">{loading ? "Đang xử lý..." : "Đăng nhập"}</button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Quên mật khẩu</h3>
            <p className="text-sm text-slate-500 mb-6">Nhập địa chỉ email của bạn. Một liên kết để đặt lại mật khẩu sẽ được gửi đến email đã đăng ký.</p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <label className="block"><span className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ Email</span><input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500" /></label>
              <button type="submit" disabled={forgotLoading} className="w-full rounded-xl px-4 py-3 font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50">{forgotLoading ? "Đang gửi..." : "Gửi liên kết đặt lại"}</button>
              <button type="button" onClick={() => setForgotOpen(false)} className="w-full rounded-xl px-4 py-3 font-bold text-slate-700 border border-slate-200 hover:bg-slate-50">Hủy</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}