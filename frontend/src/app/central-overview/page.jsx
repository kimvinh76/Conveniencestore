"use client";
import { useEffect, useState } from "react";
import CentralLayout from "@/components/layouts/CentralLayout";
import { apiFetch } from "@/components/api";
import DynamicChart from "@/components/DynamicChart";

export default function Page() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const data = await apiFetch("/api/revenue/national?branch=CENTRAL");
      setReport(data);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const byBranch = Array.isArray(report?.byBranch) ? report.byBranch : [];

  return (
    <CentralLayout active="overview">
      <header className="topbar modern-topbar">
        <div>
          <p className="eyebrow">Toàn cục</p>
          <h1>Tổng quan hệ thống</h1>
        </div>
      </header>

      <section className="card">
        <div className="section-head">
          <h2>Toàn quốc</h2>
          <button className="ghost" onClick={() => load()}>Tải lại</button>
        </div>
        <p className="api-line">GET /api/revenue/national?branch=CENTRAL</p>
        {error ? (
          <p className="subtitle">Lỗi: {error}</p>
        ) : (
          <div className="stats-grid">
            <article className="stat-card">
              <p>Tổng doanh thu</p>
              <h3>{Number(report?.nationalRevenue || 0).toLocaleString("vi-VN")} VND</h3>
            </article>
            <article className="stat-card">
              <p>Chi nhánh</p>
              <h3>{byBranch.length}</h3>
            </article>
            <article className="stat-card">
              <p>Chế độ</p>
              <h3>{report?.mode || "N/A"}</h3>
            </article>
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-head">
          <h2>So sánh doanh thu theo chi nhánh</h2>
        </div>
        <div className="chart-card" style={{ minHeight: 260 }}>
          <DynamicChart
            type="bar"
            labels={byBranch.map((b) => b.branch)}
            datasets={[{ label: "Doanh thu", data: byBranch.map((b) => Number(b.revenue || 0)), backgroundColor: "#1c7ca0" }]}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        </div>
      </section>
    </CentralLayout>
  );
}
