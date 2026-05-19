import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Input,
  Select,
  Btn,
  ConfirmDialog,
  ProductThumbnail,
  StatusBadge,
  StatCard,
  Tabs,
  Skeleton,
  SkeletonRows,
  ChartCard,
  MiniDonut,
  ActionMenu,
  formatNum,
  useToast,
} from "../../admin/components/ui";
import { getBrands, setBrands } from "../../admin/utils/brands";

const TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "empty", label: "No products" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

function BrandAvatar({ brand }) {
  const initial = (brand.name || "?").charAt(0).toUpperCase();
  if (brand.logoUrl) {
    return <ProductThumbnail src={brand.logoUrl} alt={brand.name} size={36} />;
  }
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#263145] bg-[#182238] text-sm font-bold text-[#d8b84f]"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function emptyMessage(tab) {
  if (tab === "active") return "No active brands match your search.";
  if (tab === "inactive") return "No inactive brands match your search.";
  if (tab === "empty") return "No brands without products match your search.";
  return "No brands match your filters.";
}

export default function BrandsList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getBrands());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const distribution = useMemo(() => {
    const inactive = items.filter((b) => b.status === "inactive").length;
    const noProducts = items.filter((b) => (b.productCount ?? 0) === 0 && b.status === "active").length;
    const active = items.filter((b) => b.status === "active" && (b.productCount ?? 0) > 0).length;
    return { active, inactive, noProducts };
  }, [items]);

  const tabCounts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((b) => b.status === "active").length,
      inactive: items.filter((b) => b.status === "inactive").length,
      empty: items.filter((b) => (b.productCount ?? 0) === 0).length,
    }),
    [items]
  );

  const kpis = useMemo(() => {
    const linkedProducts = items.reduce((s, b) => s + (b.productCount ?? 0), 0);
    return [
      { label: "Total Brands", value: formatNum(items.length) },
      { label: "Active", value: formatNum(tabCounts.active), variant: "success" },
      { label: "Inactive", value: formatNum(tabCounts.inactive) },
      { label: "With Products", value: formatNum(items.filter((b) => (b.productCount ?? 0) > 0).length) },
      { label: "Linked Products", value: formatNum(linkedProducts) },
    ];
  }, [items, tabCounts]);

  const filteredAll = useMemo(() => {
    let out = items;
    const q = search.toLowerCase().trim();
    if (q) {
      out = out.filter(
        (b) => b.name.toLowerCase().includes(q) || (b.slug || "").toLowerCase().includes(q)
      );
    }
    if (tab === "active") out = out.filter((b) => b.status === "active");
    if (tab === "inactive") out = out.filter((b) => b.status === "inactive");
    if (tab === "empty") out = out.filter((b) => (b.productCount ?? 0) === 0);

    out = [...out].sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return out;
  }, [items, search, tab, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredAll.length / pageSize));
  const paged = filteredAll.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, tab, sortAsc, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const next = items.filter((b) => b.id !== deleteTarget.id);
    setItems(next);
    setBrands(next);
    toast?.("Brand removed");
    setDeleteTarget(null);
  };

  return (
    <div className="admin-products-page space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete brand"
        message={`Remove "${deleteTarget?.name}"? Products may still reference this brand name.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title="Brands Management"
        subtitle="Catalog health across all brands"
        actions={
          <Link to="/admin/brands/new">
            <Btn variant="primary" size="md" className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Add new
            </Btn>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#263145] bg-[#121b2e] p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((k) => (
            <StatCard key={k.label} {...k} />
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <ChartCard title="Brand distribution" subtitle="Catalog breakdown">
          {loading ? (
            <Skeleton className="mx-auto h-[120px] w-[120px] rounded-full" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <MiniDonut
                segments={[
                  { value: distribution.active, color: "#34d399" },
                  { value: distribution.inactive, color: "#8b95a7" },
                  { value: distribution.noProducts, color: "#f59e0b" },
                ]}
                centerLabel="Brands"
                centerValue={items.length}
              />
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                  <span className="text-[#8b95a7]">Active</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{distribution.active}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8b95a7]" />
                  <span className="text-[#8b95a7]">Inactive</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{distribution.inactive}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[#8b95a7]">No products</span>
                  <span className="ml-auto font-semibold text-[#f8fafc]">{distribution.noProducts}</span>
                </div>
              </div>
            </div>
          )}
        </ChartCard>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              tabs={TABS.map((t) => ({ ...t, count: tabCounts[t.id] }))}
              activeTab={tab}
              onChange={setTab}
            />
            <Input
              placeholder="Search brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!w-48"
            />
            <Btn variant="ghost" size="xs" onClick={() => setSortAsc((s) => !s)}>
              Name: {sortAsc ? "A→Z" : "Z→A"}
            </Btn>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
            <div className="overflow-x-auto">
              <table className="admin-table min-w-full text-left text-sm">
                <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  <tr>
                    <th className="min-w-[200px] px-3 py-3 font-medium">Brand</th>
                    <th className="px-3 py-3 font-medium">Slug</th>
                    <th className="px-3 py-3 font-medium">Products</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263145]/60">
                  {loading ? (
                    <SkeletonRows rows={8} cols={5} />
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center">
                        <p className="text-sm font-medium text-[#f8fafc]">{emptyMessage(tab)}</p>
                        <p className="mt-1 text-xs text-[#8b95a7]">Try another tab or clear the search.</p>
                      </td>
                    </tr>
                  ) : (
                    paged.map((row) => (
                      <tr key={row.id} className="transition hover:bg-[#182238]/60">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <BrandAvatar brand={row} />
                            <span className="truncate font-medium text-[#f8fafc]">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-[#c1c7d0]">{row.slug}</td>
                        <td className="px-3 py-3 tabular-nums text-[#c1c7d0]">{row.productCount ?? 0}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <ActionMenu
                            items={[
                              {
                                label: "View brand",
                                onClick: () => toast?.(`Preview: ${row.name}`),
                              },
                              {
                                label: "Edit brand",
                                onClick: () => {
                                  window.location.href = "/admin/brands/new";
                                },
                              },
                              {
                                label: "Delete brand",
                                onClick: () => setDeleteTarget(row),
                                danger: true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredAll.length > 10 && (
              <div className="flex flex-col gap-3 border-t border-[#263145] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-[#8b95a7]">
                    Show{" "}
                    <span className="mx-1 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                    of {filteredAll.length}
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
