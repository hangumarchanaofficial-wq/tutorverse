import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  PageHeader, StatCard, StatusBadge, Tabs, Skeleton, SkeletonRows,
  ProductThumbnail, StockBadge, MiniDonut, ChartCard, ActionMenu,
  Btn, Input, Select, formatLkr, formatNum,
} from "../../admin/components/ui";
import { products as mockProducts } from "../../admin/data/mockData";
import { fetchAdminStockReport } from "../../services/adminApi";

const TABS = [
  { id: "all", label: "All" },
  { id: "out", label: "Out of Stock" },
  { id: "low", label: "Low Stock" },
  { id: "healthy", label: "Healthy" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

export default function StockOverview({ filter }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(filter === "low" ? "low" : "all");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const normalize = (list) =>
    list.map((p) => ({
      ...p,
      name: p.name || p.title || "",
      stock: p.stock ?? p.stock_qty ?? 0,
      reservedStock: p.reservedStock ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? p.low_stock_threshold ?? 5,
      salesCount: p.salesCount ?? p.sales_count ?? 0,
      costPrice: p.costPrice ?? p.cost_price ?? 0,
      categoryName: p.categoryName ?? p.category_name ?? "",
      sku: p.sku ?? "",
      images: p.images || [],
    }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminStockReport();
      const merged = [
        ...(res.outOfStock || res.out_of_stock || []),
        ...(res.lowStock || res.low_stock || []),
        ...(res.healthy || res.all || []),
      ];
      if (merged.length > 0) {
        setItems(normalize(merged));
      } else {
        setItems(normalize(mockProducts));
      }
    } catch {
      setItems(normalize(mockProducts));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stockHealth = useMemo(() => {
    const out = items.filter((p) => p.stock <= 0).length;
    const low = items.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const healthy = items.filter((p) => p.stock > p.lowStockThreshold).length;
    return { out, low, healthy };
  }, [items]);

  const kpis = useMemo(() => {
    const totalUnits = items.reduce((s, p) => s + p.stock, 0);
    const totalValue = items.reduce((s, p) => s + p.stock * (p.costPrice || 0), 0);
    return [
      { label: "Total Stock Units", value: formatNum(totalUnits) },
      { label: "Total Stock Value", value: formatLkr(totalValue, true) },
      { label: "Low Stock Items", value: formatNum(stockHealth.low), variant: "warning" },
      { label: "Out of Stock", value: formatNum(stockHealth.out), variant: "danger" },
      { label: "Healthy Stock", value: formatNum(stockHealth.healthy), variant: "success" },
    ];
  }, [items, stockHealth]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (tab === "out") list = list.filter((p) => p.stock <= 0);
    if (tab === "low") list = list.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
    if (tab === "healthy") list = list.filter((p) => p.stock > p.lowStockThreshold);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    list.sort((a, b) => sortAsc ? a.stock - b.stock : b.stock - a.stock);
    return list;
  }, [items, tab, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, tab, sortAsc, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const statusLabel = (p) => {
    if (p.stock <= 0) return "critical";
    if (p.stock <= p.lowStockThreshold) return "warning";
    return "healthy";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Overview" subtitle="Real-time inventory health across all products" />

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#263145] bg-[#121b2e] p-4">
              <Skeleton className="h-3 w-20 mb-2" /><Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((k) => <StatCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Donut + Table */}
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        {/* Donut */}
        <ChartCard title="Stock Health" subtitle="Product distribution">
          {loading ? (
            <Skeleton className="mx-auto h-[120px] w-[120px] rounded-full" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <MiniDonut
                segments={[
                  { value: stockHealth.out, color: "#f87171" },
                  { value: stockHealth.low, color: "#f59e0b" },
                  { value: stockHealth.healthy, color: "#34d399" },
                ]}
                centerLabel="Products"
                centerValue={items.length}
              />
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                  <span className="text-[#8b95a7]">Out of Stock</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{stockHealth.out}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#8b95a7]">Low Stock</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{stockHealth.low}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                  <span className="text-[#8b95a7]">Healthy</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{stockHealth.healthy}</span>
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        {/* Table */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Tabs
              tabs={TABS.map((t) => ({
                ...t,
                count: t.id === "all" ? items.length
                  : t.id === "out" ? stockHealth.out
                  : t.id === "low" ? stockHealth.low
                  : stockHealth.healthy,
              }))}
              activeTab={tab}
              onChange={setTab}
            />
            <Input
              placeholder="Search product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 w-full sm:!w-48"
            />
            <Btn variant="ghost" size="xs" onClick={() => setSortAsc((s) => !s)}>
              Stock: {sortAsc ? "Low→High" : "High→Low"}
            </Btn>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  <tr>
                    <th className="px-3 py-3 min-w-[200px]">Product</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Available</th>
                    <th className="px-3 py-3">Reserved</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263145]/60">
                  {loading ? (
                    <SkeletonRows rows={10} cols={7} />
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-[#8b95a7]">
                        No products in this category.
                      </td>
                    </tr>
                  ) : (
                    paged.map((p) => (
                        <tr key={p.id} className="transition hover:bg-[#182238]/60">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail src={p.images?.[0]} alt={p.name} size={36} />
                              <span className="truncate font-medium text-[#f8fafc]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-[#8b95a7]">{p.sku}</td>
                          <td className="px-3 py-3 text-xs text-[#8b95a7]">{p.categoryName}</td>
                          <td className="px-3 py-3"><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></td>
                          <td className="px-3 py-3 tabular-nums text-[#8b95a7]">{p.reservedStock}</td>
                          <td className="px-3 py-3"><StatusBadge status={statusLabel(p)} /></td>
                          <td className="px-3 py-3 text-right">
                            <ActionMenu items={[
                              { label: "View Product", onClick: () => window.open(`/product/${p.id}`, "_blank") },
                              { label: "Edit Product", onClick: () => window.location.href = `/admin/products/${p.id}/edit` },
                            ]} />
                          </td>
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 10 && (
              <div className="admin-table-pagination border-t border-[#263145]">
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
      </div>
    </div>
  );
}
