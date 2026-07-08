"use client";
import { useEffect, useState, useRef } from "react";
import DataTable from "@/components/DataTable";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

export default function Page() {
  const [branch, setBranch] = useState("HUE");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateForm, setUpdateForm] = useState({ productCode: "", quantity: "" }); //
  const showNotification = useToast();

  const load = async (b = branch) => { //
    setLoading(true);
    setError(null);
    try {
      // Gọi song song 2 API để lấy cả Tồn kho và Thông tin sản phẩm gốc
      const [invData, prodData] = await Promise.all([
        apiFetch(`/api/inventory?branch=${b}`),
        apiFetch(`/api/products?branch=CENTRAL`)
      ]);

      const invList = Array.isArray(invData) ? invData : [];
      const prodList = Array.isArray(prodData) ? prodData : [];

      // Gộp thông tin: Tên sản phẩm, Giá (từ prodList) + Số lượng (từ invList)
      const merged = prodList.map(prod => {
        const pCode = prod.productCode || prod.MaSP;
        const invItem = invList.find(i => (i.productCode || i.MaSP) === pCode);
        return { 
          productCode: pCode, 
          productName: prod.productName || prod.TenHang, 
          unitPrice: prod.unitPrice ?? prod.Gia, 
          quantity: invItem ? (invItem.quantity || invItem.SoLuongTon || 0) : 0 
        };
      });

      setRows(merged);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(updateForm.productCode)}?branch=${branch}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(updateForm.quantity) }),
      });
      showNotification("Cập nhật kho thành công!");
      setUpdateForm({ productCode: "", quantity: "" });
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [branch]);

  const handleRowClick = (row) => {
    setUpdateForm({
      productCode: row.productCode || row.MaSP,
      quantity: row.quantity || row.SoLuongTon || 0
    });
  };

  const adjustQty = (amount) => {
    setUpdateForm(prev => ({
      ...prev,
      quantity: Math.max(0, Number(prev.quantity || 0) + amount)
    }));
  };

  return (
    <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý Tồn kho Hệ thống</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-slate-600">Kho chi nhánh:</span>
            <select 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="HUE">HUE</option>
              <option value="SAIGON">SAIGON</option>
              <option value="HANOI">HANOI</option>
            </select>
          </div>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        {/* Thanh cập nhật tồn kho nhanh */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Mã sản phẩm (Chọn từ bảng)</span>
              <input 
                value={updateForm.productCode} 
                readOnly 
                placeholder="Click vào dòng bên dưới..."
                className="px-4 py-2 border rounded-lg bg-slate-100 text-slate-600 outline-none cursor-default" 
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-700">Số lượng tồn mới</span>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustQty(-1)} className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors font-bold">-</button>
                <input 
                  type="number" 
                  value={updateForm.quantity} 
                  onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})} 
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center" 
                />
                <button onClick={() => adjustQty(1)} className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors font-bold">+</button>
              </div>
            </label>
          </div>
          <button onClick={handleUpdate} disabled={!updateForm.productCode} className="btn-primary h-[42px] px-8 disabled:bg-slate-300 disabled:cursor-not-allowed">
            Xác nhận cập nhật
          </button>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Trạng thái kho tại {branch}</h2>
          <div className="table-wrap">
            {loading ? (
              <p className="py-10 text-center text-slate-500">Đang kiểm kho...</p>
            ) : (
              <DataTable rows={rows} onRowClick={handleRowClick} />
            )}
          </div>
        </section>
      </div>

  );
}
