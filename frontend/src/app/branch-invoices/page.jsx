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
          <button className="btn-primary" onClick={() => loadInvoices()}>
            {loading ? "Đang tải..." : "Tải lại danh sách"}
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Cột trái: Form tạo hóa đơn */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-5">Tạo hóa đơn mới</h2>
              <form onSubmit={submitInvoice} className="flex flex-col gap-4">
                <label>
                  <span>Nhân viên lập hóa đơn</span>
                  <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                    <option value="">Chọn nhân viên</option>
                    {employees.map((e) => (
                      <option key={e.MaNV} value={e.MaNV}>{`${e.MaNV} - ${e.HoTen}`}</option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Danh sách sản phẩm</span>
                    <button type="button" className="btn-ghost !py-1.5 !px-3 text-sm" onClick={addItem}>
                      + Thêm dòng
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Sản phẩm #{idx + 1}</span>
                        {items.length > 1 && (
                          <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-700" onClick={() => removeItem(idx)}>
                            Xóa
                          </button>
                        )}
                      </div>
                      <label>
                        <span>Mã sản phẩm</span>
                        <input
                          value={item.productCode}
                          onChange={(e) => updateItem(idx, { productCode: e.target.value })}
                          onBlur={() => autoFill(idx)}
                          placeholder="Nhập mã rồi rời ô để tự điền"
                          required
                        />
                      </label>
                      <label>
                        <span>Tên hàng</span>
                        <input value={item.productName} readOnly className="bg-slate-100" />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label>
                          <span>Đơn giá</span>
                          <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
                        </label>
                        <label>
                          <span>Số lượng</span>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} required />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <label>
                  <span>Ghi chú</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Khuyến mãi cuối tuần..." />
                </label>

                <div className="flex items-center justify-between bg-teal-50 p-4 rounded-xl border border-teal-200">
                  <span className="text-sm font-semibold text-slate-700">Tổng tiền</span>
                  <span className="text-xl font-bold text-teal-600">{Number(totalAmount).toLocaleString("vi-VN")} đ</span>
                </div>

                <button type="submit" className="btn-primary mt-1">Thêm hóa đơn</button>
              </form>
            </section>

            <section className="bg-slate-900 text-green-400 p-4 rounded-xl shadow-inner font-mono text-sm overflow-x-auto">
              <h3 className="text-slate-400 mb-2 font-sans text-xs font-bold uppercase tracking-widest">Logs</h3>
              <pre>{result}</pre>
            </section>
          </div>

          {/* Cột phải: Bảng dữ liệu */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col h-[calc(100vh-140px)] sticky top-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách hóa đơn chi nhánh</h2>
            <div className="table-wrap flex-1 overflow-y-auto">
              <DataTable rows={invoices} onRowClick={openDetails} />
            </div>
          </section>
        </div>
      </div>

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
