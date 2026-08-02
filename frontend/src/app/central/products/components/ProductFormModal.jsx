"use client";
import React from "react";

export default function ProductFormModal({ isOpen, onClose, isEditing, form, setForm, categories, brands, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <h3 className="text-xl font-bold text-indigo-900">{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-800 font-bold text-xl">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Danh mục</span>
                <select value={form.categoryCode} onChange={e => setForm({ ...form, categoryCode: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.categoryCode} value={c.categoryCode}>{c.categoryName}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Thương hiệu</span>
                <select value={form.brandCode} onChange={e => setForm({ ...form, brandCode: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white">
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => (
                    <option key={b.brandCode} value={b.brandCode}>{b.brandName}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Mã vạch (Barcode)</span>
              <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nhập mã vạch..." />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Đường dẫn ảnh</span>
              <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="/images/migoi.png" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Mô tả sản phẩm</span>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]" placeholder="Nhập mô tả chi tiết..." />
            </label>
            
            <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
              <button type="submit" className="btn-primary flex-1 font-bold py-3">Lưu thông tin</button>
              <button type="button" className="btn-ghost border flex-1 font-bold py-3" onClick={onClose}>Hủy bỏ</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
