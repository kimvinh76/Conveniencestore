"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import DataTable from "@/components/DataTable";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      // Gọi song song 2 API để lấy cả Tồn kho và Thông tin sản phẩm
      const [invData, prodData] = await Promise.all([
        apiFetch(`/api/inventory?branch=${branch}`),
        apiFetch(`/api/products?branch=${branch}`)
      ]);
      
      const invList = Array.isArray(invData) ? invData : [];
      const prodList = Array.isArray(prodData) ? prodData : [];

      // Gộp thông tin: Tên sản phẩm, Giá (từ prodList) + Số lượng (từ invList)
      const merged = prodList.map(prod => {
        const pCode = prod.productCode || prod.MaSP;
        const invItem = invList.find(i => (i.productCode || i.MaSP) === pCode);
        return { 
          productCode: pCode, 
          productName: prod.productName || prod.TenHang, 
          unitPrice: prod.unitPrice ?? prod.Gia, 
          quantity: invItem ? (invItem.quantity || invItem.SoLuongTon || 0) : 0 
        };
      });

      setInventory(merged);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory().catch(() => {});
  }, [branch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý tồn kho</h1>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          Lỗi: {error}
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
        <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách tồn kho thực tế</h2>
        <div className="table-wrap flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-slate-500">Đang kiểm kho...</p>
          ) : (
            <DataTable rows={inventory} />
          )}
        </div>
      </section>
    </div>
  );
}