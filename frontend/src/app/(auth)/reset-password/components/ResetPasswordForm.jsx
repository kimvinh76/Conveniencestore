export default function ResetPasswordForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  handleSubmit,
  loading,
  error,
  token,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <input type="hidden" value={token} />
      <label className="block">
        <span className="block text-sm font-semibold text-slate-700 mb-2">
          Mật khẩu mới
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </label>
      <label className="block">
        <span className="block text-sm font-semibold text-slate-700 mb-2">
          Xác nhận mật khẩu mới
        </span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-xl px-4 py-3 font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
