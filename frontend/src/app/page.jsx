"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";
import { useToast } from "@/contexts/ToastContext";

export default function Page() {
  const router = useRouter();
  const { setBranch } = useBranch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const showNotification = useToast();

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const nextBranch = result.branch;
      setBranch(nextBranch);
      router.push(nextBranch === "CENTRAL" ? "/central" : "/branch-dashboard");
    } catch (err) {
      setError(err.message || "Đăng nhập không thành công");
    } finally {
      setLoading(false);
    }
  };

  const [forgotResult, setForgotResult] = useState(null);

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotResult(null);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername }),
      });
      setForgotResult(res);
    } catch (err) {
      showNotification(err.message || "Yêu cầu thất bại", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_#08111f_0%,_#0f172a_52%,_#111827_100%)] text-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-black/30 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-teal-500 to-cyan-500" />
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80 font-bold mb-4">DDBMS Login</p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">Đăng nhập vào hệ thống cửa hàng tiện lợi.</h1>
        

        </section>

        <section className="rounded-[2rem] bg-white text-slate-900 shadow-2xl p-6 md:p-8 flex flex-col justify-center">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Account Access</p>
            <h2 className="text-3xl font-black text-slate-950">Đăng nhập hệ thống</h2>
          
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
                placeholder="vd: thu_ngan_hue"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl px-4 py-3 font-bold text-white shadow-lg bg-slate-900 hover:bg-slate-800 transition-transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xác thực..." : "Đăng nhập"}
            </button>
            <div className="text-right">
              <button type="button" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800" onClick={() => setForgotOpen(true)}>Quên mật khẩu?</button>
            </div>
          </form>
        </section>
      </div>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setForgotOpen(false)}>
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-2xl font-black text-slate-900">Quên mật khẩu</h3>
              <p className="text-sm text-slate-600 mt-1">Nhập tên đăng nhập để lấy lại mật khẩu tạm thời.</p>
            </div>
            <form className="space-y-4" onSubmit={handleForgot}>
              <label className="block">
                <span className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</span>
                <input
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-300"
                  placeholder="vd: thu_ngan_hue"
                />
              </label>
              <button type="submit" disabled={forgotLoading} className="w-full rounded-2xl px-4 py-3 font-bold text-white shadow-lg bg-cyan-700 hover:bg-cyan-800 disabled:opacity-70">
                {forgotLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
              </button>
              <button type="button" onClick={() => { setForgotOpen(false); setForgotResult(null); }} className="w-full rounded-2xl px-4 py-3 font-bold text-slate-700 border border-slate-200 hover:bg-slate-50">Hủy</button>
            </form>

            {forgotResult?.tempPassword && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-bold mb-1">Mật khẩu tạm thời:</p>
                <p className="font-mono text-lg">{forgotResult.tempPassword}</p>
                <p className="mt-2 text-xs text-emerald-700">Dùng mật khẩu này để đăng nhập, sau đó nên đổi lại ngay trong hệ thống.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
