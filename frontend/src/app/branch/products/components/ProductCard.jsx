"use client";
import React from "react";

export default function ProductCard({ product, onViewDetail }) {
  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;

  return (
    <div 
      onClick={() => onViewDetail && onViewDetail(product.productCode)}
      className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group cursor-pointer"
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

        {/* Local Stock Badge */}
        <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-bold text-white shadow-sm ${stock > 10 ? "bg-emerald-600" : stock > 0 ? "bg-amber-500" : "bg-rose-600"
          }`}>
          {isOutOfStock ? "Hết hàng" : `Tồn kho: ${stock}`}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex gap-2">
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
              {product.productCode}
            </span>
            {product.active === false && (
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded uppercase tracking-wider border border-rose-200 shadow-sm">
                Ngừng bán
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400">Đơn vị: {product.unit || "Cái"}</span>
        </div>

        <h3 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-teal-600 transition-colors">
          {product.productName}
        </h3>

        <div className="flex flex-col gap-1 mt-1 flex-1">
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

        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-400">Giá bán lẻ</span>
          <span className="text-lg font-black text-teal-600">
            {Number(product.unitPrice).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>
    </div>
  );
}
