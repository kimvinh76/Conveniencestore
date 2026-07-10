"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import PurchaseReceiptsList from "../../branch/purchase-receipts/components/PurchaseReceiptsList";
import PurchaseReceiptDetails from "../../branch/purchase-receipts/components/PurchaseReceiptDetails";

export default function CentralPurchaseReceiptsPage() {
  const [branch, setBranch] = useState("HUE");
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const showNotification = useToast();

  const fetchReceipts = async (b = branch) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/purchase-receipts?branch=${b}`);
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
  }, [branch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kiểm tra nhập hàng</h1>
          <p className="text-slate-500 mt-1">Xem lịch sử phiếu nhập hàng của các chi nhánh</p>
        </div>
        {!selectedReceipt && (
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-slate-600">Xem chi nhánh:</span>
            <select 
              value={branch} 
              onChange={(e) => {
                setBranch(e.target.value);
                setSelectedReceipt(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="HUE">HUE</option>
              <option value="SAIGON">SAIGON</option>
              <option value="HANOI">HANOI</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {selectedReceipt ? (
          <PurchaseReceiptDetails 
            receiptId={selectedReceipt.MaPN} 
            branch={branch}
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
    </div>
  );
}
