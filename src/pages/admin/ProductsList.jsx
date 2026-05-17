import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categories as mockCategories, products as mockProducts } from "../../admin/data/mockData";
import { deleteAdminProduct, fetchAdminProducts, patchAdminProduct } from "../../services/adminApi";

const SORT_OPTIONS = [
  { value: "default", label: "Sort by (Default)" },
  { value: "newest", label: "Newest" },
  { value: "price-high", label: "Price High" },
  { value: "price-low", label: "Price Low" },
  { value: "sales", label: "Top Sales" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "in-stock", label: "In stock" },
  { value: "out-stock", label: "Out of stock" },
];

const ENTRY_OPTIONS = [10, 20, 30, 50];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US").format(value || 0);

const formatDate = (dateLike) => {
  const d = new Date(dateLike || Date.now());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const fallback = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop&auto=format";
  return (
    <img
      src={!failed && src ? src : fallback}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-md object-cover ring-1 ring-[#eef0f2]"
    />
  );
}

const iconBtn = "rounded-full p-2 transition hover:bg-[#f6f7f8] hover:shadow-sm";

export default function ProductsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminProducts({ limit: 500 });
      const remoteItems = (res?.items || []).map((p) => ({
        ...p,
        name: p.name || p.title || "Untitled Product",
        image: p.images?.[0] || p.image || "",
        stock: p.stock ?? p.stock_qty ?? 0,
        quantity: p.stock ?? p.stock_qty ?? 0,
        sales: p.salesCount || 0,
      }));
      setItems(remoteItems.length ? remoteItems : mockProducts);
    } catch {
      setItems(mockProducts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(
    () => [{ value: "", label: "All Categories" }, ...mockCategories.map((c) => ({ value: c.id, label: c.name }))],
    []
  );

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.id?.toString().toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((p) => p.categoryId === category);
    if (status === "in-stock") list = list.filter((p) => (p.stock ?? 0) > 0);
    if (status === "out-stock") list = list.filter((p) => (p.stock ?? 0) <= 0);

    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sortBy === "price-high") list.sort((a, b) => (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0));
    if (sortBy === "price-low") list.sort((a, b) => (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0));
    if (sortBy === "sales") list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    return list;
  }, [items, search, category, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, sortBy, pageSize]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await deleteAdminProduct(product.id);
    } catch {
      // Keep UI responsive even if backend deletion fails
    }
    setItems((prev) => prev.filter((p) => p.id !== product.id));
  };

  const handleToggleActive = async (product) => {
    const patch = { isActive: !product.isActive };
    try {
      await patchAdminProduct(product.id, patch);
    } catch {
      // Proceed with local state for smoother UX
    }
    setItems((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...patch } : p)));
  };

  return (
    <div className="admin-products-page space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#101828]">All Products</h1>
        </div>
        <p className="text-xs text-[#98a2b3]">Dashboard &gt; Product &gt; All products</p>
      </div>

      <div className="admin-tip flex items-center gap-2 rounded-lg border border-[#f0e8dd] bg-[#fffaf5] px-4 py-2.5 text-sm text-[#667085]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#f59e0b]" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
          <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.72 3h16.96a2 2 0 0 0 1.72-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        </svg>
        <span>Tip search by Product ID: Each product is provided with a unique ID, which you can rely on to find the exact product you need.</span>
      </div>

      <div className="admin-panel overflow-hidden rounded-2xl border border-[#edf0f2] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_20px_rgba(16,24,40,0.03)]">
        <div className="admin-filterbar flex flex-wrap items-center gap-2 border-b border-[#f1f3f5] bg-[#ffffff] px-5 py-4">
          <span className="text-sm text-[#98a2b3]">Showing</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 rounded-md border border-[#ebeef1] bg-white px-2 text-sm text-[#4b5563] outline-none focus:border-[#d0d5dd]"
          >
            {ENTRY_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="mr-2 text-sm text-[#98a2b3]">entries</span>

          <div className="relative min-w-[240px] flex-1 sm:max-w-[320px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here..."
              className="h-9 w-full rounded-md border border-[#ebeef1] bg-white pl-3 pr-9 text-sm text-[#374151] outline-none placeholder:text-[#b4bac5] focus:border-[#d0d5dd]"
            />
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="6" />
            </svg>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-[#ebeef1] bg-white px-2 text-sm text-[#4b5563] outline-none focus:border-[#d0d5dd]"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border border-[#ebeef1] bg-white px-2 text-sm text-[#4b5563] outline-none focus:border-[#d0d5dd]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border border-[#ebeef1] bg-white px-2 text-sm text-[#4b5563] outline-none focus:border-[#d0d5dd]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <Link
            to="/admin/products/new"
            className="ml-auto inline-flex h-9 items-center rounded-md bg-[#fb923c] px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition hover:-translate-y-[0.5px] hover:bg-[#f97316]"
          >
            + Add new
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left">
            <thead className="border-b border-[#f2f4f6] bg-[#fbfcfd] text-xs font-semibold text-[#8c94a3]">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Product ID</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Sale</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Start date</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#9ca3af]">Loading products...</td>
                </tr>
              )}
              {!loading && paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#9ca3af]">No products found.</td>
                </tr>
              )}
              {!loading && paged.map((p) => {
                const livePrice = p.salePrice || p.price || 0;
                const qty = p.quantity ?? p.stock ?? 0;
                const stock = p.stock ?? 0;
                const inStock = stock > 0 && p.isActive !== false;
                return (
                  <tr key={p.id} className="text-[15px] text-[#344054] transition-colors hover:bg-[#fafbfc]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <ProductImage src={p.image || p.images?.[0]} alt={p.name} />
                        <p className="font-medium text-[#111827]">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#98a2b3]">#{String(p.id).slice(0, 7)}</td>
                    <td className="px-5 py-3.5 font-medium text-[#344054]">{formatMoney(livePrice)}</td>
                    <td className="px-5 py-3.5">{formatCompactNumber(qty)}</td>
                    <td className="px-5 py-3.5">{formatCompactNumber(p.salesCount || p.sales || 0)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-sm px-2 py-1 text-xs font-medium ${inStock ? "bg-[#ecfdf3] text-[#16a34a]" : "bg-[#fff1f2] text-[#ef4444]"}`}>
                        {inStock ? "In stock" : "Out of stock"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#98a2b3]">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className={iconBtn}
                          title="View"
                          onClick={() => window.open(`/product/${p.id}`, "_blank")}
                        >
                          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] text-[#f59e0b]" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                            <circle cx="12" cy="12" r="2.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          title={p.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleActive(p)}
                        >
                          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] text-[#22c55e]" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          title="Delete"
                          onClick={() => handleDelete(p)}
                        >
                          <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] text-[#ef4444]" fill="none" stroke="currentColor" strokeWidth="1.9">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M6 6l1 14h10l1-14" />
                            <path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#f1f3f5] px-4 py-3">
            <p className="text-xs text-[#9aa1ad]">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 rounded-md border border-[#e5e7eb] px-2 text-xs text-[#6b7280] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(page - 2, 0), Math.max(page + 1, 3)).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-md text-xs ${p === page ? "bg-[#fb923c] text-white" : "border border-[#e5e7eb] text-[#6b7280]"}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 rounded-md border border-[#e5e7eb] px-2 text-xs text-[#6b7280] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
