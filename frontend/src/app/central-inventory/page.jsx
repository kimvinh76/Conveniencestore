"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import DataTable from "@/components/DataTable";
import { apiFetch } from "@/components/api";

export default function Page() {
  const [branch, setBranch] = useState("HUE");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateForm, setUpdateForm] = useState({ productCode: "", quantity: "" });

  const load = async (b = branch) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/inventory?branch=${b}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(updateForm.productCode)}?branch=${branch}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(updateForm.quantity) }),
      });
      alert("Cập nhật kho thành công!");
      setUpdateForm({ productCode: "", quantity: "" });
      load();
    } catch (err) { alert(err.message); }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [branch]);

  return (
    <CentralLayout active="inventory">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Tồn kho Hệ thống</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-slate-600">Kho chi nhánh:</span>
            <select 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="HUE">HUE</option>
              <option value="SAIGON">SAIGON</option>
              <option value="HANOI">HANOI</option>
            </select>
            <button className="btn-primary" onClick={() => load()}>Tải lại</button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold mb-5">Cập nhật kho tại {branch}</h2>
             <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Mã SP</span>
                  <input value={updateForm.productCode} onChange={e => setUpdateForm({...updateForm, productCode: e.target.value})} className="px-4 py-2 border rounded-lg" required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Số lượng tồn mới</span>
                  <input type="number" value={updateForm.quantity} onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})} className="px-4 py-2 border rounded-lg" required />
                </label>
                <button type="submit" className="btn-primary mt-2">Cập nhật số lượng</button>
             </form>
          </section>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Trạng thái kho tại {branch}</h2>
            <div className="table-wrap">
              {loading ? <p className="py-10 text-center text-slate-500">Đang kiểm kho...</p> : <DataTable rows={rows} columns={["productCode", "quantity"]} />}
            </div>
          </section>
        </div>
      </div>
    </CentralLayout>
  );
}
