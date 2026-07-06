"use client";
import { useEffect, useState, useMemo, useRef } from "react";

const FILTER_BRANCH_MAP = {
  HUE: "HUE",
  SAIGON: "SAIGON",
  HANOI: "HANOI",
};
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";
import { useToast } from "@/contexts/ToastContext";

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const showNotification = useToast();
  const modalRef = useRef(null);

  const load = async (branch = selectedBranch) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/invoices?branch=${branch}`);
      setInvoices(Array.isArray(result.data) ? result.data : result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const term = searchTerm.trim().toLowerCase();
    return invoices.filter((inv) => {
      const maHD = String(inv.MaHD ?? inv.maHD ?? inv.id ?? "").toLowerCase();
      const maNV = String(inv.MaNV ?? inv.maNV ?? inv.employeeCode ?? "").toLowerCase();
      return maHD.includes(term) || maNV.includes(term);
    });
  }, [invoices, searchTerm]);

  const openDetails = async (row) => {
    if (!row?.MaHD || !selectedBranch) return;
    try {
      const data = await apiFetch(`/api/invoices/${encodeURIComponent(row.MaHD)}/details?branch=${selectedBranch}`);
      setDetails(Array.isArray(data.data) ? data.data : data);
      setDetailsTitle(row.MaHD);
      modalRef.current?.showModal();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <CentralLayout active="invoices">
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
            <button className="btn-primary" onClick={() => load()} disabled={loading}>{loading ? "Đang tải..." : "Tải lại"}</button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-800">Lịch sử giao dịch chi nhánh {selectedBranch}</h2>
            <input 
              type="text" 
              placeholder="🔍 Lọc theo mã HĐ, mã NV..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-72 text-sm"
            />
          </div>
          <div className="table-wrap">
            {loading ? <p className="py-10 text-center text-slate-500">Đang tải dữ liệu hóa đơn...</p> : <DataTable rows={filteredInvoices} columns={["MaHD","MaNV","Ngay","TongTien"]} onRowClick={openDetails} />}
          </div>
        </section>
      </div>

      {/* Modal Chi tiết hóa đơn */}
      <dialog ref={modalRef} className="modal w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Chi tiết hóa đơn: <span className="text-blue-600">{detailsTitle}</span></h3>
          <button className="text-slate-400 hover:text-slate-600 font-bold" onClick={() => modalRef.current?.close()}>✕</button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <DataTable rows={details} />
        </div>
      </dialog>

    </CentralLayout>
  );
}
