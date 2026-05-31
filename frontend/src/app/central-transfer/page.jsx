"use client";
import { useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";

export default function Page() {
  const [result, setResult] = useState("Chưa có thao tác.");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const payload = {
      branch: "CENTRAL",
      fromBranch: form.get("fromBranch"),
      toBranch: form.get("toBranch"),
      productCode: form.get("productCode"),
      quantity: Number(form.get("quantity") || 0),
    };
    try {
      setLoading(true);
      const data = await apiFetch("/api/transfer-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(data, null, 2));
      alert("Điều chuyển kho thành công!");
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CentralLayout active="transfer">
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
          <h1 className="text-3xl font-bold text-slate-900">Điều phối Phân tán</h1>
        </header>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Giao dịch luân chuyển hàng hóa</h2>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Chi nhánh xuất (Gửi)</label>
              <select name="fromBranch" defaultValue="HUE" className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="HUE">HUE</option>
                <option value="SAIGON">SAIGON</option>
                <option value="HANOI">HANOI</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Chi nhánh nhập (Nhận)</label>
              <select name="toBranch" defaultValue="SAIGON" className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="HUE">HUE</option>
                <option value="SAIGON">SAIGON</option>
                <option value="HANOI">HANOI</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Mã sản phẩm</label>
              <input name="productCode" defaultValue="MI_GOI" required className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ví dụ: MI_GOI" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Số lượng chuyển</label>
              <input type="number" name="quantity" min="1" defaultValue="1" className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2 mt-4">
              <button className="btn-primary w-full py-4 text-lg" type="submit" disabled={loading}>
                {loading ? "Đang xử lý Transaction..." : "Thực thi điều chuyển quốc gia"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-slate-900 text-green-400 p-6 rounded-2xl shadow-inner font-mono text-sm overflow-x-auto min-h-[150px]">
          <p className="text-slate-400 mb-2 border-b border-slate-700 pb-2">Response Log:</p>
          <pre>{result}</pre>
        </section>
      </div>
    </CentralLayout>
  );
}
