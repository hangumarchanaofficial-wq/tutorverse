import React, { useEffect, useMemo, useState } from "react";
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
import { PageHeader, Input, Select, Btn, ConfirmDialog, useToast } from "../../admin/components/ui";
import { MOCK_ATTRIBUTES, SHOP_CATEGORY_LABEL } from "../../admin/data/mockAttributes";

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const SHOP_CATEGORY_OPTIONS = Object.entries(SHOP_CATEGORY_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "default", label: "Sort by (Default)" },
  { value: "category-asc", label: "Category (A–Z)" },
  { value: "category-desc", label: "Category (Z–A)" },
];

export default function AttributesList() {
  const toast = useToast();
  const [items, setItems] = useState(MOCK_ATTRIBUTES);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredAll = useMemo(() => {
    let out = items;
    const q = search.toLowerCase().trim();
    if (q) {
      out = out.filter(
        (a) => a.category.toLowerCase().includes(q) || a.value.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      out = out.filter((a) => a.shopCategory === categoryFilter);
    }
    if (statusFilter === "active") out = out.filter((a) => a.status === "active");
    if (statusFilter === "inactive") out = out.filter((a) => a.status === "inactive");

    if (sortBy === "category-asc") out = [...out].sort((a, b) => a.category.localeCompare(b.category));
    if (sortBy === "category-desc") out = [...out].sort((a, b) => b.category.localeCompare(a.category));
    return out;
  }, [items, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAll.length / pageSize));
  const paged = filteredAll.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    toast?.("Attribute removed");
    setDeleteTarget(null);
  };

  return (
    <div className="admin-products-page space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete attribute"
        message={`Remove "${deleteTarget?.category}"? Linked product values may need a cleanup pass.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <PageHeader
        title="All Attributes"
        subtitle="Dashboard · Attributes"
        actions={
          <Link to="/admin/attributes/new">
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

          <div className="w-44">
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={SHOP_CATEGORY_OPTIONS}
            />
          </div>

          <div className="w-36">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>

          <div className="w-44">
            <Select label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No attributes match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try another category or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={row.id} className="transition">
                    <td className="px-4 py-3 font-medium text-[#f8fafc]">{row.category}</td>
                    <td className="max-w-xl px-4 py-3 text-[#c1c7d0]">{row.value}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toast?.(`Preview: ${row.category}`)}
                          className="rounded-lg p-1.5 text-[#d8b84f] transition hover:bg-[#182238]"
                          aria-label={`View ${row.category}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                        <Link
                          to="/admin/attributes/new"
                          className="rounded-lg p-1.5 text-[#34d399] transition hover:bg-[#182238]"
                          aria-label={`Edit ${row.category}`}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.2} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="rounded-lg p-1.5 text-[#f87171] transition hover:bg-[#182238]"
                          aria-label={`Delete ${row.category}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAll.length > 10 && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <span className="text-xs font-medium text-[#8b95a7]">
              Show data{" "}
              <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
              of {filteredAll.length}
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
