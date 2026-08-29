"use client";
import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/services/api";
import DataTable from "@/components/DataTable";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import CentralInvoiceDetailsModal from "./components/CentralInvoiceDetailsModal";
import CentralHistoryView from "./components/CentralHistoryView";

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsPromos, setDetailsPromos] = useState([]);
  const [detailsInvoiceInfo, setDetailsInvoiceInfo] = useState(null);
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
    load(selectedBranch).catch(() => { });
  }, [selectedBranch]);

  const openDetails = async (row) => {
    if (!row?.MaHD || !selectedBranch) return;
    try {
      const data = await apiFetch(`/api/invoices/${encodeURIComponent(row.MaHD)}/details?branch=${selectedBranch}`);
      const rawDetails = data.data?.items || (Array.isArray(data.data) ? data.data : []);
      const promosData = data.data?.promos || [];
      const formattedDetails = rawDetails.map(d => ({
        "Mã HĐ": d.MaHD,
        "Sản phẩm": `${d.TenHang} (${d.MaSP})`,
        "Số lượng": d.SoLuong,
        "Đơn giá": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.DonGia),
        "Thành tiền": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(d.ThanhTien)
      }));
      setDetails(formattedDetails);
      setDetailsPromos(promosData);
      setDetailsInvoiceInfo(row);
      const customerName = rawDetails.length > 0 && rawDetails[0].HoTenKhachHang ? rawDetails[0].HoTenKhachHang : "Khách vãng lai";
      setDetailsTitle(`${row.MaHD} - ${customerName}`);
      openDetailsModal();
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
    const originalInvoice = invoices.find(inv => inv.MaHD === row["Mã HĐ"]);
    if (originalInvoice) {
      openDetails(originalInvoice);
    }
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

        <CentralHistoryView 
          selectedBranch={selectedBranch}
          loading={loading}
          filteredInvoices={filteredInvoices}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleRowClick={handleRowClick}
        />
      </div>

      {/* Modal Chi tiết hóa đơn */}
      <CentralInvoiceDetailsModal
        isOpen={isDetailsOpen}
        title={detailsTitle}
        details={details}
        promos={detailsPromos}
        invoiceInfo={detailsInvoiceInfo}
        onClose={closeDetailsModal}
      />
    </>
  );
}
