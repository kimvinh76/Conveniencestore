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
  setSelectedCustomer,
  promos,
  setPromos,
  diemSuDung,
  setDiemSuDung
}) {
  const [promoCode, setPromoCode] = React.useState("");
  const { useToast } = require("@/contexts/ToastContext");
  const showNotification = useToast();

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const data = await require("@/services/api").apiFetch(`/api/promotions/check/${promoCode.trim()}?branch=${branch}`);
      if (data.IsActive) {
        if (promos.some(p => p.MaKM === data.MaKM)) {
          showNotification("Mã này đã được áp dụng", "error");
          return;
        }
        if (!data.ChoPhepCongDon && promos.length > 0) {
          showNotification("Mã này độc quyền, không thể dùng chung với mã khác", "error");
          return;
        }
        if (promos.some(p => !p.ChoPhepCongDon)) {
          showNotification("Đơn hàng đang có mã độc quyền, không thể thêm mã", "error");
          return;
        }
        if (totalAmount < data.DonHangToiThieu) {
          showNotification(`Đơn hàng chưa đạt tối thiểu ${data.DonHangToiThieu.toLocaleString()}đ để dùng mã này`, "error");
          return;
        }
        setPromos([...promos, data]);
        setPromoCode("");
        showNotification("Áp dụng mã thành công", "success");
      } else {
        showNotification("Mã không hợp lệ hoặc đã hết lượt", "error");
      }
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const removePromo = (maKM) => {
    setPromos(promos.filter(p => p.MaKM !== maKM));
  };

  // Tính tiền giảm từ KM
  let tongTienGiamKM = 0;
  promos.forEach(p => {
    if (p.LoaiKhuyenMai === "PERCENTAGE") {
      let giam = (totalAmount * p.PhanTramGiam) / 100;
      if (p.GiamToiDa && giam > p.GiamToiDa) giam = p.GiamToiDa;
      tongTienGiamKM += giam;
    } else {
      tongTienGiamKM += p.SoTienGiamTrucTiep;
    }
  });

  const soTienGiamTuDiem = diemSuDung * 100;
  const thanhToan = Math.max(0, totalAmount - tongTienGiamKM - soTienGiamTuDiem);
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

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2">
            <input 
              value={promoCode} 
              onChange={e => setPromoCode(e.target.value.toUpperCase())} 
              placeholder="Nhập mã khuyến mãi..." 
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm outline-none" 
            />
            <button onClick={handleApplyPromo} className="px-4 bg-teal-50 text-teal-700 font-bold rounded-lg border border-teal-200 hover:bg-teal-100">Áp dụng</button>
          </div>
          
          {promos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {promos.map(p => (
                <div key={p.MaKM} className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 font-bold">
                  {p.MaKM} <button onClick={() => removePromo(p.MaKM)} className="text-red-500 hover:text-red-700 ml-1">✕</button>
                </div>
              ))}
            </div>
          )}
          
          {selectedCustomer && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-amber-800">Điểm hiện có:</span>
                <span className="font-bold text-amber-600">{selectedCustomer.points || 0} điểm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600 w-24">Dùng điểm:</span>
                <input 
                  type="number" 
                  min="0" 
                  max={selectedCustomer.points || 0}
                  value={diemSuDung} 
                  onChange={e => setDiemSuDung(Math.min(e.target.value, selectedCustomer.points || 0))} 
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded outline-none" 
                />
              </div>
            </div>
          )}
        </div>

        <input 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          placeholder="Nhập ghi chú cho đơn hàng..." 
          className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 bg-slate-50 text-sm outline-none" 
        />
        
        <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-semibold">Tiền hàng</span>
            <span className="font-bold">{totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          {tongTienGiamKM > 0 && (
            <div className="flex justify-between items-center text-sm text-green-600">
              <span className="font-semibold">Trừ khuyến mãi</span>
              <span className="font-bold">-{tongTienGiamKM.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
          {soTienGiamTuDiem > 0 && (
            <div className="flex justify-between items-center text-sm text-amber-600">
              <span className="font-semibold">Trừ dùng điểm</span>
              <span className="font-bold">-{soTienGiamTuDiem.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500 font-bold text-lg">Khách trả</span>
          <span className="text-3xl font-black text-teal-600">
            {thanhToan.toLocaleString('vi-VN')} <span className="text-xl">đ</span>
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
