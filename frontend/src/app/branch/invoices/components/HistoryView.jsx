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
  const filteredInvoices = useMemo(() => {
    if (!searchInvoice) return invoices;
    const lower = searchInvoice.toLowerCase();
    return invoices.filter(inv => 
      (inv.MaHD || "").toLowerCase().includes(lower) ||
      (inv.MaNV || "").toLowerCase().includes(lower)
    );
  }, [invoices, searchInvoice]);

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
          <DataTable rows={filteredInvoices} onRowClick={openDetails} />
        )}
      </div>
    </section>
  );
}
