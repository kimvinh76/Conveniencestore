"use client";
import { useEffect, useState, useRef } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";
import { useToast } from "@/contexts/ToastContext";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ productCode: "", productName: "", unitPrice: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const showNotification = useToast();

  const formModalRef = useRef(null);
  const deleteModalRef = useRef(null);

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
    formModalRef.current?.showModal();
  };

  const handleEdit = (row) => {
    setForm({ productCode: row.productCode, productName: row.productName, unitPrice: row.unitPrice });
    setIsEditing(true);
    formModalRef.current?.showModal();
  };

  const handleDelete = async (code) => {
    setProductToDelete(code);
    deleteModalRef.current?.showModal();
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiFetch(`/api/products/${productToDelete}?branch=CENTRAL`, { method: "DELETE" });
      deleteModalRef.current?.close();
      showNotification(`Đã xóa sản phẩm ${productToDelete} thành công`);
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
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
      formModalRef.current?.close();
      showNotification(isEditing ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm mới thành công");
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
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

      {/* Modal Thêm/Sửa */}
      <dialog ref={formModalRef} className="modal w-full max-w-md bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
          <button onClick={() => formModalRef.current?.close()} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Mã sản phẩm</span>
            <input 
              value={form.productCode} 
              onChange={e => setForm({...form, productCode: e.target.value})} 
              readOnly={isEditing} 
              className={`px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isEditing ? "bg-slate-100 text-slate-500" : "bg-white"}`}
              required 
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Tên sản phẩm</span>
            <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-slate-700">Giá bán (VND)</span>
            <input type="number" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
          </label>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary flex-1 font-bold">Lưu thông tin</button>
            <button type="button" className="btn-ghost border flex-1 font-bold" onClick={() => formModalRef.current?.close()}>Hủy bỏ</button>
          </div>
        </form>
      </dialog>

      {/* Modal Xác nhận xóa */}
      <dialog ref={deleteModalRef} className="modal w-full max-w-sm bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-600">
          <h3 className="text-xl font-bold">Xác nhận xóa sản phẩm</h3>
          <button onClick={() => deleteModalRef.current?.close()} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 text-center">Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-900">{productToDelete}</strong>? Thao tác này sẽ xóa dữ liệu liên quan tại tất cả chi nhánh.</p>
          <div className="flex gap-3">
            <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all">Xóa ngay</button>
            <button onClick={() => deleteModalRef.current?.close()} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
          </div>
        </div>
      </dialog>

    </CentralLayout>
  );
}
