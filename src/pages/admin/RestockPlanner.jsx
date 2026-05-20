import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  PageHeader, StatusBadge, ProductThumbnail,
  Btn, Input, Select, formatNum, useToast,
} from "../../admin/components/ui";
import { products as mockProducts } from "../../admin/data/mockData";

const TARGET_DAYS = 30;
const LEAD_TIME = 7;
const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

function getPriority(daysCover) {
  if (daysCover < 3) return "critical";
  if (daysCover < 7) return "high";
  if (daysCover < 14) return "medium";
  return "normal";
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, normal: 3 };

export default function RestockPlanner() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const toast = useToast();

  const restockItems = useMemo(() => {
    return mockProducts
      .map((p) => {
        const dailyAvg = (p.salesCount || 0) / 30;
        const daysCover = dailyAvg > 0 ? p.stock / dailyAvg : (p.stock > 0 ? Infinity : 0);
        const suggested = Math.max(0, Math.ceil(TARGET_DAYS * dailyAvg - p.stock));
        const priority = p.stock <= 0 ? "critical" : getPriority(daysCover);
        return { ...p, dailyAvg, daysCover, suggested, priority };
      })
      .filter((p) => p.suggested > 0 || p.stock <= 0)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.daysCover - b.daysCover);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return restockItems;
    const q = search.toLowerCase();
    return restockItems.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [restockItems, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleExport = () => {
    const header = "Product,SKU,Current Stock,30-Day Sales,Daily Avg,Days Cover,Lead Time,Suggested Qty,Priority\n";
    const rows = filtered.map((p) =>
      `"${p.name}",${p.sku},${p.stock},${p.salesCount},${p.dailyAvg.toFixed(1)},${p.daysCover === Infinity ? "∞" : Math.round(p.daysCover)},${LEAD_TIME},${p.suggested},${p.priority}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restock-plan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.("Restock plan exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restock Planner"
        subtitle="AI-assisted restock recommendations"
        actions={<Btn variant="primary" onClick={handleExport}>Export Plan</Btn>}
      />

      {/* Methodology */}
      <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-5">
        <h3 className="text-sm font-bold text-[#f8fafc]">How we calculate recommendations</h3>
        <div className="mt-2 grid gap-3 text-xs text-[#8b95a7] sm:grid-cols-3">
          <div className="rounded-lg bg-[#182238] p-3">
            <span className="font-semibold text-[#d8b84f]">Daily Avg</span> = Total Sales (30d) ÷ 30
          </div>
          <div className="rounded-lg bg-[#182238] p-3">
            <span className="font-semibold text-[#d8b84f]">Days of Cover</span> = Current Stock ÷ Daily Avg
          </div>
          <div className="rounded-lg bg-[#182238] p-3">
            <span className="font-semibold text-[#d8b84f]">Suggested Qty</span> = ({TARGET_DAYS}d × Daily Avg) − Current Stock
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[#8b95a7]">
          Target days of cover: <strong className="text-[#f8fafc]">{TARGET_DAYS} days</strong> · Lead time assumption: <strong className="text-[#f8fafc]">{LEAD_TIME} days</strong>
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search product or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!w-56"
        />
        <span className="text-xs text-[#8b95a7]">{filtered.length} products need restocking</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 min-w-[200px]">Product</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">30d Sales</th>
                <th className="px-4 py-3">Daily Avg</th>
                <th className="px-4 py-3">Days Cover</th>
                <th className="px-4 py-3">Lead Time</th>
                <th className="px-4 py-3">Suggested Qty</th>
                <th className="px-4 py-3">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-[#8b95a7]">
                    All products are well-stocked. No restocking needed.
                  </td>
                </tr>
              ) : (
                paged.map((p) => (
                  <tr key={p.id} className="transition hover:bg-[#182238]/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail src={p.images?.[0]} alt={p.name} size={32} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#f8fafc]">{p.name}</p>
                          <p className="text-[10px] font-mono text-[#8b95a7]">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold tabular-nums ${p.stock <= 0 ? "text-[#f87171]" : p.stock <= p.lowStockThreshold ? "text-[#f59e0b]" : "text-[#f8fafc]"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#f8fafc]">{formatNum(p.salesCount)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#f8fafc]">{p.dailyAvg.toFixed(1)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#f8fafc]">
                      {p.daysCover === Infinity ? (
                        <span className="text-[#8b95a7]">∞</span>
                      ) : p.daysCover === 0 ? (
                        <span className="font-semibold text-[#f87171]">0d</span>
                      ) : (
                        `${Math.round(p.daysCover)}d`
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#8b95a7]">{LEAD_TIME}d</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#d8b84f]/15 px-2 py-1 text-sm font-bold tabular-nums text-[#d8b84f]">
                        +{p.suggested}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.priority} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 10 && (
          <div className="flex flex-col gap-3 border-t border-[#263145] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-[#8b95a7]">
                Show{" "}
                <span className="mx-1 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                of {filtered.length}
              </span>
              <div className="w-20">
                <Select
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  options={SHOW_OPTIONS}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const navItems =
                  totalPages <= 5
                    ? Array.from({ length: totalPages }, (_, i) => i + 1)
                    : page <= 3
                      ? [1, 2, 3, "end-gap", totalPages]
                      : page >= totalPages - 2
                        ? [1, "start-gap", totalPages - 2, totalPages - 1, totalPages]
                        : [1, "start-gap", page - 1, page, page + 1, "end-gap", totalPages];

                const navButtonClass =
                  "flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
                const ghostStyle =
                  "border-[#263145] bg-[#0f1726] text-[#8b95a7] shadow-sm hover:border-[#d8b84f]/50 hover:bg-[#182238] hover:text-[#f8fafc]";
                const activeStyle =
                  "border-[#d8b84f] bg-[#d8b84f] text-[#070b14] shadow-[0_8px_18px_rgba(216,184,79,0.24)]";

                return (
                  <>
                    <button
                      type="button"
                      aria-label="First page"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronsLeft className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    {navItems.map((item) =>
                      typeof item === "number" ? (
                        <button
                          key={item}
                          type="button"
                          aria-label={`Page ${item}`}
                          onClick={() => setPage(item)}
                          className={`${navButtonClass} ${item === page ? activeStyle : ghostStyle}`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span key={item} className="px-1 text-sm font-semibold text-[#8b95a7]">
                          …
                        </span>
                      )
                    )}
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label="Last page"
                      disabled={page >= totalPages}
                      onClick={() => setPage(totalPages)}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronsRight className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
