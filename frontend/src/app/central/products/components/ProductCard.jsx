"use client";
import React from "react";

export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
      {/* Product Image */}
      <div className="bg-slate-50 h-40 flex items-center justify-center p-4 relative border-b border-slate-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-32 object-contain group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <span className="text-5xl">🛍️</span>
        )}
        <span className="absolute top-3 left-3 flex gap-2">
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            {product.productCode}
          </span>
          {product.active === false && (
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-200 shadow-sm">
              Ngừng bán
            </span>
          )}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {product.productName}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 flex-1">
          {product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}
        </p>

        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400">Giá bán gốc</span>
          <span className="text-lg font-black text-indigo-600">
            {Number(product.unitPrice).toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
          >
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onDelete(product.productCode)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
          >
            Ngừng king doanh
          </button>
        </div>
      </div>
    </div>
  );
}
