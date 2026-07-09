"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function CreatePurchaseReceiptModal({ onClose, onSuccess }) {
  const showNotification = useToast();
  const [maPN, setMaPN] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [items, setItems] = useState([]);
  
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form for new item
  const [selectedSP, setSelectedSP] = useState("");
  const [soLuong, setSoLuong] = useState(1);
  const [donGiaNhap, setDonGiaNhap] = useState(0);

  useEffect(() => {
    // Generate random code or default
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setMaPN(`PN${randomNum}`);

    // Fetch all products
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await apiFetch("/api/products");
        setProducts(data);
      } catch (error) {
        showNotification("Không thể tải danh sách sản phẩm", "error");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedSP) {
      showNotification("Vui lòng chọn sản phẩm", "error");
      return;
    }
    if (soLuong <= 0) {
      showNotification("Số lượng phải lớn hơn 0", "error");
      return;
    }
    if (donGiaNhap < 0) {
      showNotification("Đơn giá nhập không hợp lệ", "error");
      return;
    }

    const product = products.find(p => (p.productCode || p.MaSP) === selectedSP);
    
    // Check if already in list
    const existingIndex = items.findIndex(i => i.MaSP === selectedSP);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].SoLuong += parseInt(soLuong, 10);
      newItems[existingIndex].DonGiaNhap = parseFloat(donGiaNhap);
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          MaSP: selectedSP,
          TenHang: product?.productName || product?.TenHang || selectedSP,
          SoLuong: parseInt(soLuong, 10),
          DonGiaNhap: parseFloat(donGiaNhap)
        }
      ]);
    }

    // Reset input
    setSelectedSP("");
    setSoLuong(1);
    setDonGiaNhap(0);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!maPN.trim()) {
      showNotification("Vui lòng nhập mã phiếu", "error");
      return;
    }
    if (items.length === 0) {
      showNotification("Vui lòng thêm ít nhất 1 mặt hàng", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        maPN: maPN.trim(),
        ghiChu: ghiChu.trim(),
        items: items.map(i => ({
          MaSP: i.MaSP,
          SoLuong: i.SoLuong,
          DonGiaNhap: i.DonGiaNhap
        }))
      };

      await apiFetch("/api/purchase-receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      showNotification("Tạo phiếu nhập thành công!", "success");
      onSuccess();
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Có lỗi xảy ra khi tạo phiếu nhập", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.SoLuong * item.DonGiaNhap), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-full flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Tạo Phiếu Nhập Hàng Mới</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mã Phiếu Nhập</label>
              <input
                type="text"
                value={maPN}
                onChange={(e) => setMaPN(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: PN001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi Chú</label>
              <input
                type="text"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <div className="bg-slate-50 p-4 border-b border-slate-200 font-semibold text-slate-700">
              Thêm mặt hàng
            </div>
            <form onSubmit={handleAddItem} className="p-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs text-slate-500 mb-1">Sản phẩm</label>
                <select
                  value={selectedSP}
                  onChange={(e) => setSelectedSP(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loadingProducts}
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => {
                    const code = p.productCode || p.MaSP;
                    const name = p.productName || p.TenHang;
                    return (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Số lượng</label>
                <input
                  type="number"
                  min="1"
                  value={soLuong}
                  onChange={(e) => setSoLuong(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-500 mb-1">Đơn giá nhập (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={donGiaNhap}
                  onChange={(e) => setDonGiaNhap(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  + Thêm
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <tr>
                  <th className="p-3 font-semibold">Tên hàng</th>
                  <th className="p-3 font-semibold text-right">Số lượng</th>
                  <th className="p-3 font-semibold text-right">Đơn giá</th>
                  <th className="p-3 font-semibold text-right">Thành tiền</th>
                  <th className="p-3 font-semibold text-center w-16">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 italic">
                      Chưa có mặt hàng nào.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-sm">
                        <div className="font-medium text-slate-800">{item.TenHang}</div>
                        <div className="text-xs text-slate-500">{item.MaSP}</div>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-800">{item.SoLuong}</td>
                      <td className="p-3 text-right text-slate-600">
                        {new Intl.NumberFormat('vi-VN').format(item.DonGiaNhap)}
                      </td>
                      <td className="p-3 text-right font-medium text-emerald-600">
                        {new Intl.NumberFormat('vi-VN').format(item.SoLuong * item.DonGiaNhap)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan="3" className="p-4 text-right font-semibold text-slate-700">Tổng Tiền Thanh Toán:</td>
                  <td className="p-4 text-right font-bold text-lg text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl font-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white"></div>
            )}
            Hoàn tất nhập hàng
          </button>
        </div>
      </div>
    </div>
  );
}
