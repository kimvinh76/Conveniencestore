"use client";
import { useState } from "react";

export default function TransferForm({ onSubmit, loading }) {
  const [fromBranch, setFromBranch] = useState("HUE");
  const [toBranch, setToBranch] = useState("SAIGON");
  const [items, setItems] = useState([{ productCode: "SP001", quantity: 1 }]);

  const handleAddItem = () => {
    setItems([...items, { productCode: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChangeItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fromBranch,
      toBranch,
      items: items.map(it => ({
        productCode: it.productCode.trim(),
        quantity: Number(it.quantity)
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">Chi nhánh xuất (Gửi)</label>
          <select 
            value={fromBranch}
            onChange={(e) => setFromBranch(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          >
            <option value="HUE">HUE</option>
            <option value="SAIGON">SAIGON</option>
            <option value="HANOI">HANOI</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">Chi nhánh nhập (Nhận)</label>
          <select 
            value={toBranch}
            onChange={(e) => setToBranch(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          >
            <option value="HUE">HUE</option>
            <option value="SAIGON">SAIGON</option>
            <option value="HANOI">HANOI</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Danh sách sản phẩm điều chuyển</h3>
          <button 
            type="button" 
            onClick={handleAddItem}
            className="px-4 py-2 bg-slate-100 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm"
          >
            <span className="text-xl leading-none">+</span> Thêm sản phẩm
          </button>
        </div>
        
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">STT</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Mã sản phẩm</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-48">Số lượng</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-20 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <input 
                      required
                      value={item.productCode}
                      onChange={(e) => handleChangeItem(idx, 'productCode', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                      placeholder="Ví dụ: SP001" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      required
                      min="1" 
                      value={item.quantity}
                      onChange={(e) => handleChangeItem(idx, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa dòng"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 pt-6 border-t border-slate-200">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-4 text-lg transition-colors disabled:bg-blue-400 flex items-center justify-center gap-3 ml-auto" 
          type="submit" 
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý Giao dịch...
            </>
          ) : (
            "Thực thi Lập Phiếu Điều Chuyển"
          )}
        </button>
      </div>
    </form>
  );
}
