"use client";
import { useState } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import TransferForm from "./components/TransferForm";

export default function TransferPage() {
  const [result, setResult] = useState("Chưa có thao tác.");
  const [loading, setLoading] = useState(false);
  const showNotification = useToast();

  const onSubmit = async (payload) => {
    
    try {
      setLoading(true);
      const data = await apiFetch("/api/transfer-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(data, null, 2));
      showNotification("Điều chuyển kho thành công!", "success");
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
        <h1 className="text-3xl font-bold text-slate-900">Điều phối Phân tán</h1>
      </header>

      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Giao dịch luân chuyển hàng hóa</h2>
        
        {/* Render Child Component */}
        <TransferForm onSubmit={onSubmit} loading={loading} />
        
      </section>

      {/* Kết quả trả về từ API */}
      <section className="bg-slate-900 p-6 rounded-2xl shadow-sm text-green-400 font-mono text-sm overflow-x-auto">
        <h3 className="text-slate-400 mb-2 font-sans font-semibold">Kết quả giao dịch:</h3>
        <pre>{result}</pre>
      </section>
    </div>
  );
}
