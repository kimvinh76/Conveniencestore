"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import PromotionModal from "@/components/promotions/PromotionModal";

export default function PromotionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedPromo, setSelectedPromo] = useState(null);
  const showNotification = useToast();
  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/promotions?branch=CENTRAL");
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

  const handleCreate = () => {
    setSelectedPromo(null);
    openFormModal();
  };

  const handleEdit = (row) => {
    setSelectedPromo(row);
    openFormModal();
  };

  const handleToggleStatus = async (promoCode, currentStatus) => {
    if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'đình chỉ' : 'kích hoạt lại'} mã ${promoCode}?`)) return;
    try {
      await apiFetch(`/api/promotions/${promoCode}?branch=CENTRAL`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TrangThai: currentStatus ? 0 : 1 }),
      });
      showNotification("Cập nhật trạng thái thành công");
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleDelete = async (promoCode) => {
    if (!confirm(`Hành động này sẽ XÓA MỀM mã ${promoCode}. Bạn có chắc chắn?`)) return;
    try {
      await apiFetch(`/api/promotions/${promoCode}?branch=CENTRAL`, {
        method: "DELETE",
      });
      showNotification("Xóa mã khuyến mãi thành công");
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
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Khuyến Mãi</h1>
          </div>
          <button className="btn-primary font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl" onClick={handleCreate}>
            + Tạo Mã Mới
          </button>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-medium">Đang tải danh sách khuyến mãi...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">Chưa có mã khuyến mãi nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold border-b border-slate-200">Mã KM</th>
                    <th className="p-4 font-bold border-b border-slate-200">Tên Chương Trình</th>
                    <th className="p-4 font-bold border-b border-slate-200">Mức Giảm</th>
                    <th className="p-4 font-bold border-b border-slate-200">Điều kiện</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-center">Hiệu Lực</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-center">Trạng Thái</th>
                    <th className="p-4 font-bold border-b border-slate-200 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-bold text-indigo-700">{r.MaKM}</td>
                      <td className="p-4 text-sm font-semibold text-slate-700">
                        {r.TenChuongTrinh}
                        {r.ChoPhepCongDon ? (
                          <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded uppercase">Cộng dồn</span>
                        ) : (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded uppercase">Độc quyền</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {r.LoaiKhuyenMai === 'PERCENTAGE' ? (
                          <>
                            <span className="font-bold text-red-500">{r.PhanTramGiam}%</span>
                            {r.GiamToiDa > 0 && <span className="text-xs text-slate-400 ml-1">(Tối đa {r.GiamToiDa.toLocaleString()}đ)</span>}
                          </>
                        ) : (
                          <span className="font-bold text-red-500">-{r.SoTienGiamTrucTiep.toLocaleString()}đ</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        Đơn từ {r.DonHangToiThieu.toLocaleString()}đ <br/>
                        {r.SoLuongGioiHan ? <span className="text-xs text-blue-600">Đã dùng {r.SoLuongDaDung}/{r.SoLuongGioiHan}</span> : <span className="text-xs text-slate-400">Không giới hạn SL</span>}
                      </td>
                      <td className="p-4 text-sm text-center">
                        <div className="flex flex-col text-xs">
                          <span className="text-green-600">{new Date(r.NgayBatDau).toLocaleDateString('vi-VN')}</span>
                          <span className="text-red-600">{new Date(r.NgayKetThuc).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {r.TrangThai ? (
                          <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded uppercase">Hoạt động</span>
                        ) : (
                          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">Đã đình chỉ</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(r)} className="text-indigo-600 hover:bg-indigo-50 font-medium text-xs px-2 py-1 rounded transition-colors">
                            Sửa
                          </button>
                          <button onClick={() => handleToggleStatus(r.MaKM, r.TrangThai)} className={`${r.TrangThai ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'} font-medium text-xs px-2 py-1 rounded transition-colors`}>
                            {r.TrangThai ? 'Tạm ngưng' : 'Mở lại'}
                          </button>
                          <button onClick={() => handleDelete(r.MaKM)} className="text-red-600 hover:bg-red-50 font-medium text-xs px-2 py-1 rounded transition-colors">
                            Xóa
                          </button>
                        </div>
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
        <PromotionModal 
          isOpen={isFormOpen}
          onClose={closeFormModal}
          onSuccess={load}
          initialData={selectedPromo}
        />
      )}
    </>
  );
}
