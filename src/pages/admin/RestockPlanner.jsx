import React, { useMemo, useState } from "react";
import {
  PageHeader, StatusBadge, ProductThumbnail,
  Btn, Input, formatNum, useToast,
} from "../../admin/components/ui";
import { products as mockProducts } from "../../admin/data/mockData";

const TARGET_DAYS = 30;
const LEAD_TIME = 7;

function getPriority(daysCover) {
  if (daysCover < 3) return "critical";
  if (daysCover < 7) return "high";
  if (daysCover < 14) return "medium";
  return "normal";
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, normal: 3 };

export default function RestockPlanner() {
  const [search, setSearch] = useState("");
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
                filtered.map((p) => (
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
      </div>
    </div>
  );
}
