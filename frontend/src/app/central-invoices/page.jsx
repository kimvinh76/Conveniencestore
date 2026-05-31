"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";

const emptyItem = () => ({ productCode: "", productName: "", unitPrice: "", quantity: "" });

export default function Page() {
  const [invoices, setInvoices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("HUE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([emptyItem()]);
  const [empId, setEmpId] = useState("");
  const [note, setNote] = useState("");
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [toast, setToast] = useState({ message: "", type: null });
  const modalRef = useRef(null);
  const createModalRef = useRef(null);

  const totalAmount = useMemo(() => items.reduce((sum, item) => {
    const price = Number(item.unitPrice || 0);
    const qty = Number(item.quantity || 0);
    return sum + (price > 0 && qty > 0 ? price * qty : 0);
  }, 0), [items]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

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

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: null }), 3000);
  };

  useEffect(() => {
    load(selectedBranch).catch(() => {});
  }, [selectedBranch]);

  const autoFill = async (index) => {
    const productCode = String(items[index]?.productCode || "").trim();
    if (!productCode) return;
    try {
      const product = await apiFetch(`/api/products/${encodeURIComponent(productCode)}?branch=${selectedBranch}`);
      updateItem(index, { productName: product.productName || "", unitPrice: product.unitPrice ?? "" });
    } catch (err) { console.error(err); }
  };

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

  const submitInvoice = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: selectedBranch, employeeId: empId, items, totalAmount, note }),
      });
      showNotification("Tạo hóa đơn thành công!");
      setItems([emptyItem()]);
      setEmpId("");
      setNote("");
      createModalRef.current?.close();
      load();
    } catch (err) { showNotification(err.message, "error"); }
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
            <button className="btn-primary" onClick={() => createModalRef.current?.showModal()}>+ Tạo hóa đơn</button>
            <button className="btn-primary" onClick={() => load()}>Tải lại</button>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Lịch sử giao dịch chi nhánh {selectedBranch}</h2>
          <div className="table-wrap">
            {loading ? <p className="py-10 text-center text-slate-500">Đang tải dữ liệu hóa đơn...</p> : <DataTable rows={invoices} onRowClick={openDetails} />}
          </div>
        </section>
      </div>

      {/* Modal Tạo hóa đơn */}
      <dialog ref={createModalRef} className="modal w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Tạo hóa đơn tại {selectedBranch}</h2>
          <button onClick={() => createModalRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={submitInvoice} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <select value={empId} onChange={e => setEmpId(e.target.value)} required className="px-4 py-2 border rounded-lg">
            <option value="">Chọn nhân viên lập đơn</option>
            {employees.map(e => <option key={e.MaNV} value={e.MaNV}>{e.MaNV} - {e.HoTen}</option>)}
          </select>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Danh sách sản phẩm</span>
              <button type="button" onClick={() => setItems([...items, emptyItem()])} className="text-blue-600 text-sm font-bold">+ Thêm dòng</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Dòng #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" className="text-red-600 text-xs font-bold" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Xóa</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    placeholder="Mã SP" 
                    value={item.productCode} 
                    onBlur={() => autoFill(idx)}
                    onChange={e => updateItem(idx, { productCode: e.target.value })} 
                    className="px-3 py-2 border rounded-lg" required 
                  />
                  <input value={item.productName} placeholder="Tên hàng" readOnly className="px-3 py-2 border rounded-lg bg-slate-100" />
                  <input 
                    type="number" 
                    placeholder="Giá" 
                    value={item.unitPrice} 
                    onChange={e => updateItem(idx, { unitPrice: e.target.value })} 
                    className="px-3 py-2 border rounded-lg" 
                  />
                  <input 
                    type="number" 
                    placeholder="SL" 
                    min="1"
                    value={item.quantity} 
                    onChange={e => updateItem(idx, { quantity: e.target.value })} 
                    className="px-3 py-2 border rounded-lg" required 
                  />
                </div>
              </div>
            ))}
          </div>
          <input placeholder="Ghi chú" value={note} onChange={e => setNote(e.target.value)} className="px-4 py-2 border rounded-lg" />
          <div className="flex items-center justify-between bg-teal-50 p-4 rounded-xl border border-teal-200 sticky bottom-0">
            <span className="text-sm font-semibold text-slate-700">Tổng tiền</span>
            <span className="text-xl font-bold text-teal-600">{Number(totalAmount).toLocaleString("vi-VN")} đ</span>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="submit" className="btn-primary flex-1">Xác nhận tạo đơn</button>
            <button type="button" className="btn-ghost border flex-1" onClick={() => createModalRef.current?.close()}>Hủy</button>
          </div>
        </form>
      </dialog>

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

      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl transition-all animate-bounce z-[100] flex items-center gap-3 border ${
          toast.type === "error" ? "bg-white border-red-200 text-red-600" : "bg-white border-emerald-200 text-emerald-600"
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${toast.type === "error" ? "bg-red-100" : "bg-emerald-100"}`}>
            {toast.type === "error" ? "✕" : "✓"}
          </div>
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
    </CentralLayout>
  );
}
