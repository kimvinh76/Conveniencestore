"use client";
import React, { useEffect, useState } from "react";

export default function CentralDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);

  async function loadRevenue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/revenue/national?branch=CENTRAL`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to load");
      const cards = [
        { label: "Tổng doanh thu", value: `${Number(json.nationalRevenue || 0).toLocaleString("vi-VN")} VND` },
        { label: "Số chi nhánh", value: Array.isArray(json.byBranch) ? json.byBranch.length : 0 },
        { label: "Chế độ", value: json.mode || "N/A" },
        { label: "Cập nhật", value: json.generatedAt ? new Date(json.generatedAt).toLocaleString("vi-VN") : "N/A" },
      ];
      setStats(cards);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenue().catch(() => {});
  }, []);

  return (
    <section>
      <header className="topbar modern-topbar">
        <div>
          <p className="eyebrow">Tác vụ Toàn cục</p>
          <h1>Dashboard Tổng công ty (Central)</h1>
        </div>
        <div>
          <button className="ghost" onClick={() => loadRevenue()} disabled={loading}>
            {loading ? "Đang tải..." : "Tải báo cáo"}
          </button>
        </div>
      </header>

      <section className="card" id="national-overview">
        <div className="section-head">
          <h2>Tổng quan toàn quốc</h2>
        </div>
        <p className="api-line">GET /api/revenue/national?branch=CENTRAL</p>
        <div className="stats-grid" id="centralStatsGrid">
          {error ? (
            <p className="subtitle">Lỗi: {error}</p>
          ) : stats.length === 0 ? (
            <p className="subtitle">Không có dữ liệu.</p>
          ) : (
            stats.map((s) => (
              <article key={s.label} className="stat-card">
                <p>{s.label}</p>
                <h3>{s.value}</h3>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
