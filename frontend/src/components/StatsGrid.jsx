"use client";
import React from "react";

export default function StatsGrid({ stats = {} }) {
  const items = [
    { label: "Nhân viên", value: stats.employeeCount },
    { label: "Hóa đơn", value: stats.invoiceCount },
    { label: "Doanh thu", value: stats.revenue },
    { label: "Tồn kho", value: stats.totalStockUnits },
    { label: "Sản phẩm sắp hết", value: stats.lowStockProducts },
  ];

  const fmt = (v) => (v === undefined || v === null ? "—" : v.toLocaleString("vi-VN"));

  return (
    <div className="stats-grid">
      {items.map((it) => (
        <article key={it.label} className="stat-card">
          <p>{it.label}</p>
          <h3>{fmt(it.value)}</h3>
        </article>
      ))}
    </div>
  );
}
