"use client";

export async function apiFetch(path, options) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "";
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}
