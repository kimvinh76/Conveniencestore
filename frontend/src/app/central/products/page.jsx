"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useModal } from "@/hooks/useModal";
import ProductList from "./components/ProductList";
import ProductFormModal from "./components/ProductFormModal";
import ProductDeleteModal from "./components/ProductDeleteModal";
import ProductDetailModal from "./components/ProductDetailModal";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ productCode: "", productName: "", unitPrice: "", imageUrl: "", description: "", unit: "", categoryCode: "", brandCode: "", barcode: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [productToToggle, setProductToToggle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const showNotification = useToast();

  const { isOpen: isFormOpen, open: openFormModal, close: closeFormModal } = useModal();
  const { isOpen: isDeleteOpen, open: openDeleteModal, close: closeDeleteModal } = useModal();
  const { isOpen: isDetailOpen, open: openDetailModal, close: closeDetailModal } = useModal();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/products?branch=CENTRAL");
      const normalized = (Array.isArray(data) ? data : []).map((row) => ({
        productCode: row.productCode || row.MaSP,
        productName: row.productName || row.TenHang,
        unitPrice: row.unitPrice ?? row.Gia,
        imageUrl: row.imageUrl,
        description: row.description,
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

  useEffect(() => {
    load().catch(() => { });
    apiFetch("/api/categories").then(res => setCategories(res)).catch(() => { });
    apiFetch("/api/brands").then(res => setBrands(res)).catch(() => { });
  }, []);

  const handleAdd = () => {
    setForm({ productCode: "", productName: "", unitPrice: "", imageUrl: "", description: "", unit: "", categoryCode: "", brandCode: "", barcode: "" });
    setIsEditing(false);
    openFormModal();
  };

  const handleEdit = (row) => {
    setForm({ productCode: row.productCode, productName: row.productName, unitPrice: row.unitPrice, imageUrl: row.imageUrl || "", description: row.description || "", unit: row.unit || "", categoryCode: row.categoryCode || "", brandCode: row.brandCode || "", barcode: row.barcode || "" });
    setIsEditing(true);
    openFormModal();
  };

  const handleViewDetail = async (productCode) => {
    setDetailLoading(true);
    setSelectedProduct(null);
    openDetailModal();
    try {
      const data = await apiFetch(`/api/products/${productCode}?branch=CENTRAL`);
      setSelectedProduct(data);
    } catch (err) {
      showNotification(err.message || String(err), "error");
      closeDetailModal();
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (product) => {
    setProductToToggle(product);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!productToToggle) return;
    try {
      const newActive = !productToToggle.active;
      await apiFetch(`/api/products/${productToToggle.productCode}/status?branch=CENTRAL`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive })
      });
      closeDeleteModal();
      showNotification(`Đã ${newActive ? "mở bán lại" : "tạm ngưng bán"} sản phẩm ${productToToggle.productCode}`);
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/products/${form.productCode}?branch=CENTRAL` : "/api/products?branch=CENTRAL";
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      closeFormModal();
      showNotification(isEditing ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm mới thành công");
      load();
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Danh mục gốc</p>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý sản phẩm toàn hệ thống</h1>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={handleAdd}>+ Thêm sản phẩm</button>
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetail={handleViewDetail}
          />
        )}
      </div>


      <ProductFormModal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        isEditing={isEditing}
        form={form}
        setForm={setForm}
        categories={categories}
        brands={brands}
        onSubmit={handleSubmit}
      />

      <ProductDeleteModal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        productToToggle={productToToggle}
        onConfirm={confirmDelete}
      />

      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        product={selectedProduct}
        loading={detailLoading}
      />
    </>
  );
}
