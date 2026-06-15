"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";

export default function Page() {
  const router = useRouter();
  const { setBranch } = useBranch();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          </form>
        </section>
      </div>
    </main>
  );
}
