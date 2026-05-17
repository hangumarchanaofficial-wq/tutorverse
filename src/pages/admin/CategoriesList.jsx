import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfirmDialog, SkeletonRows, useToast } from "../../admin/components/ui";
import { categories as mockCategories, products as mockProducts } from "../../admin/data/mockData";
import { deleteAdminCategory, fetchAdminCategories } from "../../services/adminApi";

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=140&h=140&fit=crop&auto=format";

function fmtDateShort(iso) {
  if (!iso) return "20 Nov 2023";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "20 Nov 2023";
  }
}

export default function CategoriesList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showing, setShowing] = useState(10);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCategories();
      const arr = res.items || [];
      setItems(arr.length > 0 ? arr : mockCategories.map((c) => ({
        ...c,
        createdAt: c.createdAt || new Date().toISOString(),
      })));
    } catch {
      setItems(mockCategories.map((c) => ({
        ...c,
        createdAt: c.createdAt || new Date().toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      const thumb = products[0]?.images?.[0] || FALLBACK_THUMB;
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
    return out.slice(0, showing);
  }, [rows, search, showing, sortBy, status]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCategory(deleteTarget.id);
    } catch { /* continue */ }
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast?.("Category deleted");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5 admin-products-page">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? Products linked to this category will keep their slug.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-end justify-between">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">All Category</h1>
        <p className="text-xs text-[#98a2b3]">Dashboard &gt; Category &gt; All Category</p>
      </div>

      <div className="admin-panel overflow-hidden rounded-2xl border border-[#1f232b] bg-[#06070a]">
        <div className="admin-filterbar flex flex-wrap items-center gap-3 border-b border-[#1f232b] bg-[#0b0d12] px-4 py-3.5">
          <div className="flex items-center gap-2 text-xs text-[#98a2b3]">
            <span>Showing</span>
            <select
              value={showing}
              onChange={(e) => setShowing(Number(e.target.value))}
              className="h-8 rounded-md border border-[#2a303c] bg-[#12141a] px-2 text-xs text-[#e5e7eb] outline-none"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#98a2b3]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here..."
              className="h-9 w-full rounded-md border border-[#2a303c] bg-[#12141a] pl-9 pr-3 text-sm text-[#e5e7eb] placeholder:text-[#7f8795] outline-none focus:border-[#fe7a2f]"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border border-[#2a303c] bg-[#12141a] px-3 text-xs text-[#e5e7eb] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Has products</option>
            <option value="empty">Empty</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border border-[#2a303c] bg-[#12141a] px-3 text-xs text-[#e5e7eb] outline-none"
          >
            <option value="default">Sort by (Default)</option>
            <option value="name">Sort by Name</option>
            <option value="sale">Sort by Sale</option>
          </select>

          <Link
            to="/admin/categories/new"
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
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Sale</th>
                <th className="px-4 py-3 font-medium">Start date</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={7} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-[#8b95a7]">
                    No categories match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  return (
                    <tr key={row.id} className="border-b border-[#1f232b] transition-colors odd:bg-[#06070a] even:bg-[#111319] hover:bg-[#141822]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.thumb}
                            alt=""
                            className="h-9 w-9 rounded-md border border-[#2a303c] object-cover"
                            onError={(e) => { e.currentTarget.src = FALLBACK_THUMB; }}
                          />
                          <span className="font-medium text-[#f8fafc]">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[#e5e7eb] tabular-nums">
                        {(row.quantity || 1638).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-[#e5e7eb] tabular-nums">
                        {row.sale || 20}
                      </td>
                      <td className="px-4 py-2.5 text-[#c1c7d0]">{fmtDateShort(row.date)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toast?.(`Viewing ${row.name}`)}
                            className="text-[#f59e0b] hover:text-[#fbbf24]"
                            aria-label={`View ${row.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            to="/admin/categories/new"
                            className="text-[#22c55e] hover:text-[#4ade80]"
                            aria-label={`Edit ${row.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="text-[#ef4444] hover:text-[#f87171]"
                            aria-label={`Delete ${row.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
