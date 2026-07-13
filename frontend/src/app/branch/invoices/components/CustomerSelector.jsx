import React, { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";

export default function CustomerSelector({ branch, onSelectCustomer, selectedCustomer }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const showNotification = useToast();
  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  
  const [form, setForm] = useState({ fullName: "", phoneNumber: "" });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    setLoading(true);
    try {
      const data = await apiFetch(`/api/customers?branch=${branch}&search=${phone}`);
      if (data && data.length > 0) {
        // Ưu tiên khớp chính xác SĐT
        const exactMatch = data.find(c => c.phoneNumber === phone);
        if (exactMatch) {
          onSelectCustomer(exactMatch);
        } else {
          onSelectCustomer(data[0]); // Lấy người đầu tiên
        }
      } else {
        // Không tìm thấy
        onSelectCustomer(null);
        showNotification("Không tìm thấy khách hàng. Vui lòng thêm mới!", "error");
        setForm({ fullName: "", phoneNumber: phone });
        openFormModal();
      }
    } catch (error) {
      showNotification("Lỗi tra cứu khách hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerId = `KH_${Date.now()}`;
      const newCustomer = await apiFetch(`/api/customers?branch=${branch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerId, 
          fullName: form.fullName, 
          phoneNumber: form.phoneNumber
        }),
      });
      showNotification("Đã thêm khách hàng mới thành công!");
      closeFormModal();
      onSelectCustomer(newCustomer);
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <div className="mb-4">
      {selectedCustomer ? (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-teal-800">{selectedCustomer.fullName}</p>
            <p className="text-xs font-semibold text-teal-600">SĐT: {selectedCustomer.phoneNumber || "---"} - Điểm: <span className="font-black text-amber-500">{selectedCustomer.points || 0}</span></p>
          </div>
          <button 
            type="button" 
            onClick={() => { onSelectCustomer(null); setPhone(""); }}
            className="text-xs font-bold text-teal-600 hover:text-teal-800"
          >
            Bỏ chọn
          </button>
        </div>
      ) : (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Tra cứu khách bằng SĐT..." 
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {loading ? "..." : "Tìm"}
          </button>
        </form>
      )}

      {/* Modal Thêm Khách Hàng Nhanh */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeFormModal} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden transform transition-all">
            <div className="p-5 border-b border-slate-100 bg-teal-50 flex justify-between items-center">
              <h3 className="font-bold text-teal-900">Thêm Khách hàng mới</h3>
              <button type="button" onClick={closeFormModal} className="text-teal-400 hover:text-teal-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-slate-700">Họ và tên <span className="text-red-500">*</span></span>
                <input 
                  value={form.fullName} 
                  onChange={e => setForm({ ...form, fullName: e.target.value })} 
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" 
                  required 
                  autoFocus
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-slate-700">Số điện thoại</span>
                <input 
                  value={form.phoneNumber} 
                  onChange={e => setForm({ ...form, phoneNumber: e.target.value })} 
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" 
                />
              </label>
              <button type="submit" className="mt-2 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all">
                Lưu khách hàng
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
