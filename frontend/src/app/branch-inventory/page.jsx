"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import { useBranch } from "@/components/useBranch";
import DataTable from "@/components/DataTable";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [inventory, setInventory] = useState([]);
  const [updateForm, setUpdateForm] = useState({ productCode: "", quantity: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra quyền: Chỉ hiển thị form sửa nếu là Admin
  const canUpdate = auth?.role === "ADMIN_CHI_NHANH" || auth?.role === "ADMIN_TOAN_BO";

  const loadInventory = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      // Gọi song song 2 API để lấy cả Tồn kho và Thông tin sản phẩm
      const [invData, prodData] = await Promise.all([
        apiFetch(`/api/inventory?branch=${branch}`),
        apiFetch(`/api/products?branch=${branch}`)
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

      setInventory(merged);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory().catch(() => {});
  }, [branch]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!branch || !updateForm.productCode) return;
    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(updateForm.productCode)}?branch=${branch}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(updateForm.quantity),
        }),
      });
      alert("Cập nhật tồn kho cục bộ thành công!");
      setUpdateForm({ productCode: "", quantity: "" });
      loadInventory();
    } catch (err) {
      alert(`Lỗi: ${err.message || String(err)}`);
    }
  };

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
    <BranchLayout active="inventory">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tác vụ Cục bộ</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý tồn kho</h1>
          </div>
          <button className="btn-primary" onClick={loadInventory}>
            {loading ? "Đang tải..." : "Tải lại dữ liệu"}
          </button>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        {/* Thanh cập nhật tồn kho nhanh (Toolbar) - ẨN NẾU LÀ NHÂN VIÊN */}
        {canUpdate && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Mã sản phẩm (Chọn từ bảng)</span>
                <input 
                  value={updateForm.productCode} 
                  readOnly 
                  placeholder="Click vào một dòng bên dưới..."
                  className="px-4 py-2 border rounded-lg bg-slate-100 text-slate-600 outline-none cursor-default" 
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-700">Số lượng tồn mới</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustQty(-1)} type="button" className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors font-bold">-</button>
                  <input 
                    type="number" 
                    value={updateForm.quantity} 
                    onChange={e => setUpdateForm({...updateForm, quantity: e.target.value})} 
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-center" 
                  />
                  <button onClick={() => adjustQty(1)} type="button" className="px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors font-bold">+</button>
                </div>
                
              </label> 
            </div>
            <button onClick={handleUpdate} disabled={!updateForm.productCode} className="btn-primary h-[42px] px-8 disabled:bg-slate-300 disabled:cursor-not-allowed">
              Xác nhận cập nhật 
            </button>
          </section>
        )}

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">
          <h2 className="text-xl font-bold text-slate-800 mb-5">Danh sách tồn kho thực tế</h2>
          <div className="table-wrap flex-1 overflow-y-auto">
            <DataTable rows={inventory} onRowClick={handleRowClick} />
          </div>
        </section>
      </div>
    </BranchLayout>
  );
}