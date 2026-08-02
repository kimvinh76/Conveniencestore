"use client";

export default function TransferForm({ onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Chi nhánh xuất (Gửi)</label>
        <select 
          name="fromBranch" 
          defaultValue="HUE" 
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="HUE">HUE</option>
          <option value="SAIGON">SAIGON</option>
          <option value="HANOI">HANOI</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Chi nhánh nhập (Nhận)</label>
        <select 
          name="toBranch" 
          defaultValue="SAIGON" 
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="HUE">HUE</option>
          <option value="SAIGON">SAIGON</option>
          <option value="HANOI">HANOI</option>
        </select>
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Mã sản phẩm</label>
        <input 
          name="productCode" 
          defaultValue="SP001" 
          required 
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Ví dụ: SP001" 
        />
      </div>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Số lượng chuyển</label>
        <input 
          type="number" 
          name="quantity" 
          min="1" 
          defaultValue="1" 
          className="px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>
      
      <div className="md:col-span-2 mt-4">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl w-full py-4 text-lg transition-colors disabled:bg-blue-400" 
          type="submit" 
          disabled={loading}
        >
          {loading ? "Đang xử lý Giao dịch phân tán..." : "Thực thi điều chuyển quốc gia"}
        </button>
      </div>
    </form>
  );
}
