"use client";
import React from "react";

export default function DataTable({ rows = [], columns, onRowClick }) {
  if (!rows || rows.length === 0) return <p className="subtitle">Không có dữ liệu.</p>;
  const headers = columns || Object.keys(rows[0] || {});
  return (
    <table className="selectable-table">
      <thead>
        <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} onClick={() => onRowClick && onRowClick(row)}>
            {headers.map((h) => <td key={h}>{row[h] ?? ""}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
