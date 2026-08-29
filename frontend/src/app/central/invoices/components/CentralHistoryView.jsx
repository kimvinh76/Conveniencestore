"use client";
import React from "react";
import DataTable from "@/components/DataTable";

export default function CentralHistoryView({ 
  selectedBranch, 
  loading, 
  filteredInvoices, 
  searchTerm, 
  setSearchTerm, 
  handleRowClick 
}) {
  return (
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
  );
}
