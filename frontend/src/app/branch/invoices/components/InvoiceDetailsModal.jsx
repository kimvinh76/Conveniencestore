"use client";
import React from "react";
import DataTable from "@/components/DataTable";

export default function InvoiceDetailsModal({ 
  isOpen, 
  title, 
  details, 
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
        <div className="p-6 overflow-y-auto flex-1">
          <div className="table-wrap">
            <DataTable rows={details} />
          </div>
        </div>
      </div>
    </div>
  );
}
