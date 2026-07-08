"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import ProductList from "./components/ProductList";

const PRODUCT_IMAGES = {
  MI_GOI: "/images/migoi.png",
  SUA_HOP: "/images/suahop.png",

  BANH_SNACK: "/images/banhsnack.png",
  CA_PHE_LON: "/images/caphe.png",
  TRA_XANH: "/images/traxanh.png",
  KEO_CAOSUG: "/images/keocaosu.png",
  NUOC_NGOT: "/images/nuocngot.png",
  MUT_KHO: "/images/mutkho.png",
  KEO_DEO: "/images/keodeo.png",
  NUOC_SUOI: "/images/nuocsuoi.png",


};

const PRODUCT_DESCRIPTIONS = {
  MI_GOI: "Mì ăn liền thơm ngon, tiện lợi cho bữa ăn nhanh.",
  SUA_HOP: "Sữa tươi tiệt trùng bổ sung dưỡng chất và năng lượng.",
  NUOC_SUOI: "Nước khoáng tinh khiết, mát lạnh sảng khoái.",
  BANH_SNACK: "Snack giòn rụm, hương vị đậm đà, ăn vặt cực đã.",
  CA_PHE_LON: "Cà phê lon đậm vị cà phê sữa đá Việt Nam truyền thống.",
  TRA_XANH: "Trà xanh tự nhiên thanh mát, ít ngọt, tốt cho sức khỏe.",
  KEO_CAOSUG: "Kẹo cao su hương bạc hà thơm mát, sảng khoái tinh thần.",
  NUOC_NGOT: "Nước ngọt có ga sảng khoái, đập tan cơn khát.",
  MUT_KHO: "Mứt hoa quả sấy khô dẻo ngọt, thơm ngon tự nhiên.",
};

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          productImages={PRODUCT_IMAGES}
          productDescriptions={PRODUCT_DESCRIPTIONS}
        />
      )}
    </div>
  );
}