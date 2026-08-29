"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import PurchaseReceiptsList from "./components/PurchaseReceiptsList";
import PurchaseReceiptDetails from "./components/PurchaseReceiptDetails";
import CreatePurchaseReceiptModal from "./components/CreatePurchaseReceiptModal";
import { useBranch } from "@/hooks/useBranch";

export default function PurchaseReceiptsPage() {
  const { branch } = useBranch({ requireLocal: true });
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const showNotification = useToast();

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/purchase-receipts");
      setReceipts(data);
    } catch (error) {
      console.error(error);
      showNotification("Không thể tải danh sách phiếu nhập", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchReceipts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý nhập hàng</h1>
          <p className="text-slate-500 mt-1">Lịch sử phiếu nhập và nhập hàng mới</p>
        </div>
        {!selectedReceipt && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-2"
          >
            <span>+ Nhập hàng</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {selectedReceipt ? (
          <PurchaseReceiptDetails 
            receiptId={selectedReceipt.MaPN} 
            supplierName={selectedReceipt.TenNCC || selectedReceipt.MaNCC}
            onBack={() => setSelectedReceipt(null)} 
          />
        ) : (
          <PurchaseReceiptsList 
            receipts={receipts} 
            loading={loading} 
            onViewDetails={(id) => setSelectedReceipt(receipts.find(r => r.MaPN === id))} 
          />
        )}
      </div>

      {isCreateModalOpen && (
        <CreatePurchaseReceiptModal
          branch={branch}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
