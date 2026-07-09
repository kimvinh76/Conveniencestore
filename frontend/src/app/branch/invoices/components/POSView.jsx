"use client";
import React, { useMemo } from "react";

export default function POSView({ products, searchTerm, setSearchTerm, addToCart }) {
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p =>
      (p.productName || "").toLowerCase().includes(lower) ||
      (p.productCode || "").toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
      <input
        type="text"
        placeholder="🔍 Tìm kiếm sản phẩm (nhập tên hoặc mã)..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none mb-6"
      />
      <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 content-start flex-1">
        {filteredProducts.map(p => {
          const isOutOfStock = p.stock !== undefined && p.stock <= 0;
          return (
            <button
              key={p.productCode}
              onClick={() => addToCart(p)}
              disabled={isOutOfStock}
              className={`flex flex-col items-center justify-center text-center p-4 bg-white border rounded-2xl transition-all aspect-square group ${isOutOfStock
                ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                : "border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer"
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors relative overflow-visible ${isOutOfStock
                ? "bg-slate-200 text-slate-400"
                : "bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white"
                }`}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.productName}
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}

                {p.stock !== undefined && (
                  <span className={`absolute -top-1.5 -right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white shadow-sm ${p.stock > 10 ? "bg-emerald-600" : p.stock > 0 ? "bg-amber-500" : "bg-rose-600"
                    }`}>
                    {p.stock}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm text-slate-700 line-clamp-2">{p.productName}</span>
              <span className="text-xs text-teal-600 font-bold mt-1">
                {isOutOfStock ? "Hết hàng" : `${Number(p.unitPrice).toLocaleString('vi-VN')} đ`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
