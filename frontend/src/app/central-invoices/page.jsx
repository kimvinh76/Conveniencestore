"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([{ productCode: "", quantity: 1 }]);
  const [empId, setEmpId] = useState("");

  const load = async (branch = selectedBranch) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(`/api/invoices?branch=${branch}`);
      setInvoices(Array.isArray(result.data) ? result.data : result);
      const emps = await apiFetch(`/api/employees?branch=${branch}`);
      setEmployees(Array.isArray(emps.data) ? emps.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const submitInvoice = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: selectedBranch, employeeId: empId, items, totalAmount: 0 }),
      });
      alert("Tạo hóa đơn thành công!");
      load();
    } catch (err) { alert(err.message); }
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
            <button className="btn-primary" onClick={() => load()}>
              Tải lại
            </button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-5 text-slate-800">Tạo hóa đơn tại {selectedBranch}</h2>
            <form onSubmit={submitInvoice} className="flex flex-col gap-4">
              <select value={empId} onChange={e => setEmpId(e.target.value)} required className="px-4 py-2 border rounded-lg">
                <option value="">Chọn nhân viên lập đơn</option>
                {employees.map(e => <option key={e.MaNV} value={e.MaNV}>{e.MaNV} - {e.HoTen}</option>)}
              </select>
              <div className="flex flex-col gap-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input placeholder="Mã SP" className="flex-1 px-3 py-1 border rounded" value={it.productCode} onChange={e => {
                      const newItems = [...items];
                      newItems[idx].productCode = e.target.value;
                      setItems(newItems);
                    }} />
                    <input type="number" placeholder="SL" className="w-20 px-3 py-1 border rounded" value={it.quantity} onChange={e => {
                      const newItems = [...items];
                      newItems[idx].quantity = Number(e.target.value);
                      setItems(newItems);
                    }} />
                  </div>
                ))}
                <button type="button" onClick={() => setItems([...items, { productCode: "", quantity: 1 }])} className="text-blue-600 text-sm font-bold">+ Thêm dòng</button>
              </div>
              <button type="submit" className="btn-primary mt-2">Xác nhận tạo đơn</button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử giao dịch chi nhánh {selectedBranch}</h2>
          <div className="table-wrap">
            {loading ? <p className="py-10 text-center text-slate-500">Đang tải dữ liệu hóa đơn...</p> : <DataTable rows={invoices} />}
          </div>
        </section>
        </div>
      </div>
    </CentralLayout>
  );
}
