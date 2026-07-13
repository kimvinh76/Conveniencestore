"use client";
import React from "react";
import CustomerSelector from "./CustomerSelector";

export default function CartView({ 
  branch,
  cartItems, 
  updateCartQuantity, 
  note, 
  setNote, 
  totalAmount, 
  handleCheckout, 
  cashierName,
  selectedCustomer,
  setSelectedCustomer
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">🛒 Hóa đơn hiện tại</h3>
      <div className="px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">Thu ngân:</span>
        <span className="font-bold text-slate-800">{cashierName}</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {cartItems.length === 0 && (
          <div className="text-center text-slate-400 py-10 mt-10">Chưa có sản phẩm nào trong giỏ</div>
        )}
        {cartItems.map(item => (
          <div key={item.productCode} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-1">
              <p className="font-bold text-sm text-slate-800">{item.productName}</p>
              <p className="text-xs font-semibold text-teal-600">
                {Number(item.unitPrice).toLocaleString('vi-VN')} đ
              </p>
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button 
                onClick={() => updateCartQuantity(item.productCode, item.quantity - 1)} 
                className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-600"
              >
                -
              </button>
              <input 
                type="number" 
                value={item.quantity} 
                onChange={(e) => updateCartQuantity(item.productCode, e.target.value)} 
                className="w-10 text-center font-bold text-sm border-x border-slate-200 py-1.5 outline-none" 
              />
              <button 
                onClick={() => updateCartQuantity(item.productCode, item.quantity + 1)} 
                className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-600"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
        <CustomerSelector 
          branch={branch}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
        />

        <input 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Nhập ghi chú cho đơn hàng..." 
          className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 bg-slate-50 text-sm outline-none" 
        />
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500 font-bold">Thành tiền</span>
          <span className="text-2xl font-black text-teal-600">
            {totalAmount.toLocaleString('vi-VN')} <span className="text-lg">đ</span>
          </span>
        </div>
        <button 
          onClick={handleCheckout} 
          className="btn-primary w-full py-4 text-lg shadow-lg shadow-teal-500/30"
        >
          THANH TOÁN NGAY
        </button>
      </div>
    </div>
  );
}
