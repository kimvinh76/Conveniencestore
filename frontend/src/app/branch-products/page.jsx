"use client";
import { useEffect, useState, useRef } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";
import DataTable from "@/components/DataTable";
import { useToast } from "@/contexts/ToastContext";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const showNotification = useToast();

  const load = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/products?branch=${branch}`);
      const normalized = (Array.isArray(data) ? data : []).map((row) => ({
        productCode: row.productCode || row.MaSP,
        productName: row.productName || row.TenHang,
        unitPrice: row.unitPrice ?? row.Gia,
      }));
      setRows(normalized);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [branch]);

  return (
    <BranchLayout active="products">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Danh mục</p>
            <h1 className="text-3xl font-bold text-slate-900">Sản phẩm</h1>
          </div>
          <button className="btn-primary" onClick={load}>
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="table-wrap">
            {loading ? <p className="py-10 text-center">Đang tải dữ liệu...</p> : (
              <table>
                <thead>
                  <tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Đơn giá</th></tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.productCode}>
                      <td className="font-bold">{row.productCode}</td>
                      <td>{row.productName}</td>
                      <td>{Number(row.unitPrice).toLocaleString()} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </BranchLayout>
  );
}