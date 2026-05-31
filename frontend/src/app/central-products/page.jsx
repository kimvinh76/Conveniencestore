"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ productCode: "", productName: "", unitPrice: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/products?branch=CENTRAL");
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
  }, []);

  const handleAdd = () => {
    setForm({ productCode: "", productName: "", unitPrice: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (row) => {
    setForm({ productCode: row.productCode, productName: row.productName, unitPrice: row.unitPrice });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (code) => {
    if (!confirm(`Xác nhận xóa sản phẩm ${code}?`)) return;
    try {
      await apiFetch(`/api/products/${code}?branch=CENTRAL`, { method: "DELETE" });
      load();
    } catch (err) { alert(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/products/${form.productCode}?branch=CENTRAL` : "/api/products?branch=CENTRAL";
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <CentralLayout active="products">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Danh mục gốc</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm toàn hệ thống</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={handleAdd}>+ Thêm sản phẩm</button>
            <button className="btn-ghost border border-slate-200" onClick={load}>Tải lại</button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="table-wrap">
            {loading ? <p className="py-10 text-center">Đang tải dữ liệu...</p> : (
              <table>
                <thead>
                  <tr><th>Mã SP</th><th>Tên sản phẩm</th><th>Đơn giá</th><th className="text-right">Thao tác</th></tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.productCode}>
                      <td className="font-bold">{row.productCode}</td>
                      <td>{row.productName}</td>
                      <td>{Number(row.unitPrice).toLocaleString()} đ</td>
                      <td className="text-right">
                        <button className="text-blue-600 mr-4 font-semibold" onClick={() => handleEdit(row)}>Sửa</button>
                        <button className="text-red-600 font-semibold" onClick={() => handleDelete(row.productCode)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {showModal && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-white p-0 rounded-2xl overflow-hidden max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Mã sản phẩm</span>
                <input 
                  value={form.productCode} 
                  onChange={e => setForm({...form, productCode: e.target.value})} 
                  readOnly={isEditing} 
                  className="px-4 py-2 border rounded-lg bg-slate-50"
                  required 
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Tên sản phẩm</span>
                <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="px-4 py-2 border rounded-lg" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Giá bán (VND)</span>
                <input type="number" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} className="px-4 py-2 border rounded-lg" required />
              </label>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn-primary flex-1">Lưu</button>
                <button type="button" className="btn-ghost border flex-1" onClick={() => setShowModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </CentralLayout>
  );
}
