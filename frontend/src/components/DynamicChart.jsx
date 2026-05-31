"use client";
import { useEffect, useRef } from "react";

export default function DynamicChart({ type = "line", labels = [], datasets = [] , options = {}}) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    // Chart is loaded via CDN in layout; fallback guard
    const Chart = (typeof window !== "undefined" && window.Chart) || null;
    if (!Chart) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = ref.current.getContext("2d");
    chartRef.current = new Chart(ctx, {
      type,
      data: { labels, datasets },
      options,
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [type, JSON.stringify(labels), JSON.stringify(datasets)]);

  return <canvas ref={ref} />;
}
