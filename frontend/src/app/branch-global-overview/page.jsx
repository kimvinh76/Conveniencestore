"use client";
import { useEffect, useState } from "react";
import BranchLayout from "@/components/layouts/BranchLayout";
import { apiFetch } from "@/components/api";
import DynamicChart from "@/components/DynamicChart";
import { useBranch } from "@/components/useBranch";
import Link from "next/link";

export default function Page() {
  const { branch } = useBranch({ requireLocal: true });
  const [report, setReport] = useState(null);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState({ open: false, type: null });
  const [rankingModal, setRankingModal] = useState({ open: false, type: null });

  const load = async () => {
    if (!branch) return;
    setError(null);
    setLoading(true);
    try {
      const [nationalData, overviewData] = await Promise.all([
        apiFetch(`/api/revenue/national?branch=${branch}`),
        apiFetch(`/api/analytics/overview?branch=${branch}`)
      ]);
      setReport(nationalData);
      setOverview(overviewData);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [branch]);

  const byBranch = Array.isArray(report?.byBranch) ? report.byBranch : [];
  const daily = Array.isArray(overview?.daily) ? overview.daily : [];
  const weekly = Array.isArray(overview?.weekly) ? overview.weekly : [];
  const topEmployees = Array.isArray(overview?.topEmployees) ? overview.topEmployees : [];
  const topProducts = Array.isArray(overview?.topProducts) ? overview.topProducts : [];
  const weekCompare = Array.isArray(overview?.weekCompare) ? overview.weekCompare : [];

  // Logic gộp dữ liệu Global
  const globalDaily = daily.reduce((acc, d) => {
    const date = d.date?.slice(0, 10);
    if (!acc[date]) acc[date] = 0;
    acc[date] += Number(d.totalRevenue || 0);
    return acc;
  }, {});

  const globalWeekly = weekly.reduce((acc, w) => {
    const key = `W${w.week}/${w.year}`;
    if (!acc[key]) acc[key] = 0;
    acc[key] += Number(w.totalRevenue || 0);
    return acc;
  }, {});

  return (
    <BranchLayout active="global">
      <div className="flex flex-col gap-6 w-full">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Toàn cục</p>
            <h1 className="text-3xl font-bold text-slate-900">Phân tích chuyên sâu toàn hệ thống</h1>
          </div>
          <button className="btn-primary" onClick={() => load()}>
            {loading ? "Đang tải..." : "Làm mới dữ liệu"}
          </button>
        </header>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">Lỗi: {error}</div>}

        {!error && report && (
          <div className="flex flex-col gap-8">
            {/* NHÓM 1: DOANH THU & TỈ TRỌNG */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Doanh thu theo chi nhánh</h3>
                <div className="h-80">
                  <DynamicChart type="bar" labels={byBranch.map(b => b.branch)} datasets={[{ label: "Doanh thu (VNĐ)", data: byBranch.map(b => Number(b.revenue || 0)), backgroundColor: ["#0c8d8a", "#ca5b2d", "#2e6ad1"], borderRadius: 6 }]} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Tỉ trọng đóng góp (%)</h3>
                <div className="h-80">
                  <DynamicChart type="pie" labels={byBranch.map(b => b.branch)} datasets={[{ data: byBranch.map(b => Number(b.revenue || 0)), backgroundColor: ["#0c8d8a", "#ca5b2d", "#2e6ad1"] }]} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </section>

            {/* NHÓM 2: XU HƯỚNG GLOBAL */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Xu hướng Ngày (Toàn quốc)</h3>
                  <button className="text-blue-600 font-semibold text-sm hover:underline" onClick={() => setDetailModal({ open: true, type: 'daily' })}>Xem chi tiết</button>
                </div>
                <div className="h-72">
                  <DynamicChart type="line" labels={Object.keys(globalDaily)} datasets={[{ label: "Doanh thu", data: Object.values(globalDaily), borderColor: "#6366f1", backgroundColor: "rgba(99,102,241,0.1)", tension: 0.4, fill: true }]} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Xu hướng Tuần (Toàn quốc)</h3>
                  <button className="text-blue-600 font-semibold text-sm hover:underline" onClick={() => setDetailModal({ open: true, type: 'weekly' })}>Xem chi tiết</button>
                </div>
                <div className="h-72">
                  <DynamicChart type="line" labels={Object.keys(globalWeekly)} datasets={[{ label: "Doanh thu", data: Object.values(globalWeekly), borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.1)", tension: 0.4, fill: true }]} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </section>

            {/* NHÓM 3: SO SÁNH & RANKING */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">So sánh hiệu suất tuần này với tuần trước</h3>
                <div className="h-72">
                  <DynamicChart type="bar" labels={weekCompare.map(b => b.branch)} datasets={[
                    { label: "Tuần trước", data: weekCompare.map(b => Number(b.lastWeekRevenue || 0)), backgroundColor: "#94a3b8", borderRadius: 4 },
                    { label: "Tuần này", data: weekCompare.map(b => Number(b.thisWeekRevenue || 0)), backgroundColor: "#0ea5e9", borderRadius: 4 }
                  ]} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-slate-800 p-8 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center flex-1 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => setRankingModal({ open: true, type: 'employees' })}>
                  <h4 className="text-xl font-bold mb-2">Bảng vàng Nhân viên</h4>
                  <p className="text-slate-300 text-center text-sm">Xem top nhân viên bán tốt nhất tại mỗi chi nhánh tuần này</p>
                  <button className="mt-4 bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm">Xem ngay</button>
                </div>
                <div className="bg-teal-800 p-8 rounded-2xl shadow-lg text-white flex flex-col justify-center items-center flex-1 cursor-pointer hover:bg-teal-700 transition-colors" onClick={() => setRankingModal({ open: true, type: 'products' })}>
                  <h4 className="text-xl font-bold mb-2">Sản phẩm Hot nhất</h4>
                  <p className="text-teal-100 text-center text-sm">Khám phá các sản phẩm dẫn đầu doanh số tại các khu vực</p>
                  <button className="mt-4 bg-white text-teal-800 px-6 py-2 rounded-full font-bold text-sm">Xem ngay</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* MODAL CHI TIẾT DOANH THU 3 CHI NHÁNH */}
        {detailModal.open && (
          <dialog className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl bg-white p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Chi tiết doanh thu chi nhánh - {detailModal.type === 'daily' ? 'Theo Ngày' : 'Theo Tuần'}</h3>
                <button className="btn-ghost" onClick={() => setDetailModal({ open: false, type: null })}>✕ Đóng</button>
              </div>
              <div className="h-[500px]">
                <DynamicChart type="line" 
                  labels={detailModal.type === 'daily' ? [...new Set(daily.map(d => d.date?.slice(0, 10)))] : [...new Set(weekly.map(w => `W${w.week}/${w.year}`))] }
                  datasets={[
                    { label: "HUE", data: (detailModal.type === 'daily' ? daily : weekly).filter(d => d.branch === 'HUE').map(d => Number(d.totalRevenue)), borderColor: "#0c8d8a", tension: 0.4 },
                    { label: "SAIGON", data: (detailModal.type === 'daily' ? daily : weekly).filter(d => d.branch === 'SAIGON').map(d => Number(d.totalRevenue)), borderColor: "#ca5b2d", tension: 0.4 },
                    { label: "HANOI", data: (detailModal.type === 'daily' ? daily : weekly).filter(d => d.branch === 'HANOI').map(d => Number(d.totalRevenue)), borderColor: "#2e6ad1", tension: 0.4 }
                  ]}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </div>
          </dialog>
        )}

        {/* MODAL RANKING NHÂN VIÊN/SẢN PHẨM */}
        {rankingModal.open && (
          <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-2xl bg-white p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold">{rankingModal.type === 'employees' ? 'Top Nhân viên xuất sắc chi nhánh' : 'Top Sản phẩm hot nhất chi nhánh'}</h3>
                <button onClick={() => setRankingModal({ open: false, type: null })}>✕</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    {rankingModal.type === 'employees' ? 
                      <tr><th>Chi nhánh</th><th>Nhân viên</th><th className="text-right">Doanh thu</th></tr> :
                      <tr><th>Chi nhánh</th><th>Sản phẩm</th><th className="text-right">Đã bán</th></tr>
                    }
                  </thead>
                  <tbody>
                    {rankingModal.type === 'employees' ? 
                      topEmployees.map((e, idx) => (
                        <tr key={idx}>
                          <td><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{e.branch}</span></td>
                          <td>{e.employeeName}</td>
                          <td className="text-right font-bold text-teal-600">{Number(e.totalRevenue).toLocaleString("vi-VN")} đ</td>
                        </tr>
                      )) :
                      topProducts.map((p, idx) => (
                        <tr key={idx}>
                          <td><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{p.branch}</span></td>
                          <td>{p.productName}</td>
                          <td className="text-right font-bold text-blue-600">{p.totalSold}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </BranchLayout>
  );
}
