"use client";
import React from "react";
import DataTable from "@/components/DataTable";

export default function CentralInvoiceDetailsModal({ 
  isOpen, 
  title, 
  details, 
  promos = [],
  invoiceInfo,
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      
      {/* Modal dialog */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800">
            Chi tiết hóa đơn: <span className="text-teal-600">{title}</span>
          </h3>
          <button 
            className="btn-ghost !py-1.5 !px-3 font-semibold" 
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <div className="table-wrap">
            <h4 className="font-bold text-slate-700 mb-2">Chi tiết sản phẩm</h4>
            <DataTable rows={details} />
          </div>

          {promos && promos.length > 0 && (
            <div className="table-wrap">
              <h4 className="font-bold text-slate-700 mb-2">Khuyến mãi áp dụng</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-3 font-bold border-b border-slate-200">Mã KM</th>
                    <th className="p-3 font-bold border-b border-slate-200">Chương trình</th>
                    <th className="p-3 font-bold border-b border-slate-200 text-right">Số tiền giảm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promos.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 text-sm font-bold text-teal-600">{p.MaKM}</td>
                      <td className="p-3 text-sm font-semibold text-slate-700">{p.TenChuongTrinh}</td>
                      <td className="p-3 text-sm font-bold text-red-500 text-right">-{new Intl.NumberFormat('vi-VN').format(p.SoTienGiam)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {invoiceInfo && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mt-auto">
              <div className="flex flex-col gap-2 max-w-sm ml-auto">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold">Tổng tiền hàng:</span>
                  <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN').format(invoiceInfo.TongTienGoc || 0)} đ</span>
                </div>
                {(invoiceInfo.TongSoTienGiam > 0) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold">Khuyến mãi:</span>
                    <span className="font-bold text-green-600">-{new Intl.NumberFormat('vi-VN').format(invoiceInfo.TongSoTienGiam)} đ</span>
                  </div>
                )}
                {(invoiceInfo.SoTienGiamTuDiem > 0) && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-semibold">Trừ dùng điểm {invoiceInfo.DiemDaDung ? `(${invoiceInfo.DiemDaDung} điểm)` : ''}:</span>
                    <span className="font-bold text-amber-600">-{new Intl.NumberFormat('vi-VN').format(invoiceInfo.SoTienGiamTuDiem)} đ</span>
                  </div>
                )}
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between items-center">
                  <span className="text-slate-700 font-bold text-lg">Khách trả:</span>
                  <span className="font-black text-2xl text-teal-600">{new Intl.NumberFormat('vi-VN').format(invoiceInfo.TongTien || invoiceInfo.TongTienThanhToan || 0)} đ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
