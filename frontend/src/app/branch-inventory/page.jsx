"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ productCode: "", newQuantity: "" });
  const [result, setResult] = useState("Chưa có thao tác.");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/inventory?branch=${branch}`);
      setInventory(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory().catch(() => {});
  }, [branch]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!branch || !form.productCode) return;
    try {
      const res = await apiFetch(`/api/inventory/${encodeURIComponent(form.productCode)}?branch=${branch}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(form.newQuantity),
        }),
      });
      setResult(JSON.stringify(res, null, 2));
      setForm({ productCode: "", newQuantity: "" });
      loadInventory();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const handleEditClick = (item) => {
    setForm({ productCode: item.productCode, newQuantity: item.quantity });
  };

  return (
    <BranchLayout active="inventory">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tồn kho</h1>
          </div>
          <button className="btn-primary" onClick={loadInventory}>
            {loading ? "Đang tải..." : "Tải lại dữ liệu"}
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="flex flex-col gap-6 lg:col-span-1">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Cập nhật số lượng tồn</h2>
              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <label>
                  <span>Mã sản phẩm</span>
                  <input value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} required placeholder="Nhập mã SP..." />
                </label>
                <label>
                  <span>Số lượng tồn mới</span>
                  <input type="number" min="0" value={form.newQuantity} onChange={(e) => setForm({ ...form, newQuantity: e.target.value })} required />
                </label>
                <button type="submit" className="btn-primary mt-2">Cập nhật</button>
              </form>
            </section>
            <section className="bg-slate-900 text-green-400 p-4 rounded-xl shadow-inner font-mono text-sm overflow-x-auto">
              <h3 className="text-slate-400 mb-2 font-sans text-xs font-bold uppercase tracking-widest">Logs</h3>
              <pre>{result}</pre>
            </section>
          </div>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col h-[calc(100vh-140px)] sticky top-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">Tồn kho chi nhánh</h2>
            <div className="table-wrap flex-1 overflow-y-auto">
              <table>
                <thead>
                  <tr><th>Mã SP</th><th className="text-right">Số lượng tồn</th><th className="text-right">Thao tác</th></tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-medium text-slate-800">{item.productCode}</td>
                      <td className="text-right font-bold text-teal-600">{item.quantity}</td>
                      <td className="text-right"><button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Chỉnh sửa</button></td>
                    </tr>
                  ))}
                  {inventory.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-500">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </BranchLayout>
  );
}