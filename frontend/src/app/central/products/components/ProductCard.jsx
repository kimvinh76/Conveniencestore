"use client";
import React from "react";

export default function ProductCard({ product, onEdit, onDelete, onViewDetail }) {
  const isInactive = product.active === false;

  return (
    <div 
      onClick={() => onViewDetail && onViewDetail(product.productCode)}
      className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group cursor-pointer"
    >
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

        <div className="flex flex-col gap-1 mt-1 mb-2">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold">Danh mục:</span> {product.categoryName || "Chưa phân loại"}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold">Thương hiệu:</span> {product.brandName || "Chưa có hãng"}
          </p>
          {product.barcode && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="font-semibold">Mã vạch:</span> {product.barcode}
            </p>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span className="text-lg font-black text-indigo-600">
            {Number(product.unitPrice).toLocaleString('vi-VN')} đ
          </span>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Sửa
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(product); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                product.active
                  ? "text-rose-700 bg-rose-50 hover:bg-rose-100"
                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              {product.active ? "Tạm ngưng" : "Mở bán lại"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
