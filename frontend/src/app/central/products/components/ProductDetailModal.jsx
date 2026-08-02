"use client";
import React from "react";

export default function ProductDetailModal({ isOpen, onClose, product, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <h3 className="text-xl font-bold text-indigo-900">Chi tiết sản phẩm</h3>
          <button onClick={onClose} className="text-indigo-600 hover:text-indigo-800 font-bold text-xl">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {loading || !product ? (
            <div className="py-10 text-center text-slate-500">Đang tải chi tiết...</div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} className="w-24 h-24 object-contain border rounded-lg p-2 bg-slate-50" />
                ) : (
                  <div className="w-24 h-24 border rounded-lg bg-slate-50 flex items-center justify-center text-3xl">🛍️</div>
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800">{product.productName}</h4>
                  <p className="text-sm font-semibold text-indigo-600 mb-1">{product.productCode}</p>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${product.active ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                    {product.active ? 'Đang kinh doanh' : 'Ngừng bán'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Giá bán gốc</p>
                  <p className="font-bold text-slate-800">{Number(product.unitPrice).toLocaleString('vi-VN')} đ</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Đơn vị tính</p>
                  <p className="font-bold text-slate-800">{product.unit || '---'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Danh mục</p>
                  <p className="font-bold text-slate-800">{product.categoryName || '---'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Thương hiệu</p>
                  <p className="font-bold text-slate-800">{product.brandName || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Mã vạch</p>
                  <p className="font-bold text-slate-800">{product.barcode || '---'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">Mô tả chi tiết</p>
                <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[100px] whitespace-pre-wrap">
                  {product.description || "Chưa có mô tả cho sản phẩm này."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
