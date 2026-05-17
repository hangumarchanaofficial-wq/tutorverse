import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminStockReport, patchAdminProduct } from "../../services/adminApi";

const STOCK_THRESHOLD = 20;

function stockBadge(qty) {
  if (qty <= 0) return "bg-red-500/15 text-red-400";
  if (qty <= 5) return "bg-amber-500/15 text-amber-400";
  if (qty <= 10) return "bg-blue-500/15 text-blue-400";
  return "bg-emerald-500/15 text-emerald-400";
}

function Toast({ message, variant = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = variant === "success"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : "border-red-500/20 bg-red-500/10 text-red-400";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${colors}`}>
      {variant === "success" ? (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
}

function DonutChart({ outOfStock, lowStock, healthy }) {
  const total = outOfStock + lowStock + healthy || 1;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  const slices = [
    { value: outOfStock, color: "#ef4444" },
    { value: lowStock, color: "#f59e0b" },
    { value: healthy, color: "#10b981" },
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {slices.map((s, i) => {
        const pct = s.value / total;
        const dash = pct * circ;
        const o = offset;
        offset += dash;
        if (pct === 0) return null;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={12}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-o}
            strokeLinecap="round"
            className="opacity-80"
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-white text-[11px] font-bold">{total}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-white/40 text-[6px]">TOTAL</text>
    </svg>
  );
}

function StockGauge({ qty }) {
  const pct = Math.min((qty / STOCK_THRESHOLD) * 100, 100);
  const color = qty <= 0 ? "bg-red-500" : qty <= 5 ? "bg-amber-500" : qty <= 10 ? "bg-blue-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminStock() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const [restocking, setRestocking] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let on = true;
    fetchAdminStockReport()
      .then((d) => { if (on) setData(d); })
      .catch((e) => { if (on) setError(e.message || "Failed to load stock report"); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const handleRestock = async (product) => {
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty < 0) return;
    setRestocking(true);
    try {
      await patchAdminProduct(product.id, { stock_qty: qty });
      setData((prev) => {
        if (!prev) return prev;
        const update = (arr) => arr.map((p) => p.id === product.id ? { ...p, stock_qty: qty } : p);
        return { ...prev, outOfStock: update(prev.outOfStock || []), lowStock: update(prev.lowStock || []) };
      });
      setToast({ message: `Restock saved — ${product.title} set to ${qty}`, variant: "success" });
      setRestockId(null);
      setRestockQty("");
    } catch {
      setToast({ message: "Restock failed — endpoint may not exist", variant: "error" });
    } finally {
      setRestocking(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const allRows = [...(data.outOfStock || []), ...(data.lowStock || [])];
    const header = "ID,Title,Stock,Active\n";
    const rows = allRows.map((p) => `${p.id},"${(p.title || "").replace(/"/g, '""')}",${p.stock_qty},${p.is_active ? "Yes" : "No"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-32 bg-white/[0.06] animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-white/[0.06] animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
              <div className="h-3 w-16 bg-white/[0.06] animate-pulse rounded mb-2" />
              <div className="h-8 w-12 bg-white/[0.06] animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
              <div className="h-4 w-8 bg-white/[0.06] animate-pulse rounded" />
              <div className="h-4 w-40 bg-white/[0.06] animate-pulse rounded" />
              <div className="h-4 w-12 bg-white/[0.06] animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
    );
  }

  const outOfStock = data.outOfStock || [];
  const lowStock = data.lowStock || [];
  const allProducts = [...outOfStock, ...lowStock];
  const totalProducts = allProducts.length;
  const healthyCount = Math.max(0, totalProducts - outOfStock.length - lowStock.length);

  const filtered = allProducts
    .filter((p) => !search || p.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortAsc ? a.stock_qty - b.stock_qty : b.stock_qty - a.stock_qty);

  const summaryCards = [
    { label: "Total products", value: totalProducts, color: "text-white" },
    { label: "Out of stock", value: outOfStock.length, color: "text-red-400" },
    { label: "Low stock", value: lowStock.length, color: "text-amber-400" },
    { label: "Healthy", value: healthyCount, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Stock</h1>
          <p className="mt-1 text-sm text-white/40">Low and out-of-stock SKUs from the catalog.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
            <p className="text-xs font-medium text-white/40">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30 sm:w-64"
              />
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/60 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
            >
              Stock: {sortAsc ? "Low → High" : "High → Low"}
              <svg className={`h-3.5 w-3.5 transition-transform ${sortAsc ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Level</th>
                    <th className="px-5 py-3">Active</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
                            <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/70">
                              {search ? `No products match "${search}"` : "All stock levels are healthy"}
                            </p>
                            <p className="mt-1 text-xs text-white/40">Nothing to worry about here</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-white/40">{p.id}</td>
                        <td className="px-5 py-3">
                          <Link to={`/product/${p.id}`} className="font-medium text-brand-gold hover:text-brand-gold-light hover:underline">
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${stockBadge(p.stock_qty)}`}>
                            {p.stock_qty}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StockGauge qty={p.stock_qty} />
                        </td>
                        <td className="px-5 py-3 text-white/50">{p.is_active ? "Yes" : "No"}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            {restockId === p.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={restockQty}
                                  onChange={(e) => setRestockQty(e.target.value)}
                                  placeholder="Qty"
                                  className="w-20 rounded-lg bg-white/[0.05] border border-white/[0.1] px-2 py-1 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRestock(p)}
                                  disabled={restocking}
                                  className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
                                >
                                  {restocking ? "…" : "Save"}
                                </button>
                                <button
                                  onClick={() => { setRestockId(null); setRestockQty(""); }}
                                  className="rounded-lg bg-white/[0.06] px-2 py-1.5 text-xs text-white/50 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setRestockId(p.id); setRestockQty(String(p.stock_qty)); }}
                                className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
                              >
                                Restock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Stock Health</p>
            <div className="mx-auto h-36 w-36">
              <DonutChart
                outOfStock={outOfStock.length}
                lowStock={lowStock.length}
                healthy={healthyCount}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-white/60">Out of stock</span>
                <span className="ml-auto font-semibold text-white">{outOfStock.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-white/60">Low stock</span>
                <span className="ml-auto font-semibold text-white">{lowStock.length}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-white/60">Healthy</span>
                <span className="ml-auto font-semibold text-white">{healthyCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
