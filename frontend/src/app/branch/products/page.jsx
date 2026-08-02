"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import ProductList from "./components/ProductList";
import ProductDetailModal from "./components/ProductDetailModal";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const showNotification = useToast();
  const { isOpen: isDetailOpen, open: openDetailModal, close: closeDetailModal } = useModal();

  const load = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/products?branch=${branch}`);
      const normalized = (Array.isArray(data) ? data : []).map((row) => ({
        productCode: row.productCode || row.MaSP,
        productName: row.productName || row.TenHang,
        unitPrice: row.unitPrice ?? row.Gia,
        stock: row.stock ?? 0,
        description: row.description,
        imageUrl: row.imageUrl,
        unit: row.unit,
        active: row.active ?? true,
        categoryCode: row.categoryCode,
        categoryName: row.categoryName,
        brandCode: row.brandCode,
        brandName: row.brandName,
        barcode: row.barcode,
      }));
      setRows(normalized);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (productCode) => {
    if (!branch) return;
    setDetailLoading(true);
    setSelectedProduct(null);
    openDetailModal();
    try {
      const data = await apiFetch(`/api/products/${productCode}?branch=${branch}`);
      setSelectedProduct(data);
    } catch (err) {
      showNotification(err.message || String(err), "error");
      closeDetailModal();
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => { });
  }, [branch]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <header className="flex justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Danh mục</p>
          <h1 className="text-3xl font-bold text-slate-900">Sản phẩm & Tồn kho chi nhánh</h1>
        </div>
      </header>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

      {loading ? (
        <div className="bg-white py-20 text-center text-slate-500 border border-slate-200 rounded-2xl">
          Đang tải dữ liệu sản phẩm...
        </div>
      ) : (
        <ProductList
          products={rows}
          onViewDetail={handleViewDetail}
        />
      )}

      {/* Modal Chi Tiết Sản Phẩm */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        product={selectedProduct}
        loading={detailLoading}
      />
    </div>
  );
}