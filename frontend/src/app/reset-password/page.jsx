"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/components/api";
import { useToast } from "@/contexts/ToastContext";
import ResetPasswordForm from "./components/ResetPasswordForm";
import SuccessNotification from "./components/SuccessNotification";

function ResetPasswordPage() {
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
    return <SuccessNotification />;
  }

  return (
    <ResetPasswordForm
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      handleSubmit={handleSubmit}
      loading={loading}
      error={error}
      token={token}
    />
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">
          Tạo mật khẩu mới
        </h1>
        <Suspense fallback={<p>Đang tải...</p>}>
          <ResetPasswordPage />
        </Suspense>
      </div>
    </main>
  );
}
