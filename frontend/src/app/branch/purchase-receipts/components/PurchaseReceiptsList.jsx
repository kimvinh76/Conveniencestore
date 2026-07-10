"use client";

export default function PurchaseReceiptsList({ receipts, loading, onViewDetails }) {
  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        Đang tải danh sách phiếu nhập...
      </div>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có phiếu nhập nào</h3>
        <p className="text-slate-500">Bắt đầu bằng cách tạo một phiếu nhập mới.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold uppercase tracking-wider">
            <th className="p-4">Mã PN</th>
            <th className="p-4">Ngày Nhập</th>
            <th className="p-4">Nhà Cung Cấp</th>
            <th className="p-4">Ghi Chú</th>
            <th className="p-4 text-right">Tổng Tiền</th>
            <th className="p-4 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {receipts.map((r) => (
            <tr key={r.MaPN} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-4 font-medium text-indigo-600">{r.MaPN}</td>
              <td className="p-4 text-slate-600">
                {new Date(r.NgayNhap).toLocaleString('vi-VN')}
              </td>
              <td className="p-4 font-medium text-slate-800">
                {r.TenNCC || r.MaNCC || <span className="text-slate-400 italic">Không xác định</span>}
              </td>
              <td className="p-4 text-slate-600 max-w-xs truncate">
                {r.GhiChu || <span className="text-slate-400 italic">Không có</span>}
              </td>
              <td className="p-4 text-right font-medium text-slate-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.TongTien)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onViewDetails(r.MaPN)}
                  className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                >
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
