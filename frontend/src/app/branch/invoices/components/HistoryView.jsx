"use client";
import React, { useMemo } from "react";
import DataTable from "@/components/DataTable";

export default function HistoryView({ 
  loading, 
  invoices, 
  searchInvoice, 
  setSearchInvoice, 
  openDetails 
}) {
  const formattedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      "Mã HĐ": inv.MaHD,
      "Thời gian": new Date(inv.NgayTao).toLocaleString('vi-VN'),
      "Khách hàng": inv.MaKH ? `${inv.HoTenKhachHang} (${inv.MaKH})` : "Khách vãng lai",
      "Tổng tiền": new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.TongTien),
      "Số món": inv.SoMon,
      "Nhân viên": inv.HoTenNhanVien,
      "Ghi chú": inv.GhiChu || "",
      "_original": inv
    }));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let result = formattedInvoices;
    if (searchInvoice) {
      const lower = searchInvoice.toLowerCase();
      result = result.filter(inv => 
        (inv["Mã HĐ"] || "").toLowerCase().includes(lower) ||
        (inv._original.MaNV || "").toLowerCase().includes(lower) ||
        (inv["Khách hàng"] || "").toLowerCase().includes(lower)
      );
    }
    // Loại bỏ thuộc tính _original trước khi render table
    return result.map(({ _original, ...rest }) => rest);
  }, [formattedInvoices, searchInvoice]);

  const handleRowClick = (row) => {
    const originalInvoice = invoices.find(inv => inv.MaHD === row["Mã HĐ"]);
    if (originalInvoice) {
      openDetails(originalInvoice);
    }
  };

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-slate-800">Lịch sử hóa đơn chi nhánh</h2>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="🔍 Tìm mã HĐ hoặc mã NV..." 
            value={searchInvoice}
            onChange={e => setSearchInvoice(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 w-64 text-sm"
          />
        </div>
      </div>
      <div className="table-wrap">
        {loading ? (
          <p className="text-center py-10 text-slate-500">Đang tải dữ liệu...</p>
        ) : (
          <DataTable rows={filteredInvoices} onRowClick={handleRowClick} />
        )}
      </div>
    </section>
  );
}
