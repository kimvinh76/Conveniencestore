"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({ customerId: "", fullName: "", phoneNumber: "" });
  const [isEditing, setIsEditing] = useState(false);
  
  const showNotification = useToast();
  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/customers?branch=CENTRAL");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const handleEdit = (row) => {
    setForm({ 
      customerId: row.customerId, 
      fullName: row.fullName, 
      phoneNumber: row.phoneNumber || ""
    });
    setIsEditing(true);
    openFormModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await apiFetch(`/api/customers/${form.customerId}?branch=CENTRAL`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: form.fullName, phoneNumber: form.phoneNumber }),
        });
        showNotification("Cập nhật khách hàng thành công");
      } else {
        // Form tạo khách hàng từ Central
        const customerId = `KH_${Date.now()}`;
        await apiFetch("/api/customers?branch=CENTRAL", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, fullName: form.fullName, phoneNumber: form.phoneNumber }),
        });
        showNotification("Thêm khách hàng thành công");
      }
      closeFormModal();
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Central Console</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Khách hàng Toàn hệ thống</h1>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-medium">Đang tải danh sách khách hàng...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">Chưa có dữ liệu khách hàng</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-slate-200">Mã KH</th>
                    <th className="p-4 font-bold border-b border-slate-200">Họ tên</th>
                    <th className="p-4 font-bold border-b border-slate-200">Số điện thoại</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-right">Điểm tích lũy</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-center">Nơi đăng ký</th>
                    <th className="p-4 font-bold border-b border-slate-200">Ngày tạo</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-semibold text-slate-700">{r.customerId}</td>
                      <td className="p-4 text-sm font-bold text-indigo-700">{r.fullName}</td>
                      <td className="p-4 text-sm text-slate-600">{r.phoneNumber || "---"}</td>
                      <td className="p-4 text-sm text-right font-black text-amber-500">{r.points.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded uppercase tracking-wider">
                          {r.branchId}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {r.registeredAt ? new Date(r.registeredAt).toLocaleString('vi-VN') : "---"}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleEdit(r)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeFormModal} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-xl font-bold text-indigo-900">{isEditing ? "Cập nhật Khách hàng" : "Thêm Khách hàng"}</h3>
              <button onClick={closeFormModal} className="text-indigo-400 hover:text-indigo-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-100 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Họ và tên <span className="text-red-500">*</span></span>
                  <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" required placeholder="Nguyễn Văn A" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Số điện thoại</span>
                  <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className="px-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="09xxxxxxxxx" />
                </label>
                {isEditing && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">⚠️ Điểm tích lũy không thể chỉnh sửa bằng tay để chống gian lận. Điểm chỉ được cộng tự động khi phát sinh hóa đơn.</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" onClick={closeFormModal}>Hủy</button>
                <button type="submit" className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-xl transition-all transform active:scale-[0.98]">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
