"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/components/api";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNotification = useToast();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Không tìm thấy token reset mật khẩu. Vui lòng thử lại từ đầu.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
      showNotification("Mật khẩu đã được thay đổi thành công!", "success");
    } catch (err) {
      setError(err.message || "Token không hợp lệ hoặc đã hết hạn.");
      showNotification(err.message || "Có lỗi xảy ra", "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-600 mb-4">Thành công!</h2>
        <p className="text-slate-600 mb-6">Mật khẩu của bạn đã được đặt lại. Bây giờ bạn có thể đăng nhập với mật khẩu mới.</p>
        <Link href="/" className="btn-primary w-full py-3">
          Quay về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      <input type="hidden" value={token} />
      <label className="block"><span className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500" /></label>
      <label className="block"><span className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu mới</span><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500" /></label>
      <button type="submit" disabled={loading || !token} className="w-full rounded-xl px-4 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50">{loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}</button>
    </form>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">Tạo mật khẩu mới</h1>
        <Suspense fallback={<p>Đang tải...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
