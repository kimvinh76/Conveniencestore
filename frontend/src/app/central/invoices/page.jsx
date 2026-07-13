"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import DataTable from "@/components/DataTable";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const showNotification = useToast();
  const { isOpen: isDetailsOpen, open: openDetailsModal, close: closeDetailsModal } = useModal();

  const load = async (branch = selectedBranch) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/invoices?branch=${branch}`);
      setInvoices(data.data || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const openDetails = async (row) => {
    openDetailsModal();
    setDetailsTitle(row["Mã HĐ"]);
    try {
      const originalMaHD = row["Mã HĐ"];
      const data = await apiFetch(`/api/invoices/${encodeURIComponent(originalMaHD)}/details?branch=${selectedBranch}`);
      const rawDetails = data.data || [];
      const formattedDetails = rawDetails.map(d => ({
        "Mã HĐ": d.MaHD,
        "Sản phẩm": `${d.TenHang} (${d.MaSP})`,
        "Số lượng": d.SoLuong,
        "Đơn giá": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.DonGia),
        "Thành tiền": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.ThanhTien)
      }));
      setDetails(formattedDetails);
      const customerName = rawDetails.length > 0 && rawDetails[0].HoTenKhachHang ? rawDetails[0].HoTenKhachHang : "Khách vãng lai";
      setDetailsTitle(`${originalMaHD} - ${customerName}`);
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const formattedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      "Mã HĐ": inv.MaHD,
      "Thời gian": new Date(inv.NgayTao).toLocaleString('vi-VN'),
      "Khách hàng": inv.MaKH ? `${inv.HoTenKhachHang} (${inv.MaKH})` : "Khách vãng lai",
      "Tổng tiền": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.TongTien),
      "Số món": inv.SoMon,
      "Nhân viên": inv.HoTenNhanVien || inv.MaNV,
      "Ghi chú": inv.GhiChu || "",
      "_original": inv
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let result = formattedInvoices;
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(inv => 
        (inv["Mã HĐ"] || "").toLowerCase().includes(lower) ||
        (inv._original.MaNV || "").toLowerCase().includes(lower) ||
        (inv["Khách hàng"] || "").toLowerCase().includes(lower)
      );
    }
    return result.map(({ _original, ...rest }) => rest);
  }, [formattedInvoices, searchTerm]);

  const handleRowClick = (row) => {
    openDetails(row);
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Hóa đơn Hệ thống</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-slate-600">Lọc chi nhánh:</span>
            <select 
              value={selectedBranch} 
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="HUE">HUE</option>
              <option value="SAIGON">SAIGON</option>
              <option value="HANOI">HANOI</option>
            </select>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử giao dịch chi nhánh {selectedBranch}</h2>
            <input 
              type="text" 
              placeholder="🔍 Lọc theo mã HĐ, nhân viên, khách..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72 text-sm"
            />
          </div>
          <div className="table-wrap">
            {loading ? (
              <p className="py-10 text-center text-slate-500">Đang tải dữ liệu hóa đơn...</p>
            ) : (
              <DataTable rows={filteredInvoices} onRowClick={handleRowClick} />
            )}
          </div>
        </section>
      </div>

      {/* Modal Chi tiết hóa đơn */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetailsModal} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="text-xl font-bold text-slate-800">Chi tiết hóa đơn: <span className="text-blue-600">{detailsTitle}</span></h3>
              <button className="text-slate-400 hover:text-slate-600 font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors" onClick={closeDetailsModal}>✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="table-wrap">
                <DataTable rows={details} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
