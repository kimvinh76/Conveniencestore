"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function PromotionModal({ isOpen, onClose, onSuccess, initialData }) {
  const showNotification = useToast();
  const isEditing = !!initialData;

  const [form, setForm] = useState({
    MaKM: "",
    TenChuongTrinh: "",
    LoaiKhuyenMai: "PERCENTAGE",
    PhanTramGiam: 0,
    SoTienGiamTrucTiep: 0,
    GiamToiDa: "",
    DonHangToiThieu: 0,
    SoLuongGioiHan: "",
    NgayBatDau: "",
    NgayKetThuc: "",
    ChoPhepCongDon: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        MaKM: initialData.MaKM,
        TenChuongTrinh: initialData.TenChuongTrinh,
        LoaiKhuyenMai: initialData.LoaiKhuyenMai || "PERCENTAGE",
        PhanTramGiam: initialData.PhanTramGiam || 0,
        SoTienGiamTrucTiep: initialData.SoTienGiamTrucTiep || 0,
        GiamToiDa: initialData.GiamToiDa || "",
        DonHangToiThieu: initialData.DonHangToiThieu || 0,
        SoLuongGioiHan: initialData.SoLuongGioiHan || "",
        NgayBatDau: initialData.NgayBatDau ? initialData.NgayBatDau.split("T")[0] : "",
        NgayKetThuc: initialData.NgayKetThuc ? initialData.NgayKetThuc.split("T")[0] : "",
        ChoPhepCongDon: initialData.ChoPhepCongDon !== undefined ? initialData.ChoPhepCongDon : true,
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        MaKM: form.MaKM,
        TenChuongTrinh: form.TenChuongTrinh,
        LoaiKhuyenMai: form.LoaiKhuyenMai,
        PhanTramGiam: Number(form.PhanTramGiam),
        SoTienGiamTrucTiep: Number(form.SoTienGiamTrucTiep),
        GiamToiDa: form.GiamToiDa ? Number(form.GiamToiDa) : null,
        DonHangToiThieu: Number(form.DonHangToiThieu),
        SoLuongGioiHan: form.SoLuongGioiHan ? Number(form.SoLuongGioiHan) : null,
        NgayBatDau: form.NgayBatDau,
        NgayKetThuc: form.NgayKetThuc,
        ChoPhepCongDon: form.ChoPhepCongDon,
      };

      if (isEditing) {
        await apiFetch(`/api/promotions/${form.MaKM}?branch=CENTRAL`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showNotification("Cập nhật khuyến mãi thành công");
      } else {
        await apiFetch("/api/promotions?branch=CENTRAL", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showNotification("Tạo khuyến mãi thành công");
      }
      onSuccess();
      onClose();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <h3 className="text-xl font-bold text-indigo-900">{isEditing ? "Cập nhật Khuyến Mãi" : "Tạo Mã Khuyến Mãi"}</h3>
          <button onClick={onClose} className="text-indigo-400 hover:text-indigo-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-100 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Mã Khuyến Mãi <span className="text-red-500">*</span></span>
              <input value={form.MaKM} onChange={e => setForm({...form, MaKM: e.target.value.toUpperCase()})} disabled={isEditing} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 uppercase disabled:bg-slate-100" required placeholder="VD: SUMMER26" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Tên Chương Trình <span className="text-red-500">*</span></span>
              <input value={form.TenChuongTrinh} onChange={e => setForm({...form, TenChuongTrinh: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required placeholder="Sale sập sàn mùa hè" />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Loại Khuyến Mãi</span>
              <select value={form.LoaiKhuyenMai} onChange={e => setForm({...form, LoaiKhuyenMai: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PERCENTAGE">Giảm theo %</option>
                <option value="FIXED">Giảm tiền trực tiếp</option>
              </select>
            </label>
            
            {form.LoaiKhuyenMai === "PERCENTAGE" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-slate-700">% Giảm <span className="text-red-500">*</span></span>
                <input type="number" min="0" max="100" value={form.PhanTramGiam} onChange={e => setForm({...form, PhanTramGiam: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
              </label>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-slate-700">Số tiền giảm (VNĐ) <span className="text-red-500">*</span></span>
                <input type="number" min="0" value={form.SoTienGiamTrucTiep} onChange={e => setForm({...form, SoTienGiamTrucTiep: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Giảm tối đa (VNĐ)</span>
              <input type="number" min="0" value={form.GiamToiDa} onChange={e => setForm({...form, GiamToiDa: e.target.value})} disabled={form.LoaiKhuyenMai === "FIXED"} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100" placeholder="Không giới hạn" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Đơn hàng tối thiểu (VNĐ)</span>
              <input type="number" min="0" value={form.DonHangToiThieu} onChange={e => setForm({...form, DonHangToiThieu: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Số lượng giới hạn</span>
              <input type="number" min="1" value={form.SoLuongGioiHan} onChange={e => setForm({...form, SoLuongGioiHan: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Không giới hạn" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Ngày Bắt Đầu <span className="text-red-500">*</span></span>
              <input type="date" value={form.NgayBatDau} onChange={e => setForm({...form, NgayBatDau: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-700">Ngày Kết Thúc <span className="text-red-500">*</span></span>
              <input type="date" value={form.NgayKetThuc} onChange={e => setForm({...form, NgayKetThuc: e.target.value})} className="px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" required />
            </label>
          </div>

          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={form.ChoPhepCongDon} onChange={e => setForm({...form, ChoPhepCongDon: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="text-sm font-bold text-slate-700">Cho phép áp dụng cùng lúc với các mã KM khác (Cộng dồn)</span>
          </label>
          
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" className="flex-1 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" onClick={onClose}>Hủy</button>
            <button type="submit" className="flex-1 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-xl transition-all transform active:scale-[0.98]">
              {isEditing ? "Lưu thay đổi" : "Tạo Mã"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
