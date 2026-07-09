"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { useBranch } from "@/hooks/useBranch";
import DynamicChart from "@/components/DynamicChart";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const { branch, auth } = useBranch({ requireLocal: true });
  const router = useRouter();

  useEffect(() => {
    if (auth && auth.role === "NHAN_VIEN") {
      router.replace("/branch/invoices");
    }
  }, [auth, router]);

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!branch) return;
    setLoading(true);
    setError(null);
    try {
      // Chỉ lấy dữ liệu cục bộ
      const res = await apiFetch(`/api/branch-dashboard?branch=${branch}`);
      const data = res.data || res || {};
      
      setStats({
        employeeCount: data.employeeCount || 0,
        invoiceCount: data.invoiceCount || 0,
        revenue: data.revenue || 0,
        totalStockUnits: data.totalStockUnits || 0,
        lowStockProducts: data.lowStockProducts || 0,
        topProducts: Array.isArray(data.topStockByProduct) ? data.topStockByProduct : [],
        sevenDayRevenue: data.sevenDayRevenue || {},
      });
    } catch (err) {
      setError(`Lỗi gọi API: ${err.message || String(err)}. Đảm bảo server Backend đang hoạt động.`);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, [branch]);

  return (
    <div className="flex flex-col gap-6 w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tổng quan</p>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Thống Kê Cục Bộ</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Link
              href="/branch/global-overview"
              className="btn-primary"
            >
              Xem thống kê toàn cục
            </Link>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
            Lỗi: {error}
          </div>
        )}

        {!error && stats && (
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Thống kê cục bộ chi nhánh {branch}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium mb-1">Tổng nhân viên</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats.employeeCount || 0}</h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium mb-1">Tổng hóa đơn</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats.invoiceCount || 0}</h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium mb-1">Tổng doanh thu</p>
                <h3 className="text-3xl font-bold text-teal-600">{Number(stats.revenue || 0).toLocaleString("vi-VN")} đ</h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium mb-1">Tổng SP tồn kho</p>
                <h3 className="text-3xl font-bold text-blue-600">{stats.totalStockUnits || 0}</h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-slate-500 text-sm font-medium mb-1">Sản phẩm sắp hết</p>
                <h3 className="text-3xl font-bold text-red-500">{stats.lowStockProducts || 0}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {stats.sevenDayRevenue && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Xu hướng doanh thu 7 ngày gần nhất</h3>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 h-80">
                    <DynamicChart
                      type="line"
                      labels={Object.keys(stats.sevenDayRevenue).length > 0 ? Object.keys(stats.sevenDayRevenue) : ["Chưa có dữ liệu"]}
                      datasets={[{
                        label: "Doanh thu (VNĐ)",
                        data: Object.values(stats.sevenDayRevenue).length > 0 ? Object.values(stats.sevenDayRevenue) : [0],
                        borderColor: "#0c8d8a",
                        backgroundColor: "rgba(12,141,138,0.1)",
                        tension: 0.4,
                        fill: true
                      }]}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              )}
              {stats.topProducts && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Top sản phẩm tồn kho cao nhất</h3>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 h-80">
                    <DynamicChart
                      type="bar"
                      labels={stats.topProducts.length > 0 ? stats.topProducts.map(p => p.productName) : ["Chưa có dữ liệu"]}
                      datasets={[{
                        label: "Số lượng tồn",
                        data: stats.topProducts.length > 0 ? stats.topProducts.map(p => p.quantity) : [0],
                        backgroundColor: "#3b82f6",
                        borderRadius: 6
                      }]}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              )}
            </div>

            {stats.topProducts && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Chi tiết tồn kho</h3>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Mã SP</th><th>Tên hàng</th><th className="text-right">Số lượng tồn</th></tr></thead>
                    <tbody>
                      {stats.topProducts.map((p, idx) => (
                        <tr key={idx}><td>{p.productCode}</td><td>{p.productName}</td><td className="text-right font-bold text-blue-600">{p.quantity}</td></tr>
                      ))}
                      {stats.topProducts.length === 0 && (
                        <tr><td colSpan="3" className="text-center py-4 text-slate-500">Chưa có dữ liệu</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
  );
}