"use client";
import React, { useMemo, useState } from "react";
import ProductCard from "./ProductCard";

export default function ProductList({ products, productImages, productDescriptions, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.productName || "").toLowerCase().includes(lower) ||
      (p.productCode || "").toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <span className="text-sm font-semibold text-slate-500">
          Tìm thấy <span className="text-indigo-600 font-bold">{filteredProducts.length}</span> sản phẩm hệ thống
        </span>
        <input 
          type="text" 
          placeholder="🔍 Tìm theo mã hoặc tên sản phẩm..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white py-16 text-center text-slate-400 border border-slate-200 rounded-2xl">
          Không tìm thấy sản phẩm nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <ProductCard 
              key={p.productCode} 
              product={p} 
              image={productImages[p.productCode]}
              description={productDescriptions[p.productCode]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
