"use client";
import React from "react";

export default function ProductDeleteModal({ isOpen, onClose, productToToggle, onConfirm }) {
  if (!isOpen || !productToToggle) return null;

  const isActive = productToToggle.active !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10">
        <div className={`p-6 border-b border-slate-100 flex justify-between items-center rounded-t-2xl ${isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <h3 className="text-xl font-bold">{isActive ? "Xác nhận tạm ngưng bán" : "Xác nhận mở bán lại"}</h3>
          <button onClick={onClose} className={`${isActive ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-400 hover:text-emerald-600'} font-bold`}>✕</button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-6 text-center">
            Bạn có chắc chắn muốn {isActive ? "tạm ngưng bán" : "mở bán lại"} sản phẩm <strong className="text-slate-900">{productToToggle.productName} ({productToToggle.productCode})</strong>?<br/>
            {isActive ? "Sản phẩm sẽ chuyển sang trạng thái ngừng kinh doanh trên toàn hệ thống chi nhánh." : "Sản phẩm sẽ được khôi phục trạng thái hoạt động trên toàn hệ thống chi nhánh."}
          </p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className={`${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold py-2 px-4 rounded-xl flex-1 transition-all`}>
              {isActive ? "Tạm ngưng ngay" : "Mở bán lại"}
            </button>
            <button onClick={onClose} className="btn-ghost border flex-1 font-bold">Hủy bỏ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
