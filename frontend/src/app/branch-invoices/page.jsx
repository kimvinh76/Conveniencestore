"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";
import { useBranch } from "@/components/useBranch";

const emptyItem = () => ({ productCode: "", productName: "", unitPrice: "", quantity: "" });

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([emptyItem()]);
  const [note, setNote] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [result, setResult] = useState("Chưa có thao tác.");
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);
  const createModalRef = useRef(null);

  const totalAmount = useMemo(() => items.reduce((sum, item) => {
    const price = Number(item.unitPrice || 0);
    const qty = Number(item.quantity || 0);
    return sum + (price > 0 && qty > 0 ? price * qty : 0);
  }, 0), [items]);

  const loadEmployees = async () => {
    if (!branch) return;
    try {
      const result = await apiFetch(`/api/employees?branch=${branch}`);
      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const loadInvoices = async () => {
    if (!branch) return;
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch(`/api/invoices?branch=${branch}`);
      setInvoices(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees().catch(() => {});
    loadInvoices().catch(() => {});
  }, [branch]);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const autoFill = async (index) => {
    if (!branch) return;
    const productCode = String(items[index]?.productCode || "").trim();
    if (!productCode) return;
    try {
      const product = await apiFetch(`/api/products/${encodeURIComponent(productCode)}?branch=${branch}`);
      updateItem(index, { productName: product.productName || "", unitPrice: product.unitPrice ?? "" });
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const submitInvoice = async (event) => {
    event.preventDefault();
    if (!branch) return;
    const cleanedItems = items
      .map((item) => ({
        productCode: String(item.productCode || "").trim(),
        productName: String(item.productName || "").trim(),
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
        totalAmount: Number(item.unitPrice || 0) * Number(item.quantity || 0),
      }))
      .filter((item) => item.productCode && item.quantity > 0);

    if (!cleanedItems.length) {
      setResult("Lỗi: Cần ít nhất một dòng sản phẩm hợp lệ.");
      return;
    }

    try {
      const payload = { branch, employeeId, items: cleanedItems, totalAmount, note };
      const result = await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(JSON.stringify(result, null, 2));
      setItems([emptyItem()]);
      setNote("");
      setEmployeeId("");
      createModalRef.current?.close();
      await loadInvoices();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    }
  };

  const openDetails = async (row) => {
    if (!row?.MaHD || !branch) return;
    try {
      const data = await apiFetch(`/api/invoices/${encodeURIComponent(row.MaHD)}/details?branch=${branch}`);
      setDetails(Array.isArray(data.data) ? data.data : data);
      setDetailsTitle(row.MaHD);
      modalRef.current?.showModal();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    }
  };

  return (
    <BranchLayout active="invoices">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý hóa đơn</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={() => createModalRef.current?.showModal()}>+ Tạo hóa đơn</button>
            <button className="btn-ghost border border-slate-200" onClick={() => loadInvoices()}>
              {loading ? "Đang tải..." : "Tải lại"}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Lịch sử hóa đơn chi nhánh</h2>
          <div className="table-wrap">
            <DataTable rows={invoices} onRowClick={openDetails} />
          </div>
        </section>
      </div>

      {/* Modal Tạo hóa đơn */}
      <dialog ref={createModalRef} className="modal w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Tạo hóa đơn mới tại {branch}</h2>
          <button onClick={() => createModalRef.current?.close()} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={submitInvoice} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Nhân viên lập hóa đơn</span>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required className="px-4 py-2 border rounded-lg">
              <option value="">Chọn nhân viên</option>
              {employees.map((e) => (
                <option key={e.MaNV} value={e.MaNV}>{`${e.MaNV} - ${e.HoTen}`}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Danh sách sản phẩm</span>
              <button type="button" className="text-blue-600 text-sm font-bold" onClick={addItem}>+ Thêm dòng</button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Sản phẩm #{idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" className="text-xs font-semibold text-red-600" onClick={() => removeItem(idx)}>Xóa</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Mã SP"
                    value={item.productCode}
                    onChange={(e) => updateItem(idx, { productCode: e.target.value })}
                    onBlur={() => autoFill(idx)}
                    className="px-3 py-2 border rounded-lg"
                    required
                  />
                  <input value={item.productName} placeholder="Tên hàng" readOnly className="px-3 py-2 border rounded-lg bg-slate-100" />
                  <input type="number" placeholder="Đơn giá" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} className="px-3 py-2 border rounded-lg" />
                  <input type="number" min="1" placeholder="SL" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                </div>
              </div>
            ))}
          </div>

          <input 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Ghi chú..." 
            className="px-4 py-2 border rounded-lg"
          />

          <div className="flex items-center justify-between bg-teal-50 p-4 rounded-xl border border-teal-200 sticky bottom-0">
            <span className="text-sm font-semibold text-slate-700">Tổng cộng</span>
            <span className="text-xl font-bold text-teal-600">{Number(totalAmount).toLocaleString("vi-VN")} đ</span>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">Thêm hóa đơn</button>
            <button type="button" className="btn-ghost border flex-1" onClick={() => createModalRef.current?.close()}>Hủy</button>
          </div>
        </form>
      </dialog>

      {/* Modal Chi tiết */}
      <dialog ref={modalRef} className="modal">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-slate-800">Chi tiết hóa đơn: <span className="text-teal-600">{detailsTitle}</span></h3>
          <button className="btn-ghost !py-1.5 !px-3" onClick={() => modalRef.current?.close()}>Đóng</button>
        </div>
        <div className="table-wrap">
          <DataTable rows={details} />
        </div>
      </dialog>
    </BranchLayout>
  );
}
