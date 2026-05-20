import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PageHeader,
  Input,
  Select,
  Btn,
  ConfirmDialog,
  ProductThumbnail,
  Skeleton,
  SkeletonRows,
  useToast,
} from "../../admin/components/ui";
import { products as mockProducts } from "../../admin/data/mockData";
import { resolveProductImageUrl } from "../../lib/productImage";
import { loadCategoriesWithFallback } from "../../admin/utils/categories";
import { deleteAdminCategory } from "../../services/adminApi";

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Has products" },
  { value: "empty", label: "Empty" },
];

const SORT_OPTIONS = [
  { value: "default", label: "Sort by (Default)" },
  { value: "name", label: "Sort by Name" },
  { value: "sale", label: "Sort by Sale" },
];

function fmtDateShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function CategoriesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadCategoriesWithFallback();
      setItems(
        list.map((c) => ({
          ...c,
          createdAt: c.createdAt || new Date().toISOString(),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const mapByCategory = new Map();
    mockProducts.forEach((p) => {
      const arr = mapByCategory.get(p.categoryId) || [];
      arr.push(p);
      mapByCategory.set(p.categoryId, arr);
    });

    return items.map((c) => {
      const products = mapByCategory.get(c.id) || [];
      const quantity = products.reduce((acc, p) => acc + (p.stock || 0), 0);
      const sale = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
      const date = c.createdAt || products[0]?.createdAt;
      const thumb = products[0]?.images?.[0] || "";
      return { ...c, quantity, sale, date, thumb };
    });
  }, [items]);

  const filtered = useMemo(() => {
    let out = rows;
    const q = search.toLowerCase();
    if (q) {
      out = out.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    }
    if (status === "active") out = out.filter((c) => (c.productCount || 0) > 0);
    if (status === "empty") out = out.filter((c) => (c.productCount || 0) === 0);

    if (sortBy === "name") {
      out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sale") {
      out = [...out].sort((a, b) => b.sale - a.sale);
    }
    return out;
  }, [rows, search, sortBy, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, status, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCategory(deleteTarget.id);
    } catch {
      /* continue */
    }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast?.("Category deleted");
    setDeleteTarget(null);
  };

  const renderCategoryActions = (row) => (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => toast?.(`Viewing ${row.name}`)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#263145] text-[#d8b84f] transition hover:border-[#d8b84f]/50 hover:bg-[#182238]"
        aria-label={`View ${row.name}`}
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
      <Link
        to="/admin/categories/new"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#263145] text-[#34d399] transition hover:border-[#34d399]/50 hover:bg-[#182238]"
        aria-label={`Edit ${row.name}`}
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        onClick={() => setDeleteTarget(row)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#263145] text-[#f87171] transition hover:border-[#f87171]/50 hover:bg-[#182238]"
        aria-label={`Delete ${row.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );

  return (
    <div className="admin-products-page space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Products linked to this category will keep their slug.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title="All Category"
        subtitle="Dashboard · Category"
        actions={
          <Link to="/admin/categories/new">
            <Btn variant="primary" size="md" className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Add new
            </Btn>
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
        <div className="admin-filterbar flex flex-col gap-3 border-b border-[#263145] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-28">
            <Select
              label="Show"
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              options={SHOW_OPTIONS}
            />
          </div>
          <span className="hidden pb-2 text-xs text-[#8b95a7] sm:inline">entries</span>

          <div className="relative min-w-0 w-full flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a7]" />
            <Input
              className="pl-9"
              placeholder="Search here…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
          </div>

          <div className="w-44">
            <Select label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
          </div>
        </div>

        {/* Mobile: category image, name, product count, actions */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading ? (
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-[104px] shrink-0 rounded-lg" />
              </li>
            ))
          ) : filtered.length === 0 ? (
            <li className="px-4 py-14 text-center">
              <p className="text-sm font-medium text-[#f8fafc]">No categories match your filters</p>
              <p className="mt-1 text-xs text-[#8b95a7]">Try another status or clear the search.</p>
            </li>
          ) : (
            paged.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#182238]/60"
              >
                <ProductThumbnail src={resolveProductImageUrl(row.thumb)} alt={row.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#f8fafc]" title={row.name}>
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8b95a7]">
                    {row.productCount ?? 0} product{(row.productCount ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 self-center">{renderCategoryActions(row)}</div>
              </li>
            ))
          )}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Start date</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading ? (
                <SkeletonRows rows={7} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No categories match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try another status or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="transition hover:bg-[#182238]/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail src={resolveProductImageUrl(row.thumb)} alt={row.name} size={40} />
                        <p className="font-medium text-[#f8fafc]" title={row.name}>
                          {row.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[#e5e7eb]">{(row.quantity || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 tabular-nums text-[#e5e7eb]">{row.sale || 0}</td>
                    <td className="px-4 py-3 text-[#c1c7d0]">{fmtDateShort(row.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">{renderCategoryActions(row)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > pageSize && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <span className="text-xs font-medium text-[#8b95a7]">
              Show data{" "}
              <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
              of {filtered.length}
            </span>
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
