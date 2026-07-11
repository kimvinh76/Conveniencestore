"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import ProductList from "./components/ProductList";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ productCode: "", productName: "", unitPrice: "", imageUrl: "", description: "", unit: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const showNotification = useToast();

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  const { isOpen: isDeleteOpen, open: openDeleteModal, close: closeDeleteModal } = useModal();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/products?branch=CENTRAL");
      const normalized = (Array.isArray(data) ? data : []).map((row) => ({
        productCode: row.productCode || row.MaSP,
        productName: row.productName || row.TenHang,
        unitPrice: row.unitPrice ?? row.Gia,
        imageUrl: row.imageUrl,
        description: row.description,
        unit: row.unit,
        active: row.active ?? true,
      }));
      setRows(normalized);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => { });
  }, []);

  const handleAdd = () => {
    setForm({ productCode: "", productName: "", unitPrice: "", imageUrl: "", description: "", unit: "" });
    setIsEditing(false);
    openFormModal();
  };

  const handleEdit = (row) => {
    setForm({ productCode: row.productCode, productName: row.productName, unitPrice: row.unitPrice, imageUrl: row.imageUrl || "", description: row.description || "", unit: row.unit || "" });
    setIsEditing(true);
    openFormModal();
  };

  const handleDelete = async (code) => {
    setProductToDelete(code);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiFetch(`/api/products/${productToDelete}?branch=CENTRAL`, { method: "DELETE" });
      closeDeleteModal();
      showNotification(`Đã ngừng kinh doanh sản phẩm ${productToDelete}`);
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
      closeFormModal();
      showNotification(isEditing ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm mới thành công");
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Danh mục gốc</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm toàn hệ thống</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={handleAdd}>+ Thêm sản phẩm</button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        {loading ? (
          <div className="bg-white py-20 text-center text-slate-500 border border-slate-200 rounded-2xl">
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : (
          <ProductList
            products={rows}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={closeFormModal} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Mã sản phẩm</span>
                <input
                  value={form.productCode}
                  onChange={e => setForm({ ...form, productCode: e.target.value })}
                  readOnly={isEditing}
                  className={`px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isEditing ? "bg-slate-100 text-slate-500" : "bg-white"}`}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Tên sản phẩm</span>
                <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Giá bán gốc (VND)</span>
                <input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Đơn vị tính</span>
                <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="VD: Gói, Hộp, Chai" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Đường dẫn ảnh</span>
                <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="/images/migoi.png" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Mô tả sản phẩm</span>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]" placeholder="Nhập mô tả chi tiết..." />
              </label>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn-primary flex-1 font-bold">Lưu thông tin</button>
                <button type="button" className="btn-ghost border flex-1 font-bold" onClick={closeFormModal}>Hủy bỏ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={closeDeleteModal} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50 text-red-600">
              <h3 className="text-xl font-bold">Xác nhận ngừng kinh doanh</h3>
              <button onClick={closeDeleteModal} className="text-red-400 hover:text-red-600 font-bold">✕</button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-6 text-center">Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm <strong className="text-slate-900">{productToDelete}</strong>?<br/>Sản phẩm sẽ bị ẩn khỏi danh sách, nhưng vẫn giữ được lịch sử hóa đơn cũ.</p>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all">Ngừng bán ngay</button>
                <button onClick={closeDeleteModal} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
