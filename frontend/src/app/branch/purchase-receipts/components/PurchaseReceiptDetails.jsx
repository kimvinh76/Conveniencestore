"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function PurchaseReceiptDetails({ receiptId, branch, onBack }) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const showNotification = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const url = branch 
          ? `/api/purchase-receipts/${receiptId}?branch=${branch}` 
          : `/api/purchase-receipts/${receiptId}`;
        const data = await apiFetch(url);
        setDetails(data);
      } catch (error) {
        console.error(error);
        showNotification("Không thể tải chi tiết phiếu nhập", "error");
      } finally {
        setLoading(false);
      }
    };

    if (receiptId) {
      fetchDetails();
    }
  }, [receiptId, branch]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
            title="Quay lại danh sách"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            Chi tiết Phiếu Nhập: <span className="text-indigo-600">{receiptId}</span>
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Đang tải dữ liệu...
        </div>
      ) : details.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          Không tìm thấy mặt hàng nào trong phiếu nhập này.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4">Mã SP</th>
                <th className="p-4">Tên Hàng</th>
                <th className="p-4 text-right">Số Lượng</th>
                <th className="p-4 text-right">Đơn Giá Nhập</th>
                <th className="p-4 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((item, index) => (
                <tr key={`${item.MaSP}-${index}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{item.MaSP}</td>
                  <td className="p-4 text-slate-600">{item.TenHang}</td>
                  <td className="p-4 text-right font-medium text-slate-800">{item.SoLuong}</td>
                  <td className="p-4 text-right text-slate-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.DonGiaNhap)}
                  </td>
                  <td className="p-4 text-right font-medium text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.ThanhTienNhap)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
              <tr>
                <td colSpan="4" className="p-4 text-right">Tổng cộng:</td>
                <td className="p-4 text-right text-lg text-emerald-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    details.reduce((sum, item) => sum + item.ThanhTienNhap, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
