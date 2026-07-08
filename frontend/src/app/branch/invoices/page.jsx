"use client";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";

import POSView from "./components/POSView";
import CartView from "./components/CartView";
import HistoryView from "./components/HistoryView";
import InvoiceDetailsModal from "./components/InvoiceDetailsModal";

// Bản đồ hình ảnh sản phẩm 
const PRODUCT_IMAGES = {
  MI_GOI: "/images/migoi.png",
  SUA_HOP: "/images/sua_hop.png",
  NUOC_SUOI: "/images/nuoc_suoi.png",
  BANH_SNACK: "/images/banh_snack.png",
  CA_PHE_LON: "/images/ca_phe_lon.png",
  TRA_XANH: "/images/tra_xanh.png",
  KEO_CAOSUG: "/images/keocaosu.png",
  NUOC_NGOT: "/images/nuocngot.png",
  MUT_KHO: "/images/mutkho.png",
  CA_PHE_LON: "/images/caphe.png",
  BANH_SNACK: "/images/banhsnack.png",
  TRA_XANH: "/images/traxanh.png",
  SUA_HOP: "/images/suahop.png"
};

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const [activeTab, setActiveTab] = useState("pos");
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [details, setDetails] = useState([]);
  const [detailsTitle, setDetailsTitle] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useToast();
  const { isOpen: isDetailsOpen, open: openDetailsModal, close: closeDetailsModal } = useModal();
  const [searchInvoice, setSearchInvoice] = useState("");
  const [note, setNote] = useState("");

  const totalAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
    [cartItems]
  );

  const loadInitialData = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const [historyRes, prodsRes] = await Promise.all([
        apiFetch(`/api/invoices?branch=${branch}`),
        apiFetch(`/api/products?branch=${branch}`),
      ]);
      setInvoices(Array.isArray(historyRes.data) ? historyRes.data : []);
      setProducts(Array.isArray(prodsRes) ? prodsRes : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData().catch(() => { });
  }, [branch]);

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.productCode === product.productCode);
    const currentQty = existing ? existing.quantity : 0;

    // Kiểm tra giới hạn tồn kho
    if (product.stock !== undefined && currentQty >= product.stock) {
      showNotification(`Sản phẩm ${product.productName} chỉ còn ${product.stock} trong kho!`, "error");
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.productCode === product.productCode);
      if (existing) {
        return prev.map(item =>
          item.productCode === product.productCode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productCode, newQuantity) => {
    const qty = Math.max(0, Number(newQuantity));
    const product = products.find(p => p.productCode === productCode);

    // Kiểm tra giới hạn tồn kho khi chỉnh sửa số lượng trực tiếp
    if (product && product.stock !== undefined && qty > product.stock) {
      showNotification(`Sản phẩm ${product.productName} chỉ còn ${product.stock} trong kho!`, "error");
      return;
    }

    setCartItems(prev => {
      if (qty === 0) return prev.filter(item => item.productCode !== productCode);
      return prev.map(item =>
        item.productCode === productCode ? { ...item, quantity: qty } : item
      );
    });
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!branch) return;

    if (!auth?.employeeId) return alert("Không xác định được nhân viên thu ngân (Lỗi phiên đăng nhập).");
    if (cartItems.length === 0) return alert("Giỏ hàng đang trống!");

    const cleanedItems = cartItems.map((item) => ({
      productCode: String(item.productCode || "").trim(),
      productName: String(item.productName || "").trim(),
      unitPrice: Number(item.unitPrice || 0),
      quantity: Number(item.quantity || 0),
      totalAmount: Number(item.unitPrice || 0) * Number(item.quantity || 0),
    }));

    try {
      const payload = { branch, employeeId: auth.employeeId, items: cleanedItems, totalAmount, note };
      await apiFetch("/api/invoices", {
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
      showNotification(err.message, "error");
    }
  };

  const cashierName = auth ? `${auth.employeeId} - ${auth.fullName || auth.username}` : "Chưa xác định";

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Point of Sale (POS)</p>
            <h1 className="text-3xl font-bold text-slate-900">Giao dịch & Hóa đơn</h1>
          </div>
        </header>

        <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "pos" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Bán hàng (POS)
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === "history" ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Lịch sử giao dịch
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        {activeTab === "pos" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <POSView
              products={products}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              addToCart={addToCart}
              productImages={PRODUCT_IMAGES}
            />
            <CartView
              cartItems={cartItems}
              updateCartQuantity={updateCartQuantity}
              note={note}
              setNote={setNote}
              totalAmount={totalAmount}
              handleCheckout={handleCheckout}
              cashierName={cashierName}
            />
          </div>
        ) : (
          <HistoryView
            loading={loading}
            invoices={invoices}
            searchInvoice={searchInvoice}
            setSearchInvoice={setSearchInvoice}
            openDetails={openDetails}
          />
        )}
      </div>

      <InvoiceDetailsModal
        isOpen={isDetailsOpen}
        title={detailsTitle}
        details={details}
        onClose={closeDetailsModal}
      />
    </>
  );
}
