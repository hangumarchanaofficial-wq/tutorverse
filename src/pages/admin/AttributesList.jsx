import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfirmDialog, useToast } from "../../admin/components/ui";

/** Rows aligned with Dataflow-style “All Attributes” mock */
const MOCK_ATTRIBUTES = [
  { id: "ATTR-1", category: "Color", value: "Blue, green, white", shopCategory: "fashion", status: "active" },
  { id: "ATTR-2", category: "Size", value: "S, M, L, XL, XXL", shopCategory: "fashion", status: "active" },
  { id: "ATTR-3", category: "Material", value: "Cotton, Polyster", shopCategory: "fashion", status: "active" },
  { id: "ATTR-4", category: "Style", value: "Classic, modern, ethnic, western", shopCategory: "fashion", status: "active" },
  { id: "ATTR-5", category: "Meat Type", value: "Fresh, Frozen, Marinated", shopCategory: "grocery", status: "active" },
  { id: "ATTR-6", category: "Weight", value: "1kg, 2kg, 3kg, over 5kg", shopCategory: "grocery", status: "active" },
  { id: "ATTR-7", category: "Brand", value: "Local, Imported", shopCategory: "fashion", status: "active" },
  { id: "ATTR-8", category: "Occasion", value: "Casual, Formal, Festive", shopCategory: "fashion", status: "inactive" },
  { id: "ATTR-9", category: "Pack size", value: "Single, Bundle, Family", shopCategory: "grocery", status: "active" },
  { id: "ATTR-10", category: "Storage", value: "Chilled, Frozen, Ambient", shopCategory: "grocery", status: "active" },
  { id: "ATTR-11", category: "Pattern", value: "Solid, Striped, Printed", shopCategory: "fashion", status: "active" },
  { id: "ATTR-12", category: "Fit", value: "Slim, Regular, Relaxed", shopCategory: "fashion", status: "active" },
  { id: "ATTR-13", category: "Sleeve", value: "Sleeveless, Short, Long", shopCategory: "fashion", status: "active" },
  { id: "ATTR-14", category: "Origin", value: "LK, IN, CN", shopCategory: "home", status: "active" },
  { id: "ATTR-15", category: "Warranty", value: "6 months, 1 year, 2 years", shopCategory: "electronics", status: "active" },
  { id: "ATTR-16", category: "Voltage", value: "110V, 220V", shopCategory: "electronics", status: "inactive" },
  { id: "ATTR-17", category: "Fragrance", value: "Mild, Strong, Unscented", shopCategory: "beauty", status: "active" },
  { id: "ATTR-18", category: "SPF", value: "15, 30, 50", shopCategory: "beauty", status: "active" },
  { id: "ATTR-19", category: "Roast", value: "Light, Medium, Dark", shopCategory: "grocery", status: "active" },
  { id: "ATTR-20", category: "Grind", value: "Whole bean, Fine, Coarse", shopCategory: "grocery", status: "active" },
  { id: "ATTR-21", category: "Capacity", value: "500ml, 1L, 2L", shopCategory: "home", status: "active" },
  { id: "ATTR-22", category: "Finish", value: "Matte, Gloss, Natural", shopCategory: "home", status: "active" },
];

const SHOP_CATEGORY_LABEL = {
  all: "All Categories",
  fashion: "Fashion",
  grocery: "Grocery",
  home: "Home & Living",
  electronics: "Electronics",
  beauty: "Beauty",
};

export default function AttributesList() {
  const toast = useToast();
  const [items, setItems] = useState(MOCK_ATTRIBUTES);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredAll = useMemo(() => {
    let out = items;
    const q = search.toLowerCase().trim();
    if (q) {
      out = out.filter(
        (a) =>
          a.category.toLowerCase().includes(q) ||
          a.value.toLowerCase().includes(q)
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

  const total = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const filtered = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAll.slice(start, start + pageSize);
  }, [filteredAll, currentPage, pageSize]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    toast?.("Attribute removed");
    setDeleteTarget(null);
  };

  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  const pageButtons = useMemo(() => {
    const cur = currentPage;
    const windowSize = 3;
    let start = Math.max(1, cur - 1);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-5 admin-products-page">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete attribute"
        message={`Remove "${deleteTarget?.category}"? Linked product values may need a cleanup pass.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">All Attributes</h1>
        <p className="text-xs text-[#98a2b3] sm:text-right">
          Dashboard &gt; Attributes &gt; All Attributes
        </p>
      </div>

      <div className="admin-panel overflow-hidden rounded-2xl border border-[#1f232b] bg-[#06070a]">
        <div className="admin-filterbar flex flex-wrap items-center gap-3 border-b border-[#1f232b] bg-[#0b0d12] px-4 py-3.5">
          <div className="flex items-center gap-2 text-xs text-[#98a2b3]">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-[#2a303c] bg-[#12141a] px-2 text-xs text-[#e5e7eb] outline-none"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="relative min-w-[200px] flex-1 basis-[200px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#98a2b3]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search here..."
              className="h-9 w-full rounded-md border border-[#2a303c] bg-[#12141a] pl-9 pr-3 text-sm text-[#e5e7eb] placeholder:text-[#7f8795] outline-none focus:border-[#fe7a2f]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#2a303c] bg-[#12141a] px-3 text-xs text-[#e5e7eb] outline-none"
          >
            {Object.entries(SHOP_CATEGORY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#2a303c] bg-[#12141a] px-3 text-xs text-[#e5e7eb] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-[#2a303c] bg-[#12141a] px-3 text-xs text-[#e5e7eb] outline-none"
          >
            <option value="default">Sort by (Default)</option>
            <option value="category-asc">Category (A–Z)</option>
            <option value="category-desc">Category (Z–A)</option>
          </select>

          <Link
            to="/admin/attributes/new"
            className="inline-flex h-9 items-center rounded-md bg-[#fe7a2f] px-4 text-xs font-semibold text-white hover:bg-[#f97316]"
          >
            + Add new
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="bg-[#090b10] text-[11px] font-semibold text-[#98a2b3]">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-16 text-center text-[#98a2b3]">
                    No attributes match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f232b] transition-colors odd:bg-[#06070a] even:bg-[#111319] hover:bg-[#141822]"
                  >
                    <td className="px-4 py-3 font-medium text-[#f8fafc]">{row.category}</td>
                    <td className="max-w-xl px-4 py-3 text-[#c1c7d0]">{row.value}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toast?.(`Preview: ${row.category}`)}
                          className="text-[#f59e0b] hover:text-[#fbbf24]"
                          aria-label={`View ${row.category}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          to="/admin/attributes/new"
                          className="text-[#22c55e] hover:text-[#4ade80]"
                          aria-label={`Edit ${row.category}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="text-[#ef4444] hover:text-[#f87171]"
                          aria-label={`Delete ${row.category}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-[#1f232b] bg-[#0b0d12] px-4 py-3 text-xs text-[#98a2b3] sm:flex-row sm:items-center">
          <span>
            {total === 0
              ? "Showing 0 entries"
              : `Showing ${from}–${to} of ${total} entries`}
          </span>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-[#1a1d26] disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageButtons.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-full text-xs font-semibold ${
                  n === currentPage
                    ? "bg-[#fe7a2f] text-white"
                    : "text-[#98a2b3] hover:bg-[#1a1d26] hover:text-[#e5e7eb]"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#e5e7eb] hover:bg-[#1a1d26] disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
