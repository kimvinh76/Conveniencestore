"use client";
import { useEffect, useMemo, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import DataTable from "@/components/DataTable";
import { useBranch } from "@/components/useBranch";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [activeTab, setActiveTab] = useState("pos");
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [result, setResult] = useState("Chưa có thao tác.");
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useToast();
  const { isOpen: isDetailsOpen, open: openDetailsModal, close: closeDetailsModal } = useModal();
  // Trạng thái tìm kiếm hóa đơn trong tab lịch sử
  const [searchInvoice, setSearchInvoice] = useState("");
  const [note, setNote] = useState("");


  const totalAmount = useMemo(() => cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0), [cartItems]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      (p.productName || "").toLowerCase().includes(lower) || 
      (p.productCode || "").toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  const filteredInvoices = useMemo(() => {
    if (!searchInvoice  ) return invoices;
    if (!searchInvoice) return invoices;
    const lower = searchInvoice.toLowerCase();
    return invoices.filter(inv => 
      (inv.MaHD || "").toLowerCase().includes(lower) ||
      (inv.MaNV || "").toLowerCase().includes(lower)
    );
  }, [invoices, searchInvoice]);

  const loadInitialData = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const [historyRes, prodsRes, empsRes] = await Promise.all([
        apiFetch(`/api/invoices?branch=${branch}`),
        apiFetch(`/api/products?branch=${branch}`),
        apiFetch(`/api/employees?branch=${branch}`)
      ]);
      setInvoices(Array.isArray(historyRes.data) ? historyRes.data : []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : []);
      setEmployees(Array.isArray(empsRes.data) ? empsRes.data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData().catch(() => {});
  }, [branch]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.productCode === product.productCode);
      if (existing) {
        return prev.map(item => item.productCode === product.productCode ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productCode, newQuantity) => {
    const qty = Math.max(0, Number(newQuantity));
    setCartItems(prev => {
      if (qty === 0) return prev.filter(item => item.productCode !== productCode);
      return prev.map(item => item.productCode === productCode ? { ...item, quantity: qty } : item);
    });
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!branch) return;

    if (!auth?.employeeId) return alert("Không xác định được nhân viên thu ngân (Lỗi phiên đăng nhập).");
    if (cartItems.length === 0) return alert("Giỏ hàng đang trống!");

    const cleanedItems = cartItems
      .map((item) => ({
        productCode: String(item.productCode || "").trim(),
        productName: String(item.productName || "").trim(),
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
        totalAmount: Number(item.unitPrice || 0) * Number(item.quantity || 0),
      }));

    try {
      const payload = { branch, employeeId: auth.employeeId, items: cleanedItems, totalAmount, note };
      const result = await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      showNotification("Tạo hóa đơn thành công!", "success");
      setCartItems([]);
      setNote("");
      loadInitialData(); // Load lại lịch sử
      setActiveTab("history"); // Tự động nhảy sang tab lịch sử để xem bill vừa tạo
    } catch (err) {
      alert(`Lỗi: ${err.message || "Không thể tạo hóa đơn"}`);
    }
  };

  const openDetails = async (row) => {
    if (!row?.MaHD || !branch) return;
    try {
      const data = await apiFetch(`/api/invoices/${encodeURIComponent(row.MaHD)}/details?branch=${branch}`);
      setDetails(Array.isArray(data.data) ? data.data : data);
      setDetailsTitle(row.MaHD);
      openDetailsModal();
    } catch (err) {
      setResult(`Lỗi: ${err.message || String(err)}`);
    }
  };

  return (
    <BranchLayout active="invoices">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Point of Sale (POS)</p>
            <h1 className="text-3xl font-bold text-slate-900">Giao dịch & Hóa đơn</h1>
          </div>
        </header>

        <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-xl w-fit">
          <button onClick={() => setActiveTab("pos")} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "pos" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Bán hàng (POS)</button>
          <button onClick={() => setActiveTab("history")} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "history" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Lịch sử giao dịch</button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        {activeTab === "pos" ? (
          /* Giao diện POS */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Sản phẩm */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
              <input 
                type="text" 
                placeholder="🔍 Tìm kiếm sản phẩm (nhập tên hoặc mã)..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none mb-6"
              />
              <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 content-start flex-1">
                {filteredProducts.map(p => (
                  <button 
                    key={p.productCode} 
                    onClick={() => addToCart(p)}
                    className="flex flex-col items-center justify-center text-center p-4 bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md rounded-2xl transition-all aspect-square group"
                  >
                    <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      🛍️
                    </div>
                    <span className="font-bold text-sm text-slate-700 line-clamp-2">{p.productName}</span>
                    <span className="text-xs text-teal-600 font-bold mt-1">{Number(p.unitPrice).toLocaleString('vi-VN')} đ</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cột phải: Giỏ hàng / Hóa đơn */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)]">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">🛒 Hóa đơn hiện tại</h3>
              <div className="px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">Thu ngân:</span>
                <span className="font-bold text-slate-800">{auth?.employeeId} - {auth?.fullName || auth?.username}</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {cartItems.length === 0 && <div className="text-center text-slate-400 py-10 mt-10">Chưa có sản phẩm nào trong giỏ</div>}
                {cartItems.map(item => (
                  <div key={item.productCode} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-800">{item.productName}</p>
                      <p className="text-xs font-semibold text-teal-600">{Number(item.unitPrice).toLocaleString('vi-VN')} đ</p>
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateCartQuantity(item.productCode, item.quantity - 1)} className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-600">-</button>
                      <input type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.productCode, e.target.value)} className="w-10 text-center font-bold text-sm border-x border-slate-200 py-1.5 outline-none" />
                      <button onClick={() => updateCartQuantity(item.productCode, item.quantity + 1)} className="px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-600">+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-200">
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú cho đơn hàng..." className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 bg-slate-50 text-sm outline-none" />
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-500 font-bold">Thành tiền</span>
                  <span className="text-2xl font-black text-teal-600">{totalAmount.toLocaleString('vi-VN')} <span className="text-lg">đ</span></span>
                </div>
                <button onClick={handleCheckout} className="btn-primary w-full py-4 text-lg shadow-lg shadow-teal-500/30">THANH TOÁN NGAY</button>
              </div>
            </div>
          </div>
        ) : (
          /* Giao diện Lịch sử */
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
                <button className="btn-ghost border border-slate-200" onClick={() => loadInitialData()}>Tải lại</button>
              </div>
            </div>
            <div className="table-wrap">
              {loading ? <p className="text-center py-10 text-slate-500">Đang tải dữ liệu...</p> : <DataTable rows={filteredInvoices} onRowClick={openDetails} />}
            </div>
          </section>
        )}
      </div>

      {/* Modal Chi tiết */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-800">Chi tiết hóa đơn: <span className="text-teal-600">{detailsTitle}</span></h3>
              <button className="btn-ghost !py-1.5 !px-3" onClick={closeDetailsModal}>Đóng</button>
            </div>
            <div className="table-wrap">
              <DataTable rows={details} />
            </div>
          </div>
        </div>
      )}
    </BranchLayout>
  );
}
