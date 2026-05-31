"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";
import { useBranch } from "@/components/useBranch";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/products?branch=${branch}`);
      setProducts(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts().catch(() => {});
  }, [branch]);

  return (
    <BranchLayout active="products">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tra cứu Chung</p>
            <h1 className="text-3xl font-bold text-slate-900">Danh sách sản phẩm</h1>
          </div>
          <button className="btn-primary" onClick={loadProducts}>
            {loading ? "Đang tải..." : "Tải lại danh sách"}
          </button>
        </header>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="table-wrap">
             <DataTable rows={products} />
           </div>
        </section> 
      </div>
    </BranchLayout>
  );
}