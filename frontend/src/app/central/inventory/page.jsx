"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import DataTable from "@/components/DataTable";

export default function CentralInventoryPage() {
  const { branch } = useBranch({ requireCentral: true });
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("HANOI");

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {

      // Chỉ gọi API cho 1 chi nhánh được chọn
      const invData = await apiFetch(`/api/inventory?branch=${selectedBranch}`);
      const invArray = Array.isArray(invData) ? invData : [];

      const prodData = await apiFetch(`/api/products?branch=${selectedBranch}`);
      const prodArray = Array.isArray(prodData) ? prodData : [];

      const merged = invArray.map(item => {
        const prod = prodArray.find(p => (p.productCode || p.MaSP) === item.productCode);
        return {
          ...item,
          branch: selectedBranch,
          productName: prod ? (prod.productName || prod.TenHang) : "Không xác định"
        };
      });

      setInventory(merged);
    }
    catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory().catch(() => { });
  }, [selectedBranch]); // Gọi lại khi đổi chi nhánh

  const branches = ["HANOI", "HUE", "SAIGON"];



  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tồn kho toàn quốc</h1>
          <p className="text-slate-500 mt-1">Giám sát số lượng hàng hóa tại các chi nhánh</p>
        </div>

        {/* Bộ lọc chi nhánh */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <label className="text-sm font-medium text-slate-600 pl-2">Lọc kho:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border-none bg-slate-50 text-slate-700 text-sm rounded-lg focus:ring-0 py-1.5 px-3 cursor-pointer outline-none"
          >
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu tồn kho...</div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Chưa có dữ liệu tồn kho.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Chi nhánh</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Mã sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tên sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Số lượng tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr key={`${item.branch}_${item.productCode}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {item.branch === "HANOI" ? "Hà Nội" : item.branch === "HUE" ? "Huế" : "Sài Gòn"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.productCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{item.productName}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full text-xs ${item.quantity <= 10 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
