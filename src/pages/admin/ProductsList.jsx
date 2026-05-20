import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  Select,
  Input,
  Btn,
  ConfirmDialog,
  ProductThumbnail,
  Skeleton,
  SkeletonRows,
  useToast,
  formatLkr,
  fmtDate,
} from "../../admin/components/ui";
import { categories as mockCategories, products as mockProducts } from "../../admin/data/mockData";
import { deleteAdminProduct, fetchAdminProducts } from "../../services/adminApi";

const TIP_DISMISS_KEY = "admin.products.tip.dismissed";

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
  { value: "low-stock", label: "Low stock" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "50", label: "50" },
];

const cardIconClass = "h-[18px] w-[18px]";

const mockImageById = Object.fromEntries(
  mockProducts.map((p) => [String(p.id), p.images?.[0] || ""])
);

function resolveProductImage(product) {
  return (
    product.images?.[0] ||
    product.image ||
    mockImageById[String(product.id)] ||
    ""
  );
}

function isLowStock(product) {
  const stock = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 10;
  return stock > 0 && stock <= threshold;
}

function StockBadge({ product }) {
  const stock = product.stock ?? 0;
  if (stock <= 0 || product.isActive === false) {
    return (
      <span className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[#f87171]/15 text-[#f87171]">
        Out of stock
      </span>
    );
  }
  if (isLowStock(product)) {
    return (
      <span className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[#f59e0b]/15 text-[#f59e0b]">
        Low stock
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide bg-[#34d399]/15 text-[#34d399]">
      In stock
    </span>
  );
}

export default function ProductsList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tipDismissed, setTipDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(TIP_DISMISS_KEY) === "1"
  );
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminProducts({ limit: 500 });
      const remoteItems = (res?.items || []).map((p) => ({
        ...p,
        name: p.name || p.title || "Untitled Product",
        image: resolveProductImage(p),
        images: p.images?.length ? p.images : mockImageById[String(p.id)] ? [mockImageById[String(p.id)]] : [],
        stock: p.stock ?? p.stock_qty ?? 0,
        quantity: p.stock ?? p.stock_qty ?? 0,
        sales: p.salesCount || 0,
        lowStockThreshold: p.lowStockThreshold ?? p.low_stock_threshold ?? 10,
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

  const counts = useMemo(() => {
    let inStock = 0;
    let outStock = 0;
    let lowStock = 0;
    items.forEach((p) => {
      const stock = p.stock ?? 0;
      if (stock <= 0 || p.isActive === false) outStock += 1;
      else if (isLowStock(p)) lowStock += 1;
      else inStock += 1;
    });
    return { total: items.length, inStock, outStock, lowStock };
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          String(p.id).toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((p) => p.categoryId === category);
    if (status === "in-stock") list = list.filter((p) => (p.stock ?? 0) > 0 && p.isActive !== false);
    if (status === "out-stock") list = list.filter((p) => (p.stock ?? 0) <= 0 || p.isActive === false);
    if (status === "low-stock") list = list.filter((p) => isLowStock(p) && p.isActive !== false);

    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sortBy === "price-high") list.sort((a, b) => (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0));
    if (sortBy === "price-low") list.sort((a, b) => (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0));
    if (sortBy === "sales") list.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

    return list;
  }, [items, search, category, status, sortBy]);

  const filteredValue = useMemo(
    () => filtered.reduce((sum, p) => sum + (p.salePrice || p.price || 0), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, sortBy, pageSize]);

  const dismissTip = () => {
    setTipDismissed(true);
    try {
      localStorage.setItem(TIP_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const handleDelete = (product) => {
    setConfirmDlg({
      title: "Delete product",
      message: `Delete "${product.name}"? This cannot be undone.`,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteAdminProduct(product.id);
          setItems((prev) => prev.filter((p) => p.id !== product.id));
          toast?.("Product deleted");
        } catch {
          toast?.("Failed to delete product", "error");
        } finally {
          setDeleting(false);
          setConfirmDlg(null);
        }
      },
    });
  };

  const setStatusQuick = useCallback((value) => {
    setStatus((prev) => (prev === value ? "" : value));
  }, []);

  const actionBtnClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#263145] text-[#8b95a7] transition hover:border-[#d8b84f]/50 hover:text-[#d8b84f]";

  const renderProductPrice = (p) => {
    const livePrice = p.salePrice || p.price || 0;
    const hasSale = p.salePrice != null && p.salePrice < (p.price || 0);
    return (
      <>
        <span className="font-semibold tabular-nums text-[#f8fafc]">{formatLkr(livePrice)}</span>
        {hasSale && (
          <span className="ml-1 text-xs tabular-nums text-[#8b95a7] line-through">{formatLkr(p.price)}</span>
        )}
      </>
    );
  };

  const renderProductActions = (p) => (
    <div className="flex gap-1">
      <Link to={`/admin/products/${p.id}/details`} title="View details" className={actionBtnClass}>
        <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
      </Link>
      <Link to={`/admin/products/${p.id}/edit`} title="Edit product" className={actionBtnClass}>
        <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        title="Delete product"
        onClick={() => handleDelete(p)}
        className={`${actionBtnClass} hover:border-[#f87171]/50 hover:text-[#f87171]`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title="All Products"
        subtitle="Manage catalog, stock, and pricing"
        badge={
          <span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">
            {items.length}
          </span>
        }
        actions={
          <div className="rounded-lg border border-[#263145] bg-[#121b2e] px-3 py-2 text-xs">
            <span className="text-[#8b95a7]">Filtered value </span>
            <span className="font-semibold tabular-nums text-[#f8fafc]">{formatLkr(filteredValue)}</span>
          </div>
        }
      />

      <ConfirmDialog
        open={!!confirmDlg}
        title={confirmDlg?.title || ""}
        message={confirmDlg?.message || ""}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDlg?.onConfirm}
        onCancel={() => !deleting && setConfirmDlg(null)}
        busy={deleting}
      />

      {!tipDismissed && (
        <div className="admin-tip flex items-start gap-3 rounded-xl border border-[#d8b84f]/25 bg-[#d8b84f]/10 px-4 py-3 text-sm text-[#8b95a7]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d8b84f]" strokeWidth={2.2} />
          <p className="flex-1">
            Tip: search by product ID or SKU — each product has a unique ID (e.g. P001) for exact matches.
          </p>
          <button
            type="button"
            onClick={dismissTip}
            className="rounded-lg p-1 text-[#8b95a7] transition hover:bg-[#182238] hover:text-[#f8fafc]"
            aria-label="Dismiss tip"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total products"
            value={counts.total}
            icon={<Package className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatus("")}
          />
          <StatCard
            label="In stock"
            value={counts.inStock}
            variant="success"
            icon={<Package className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("in-stock")}
          />
          <StatCard
            label="Out of stock"
            value={counts.outStock}
            variant="danger"
            icon={<Package className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("out-stock")}
          />
          <StatCard
            label="Low stock"
            value={counts.lowStock}
            variant="warning"
            icon={<AlertTriangle className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("low-stock")}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
        <div className="admin-filterbar flex flex-col gap-3 border-b border-[#263145] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-28">
            <Select
              label="Show"
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              options={PAGE_SIZE_OPTIONS}
            />
          </div>
          <span className="hidden pb-2 text-xs text-[#8b95a7] sm:inline">entries per page</span>

          <div className="relative min-w-0 w-full flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a7]" />
            <Input
              className="pl-9"
              placeholder="Name, SKU, or product ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-44">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="w-44">
            <Select
              label="Sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={SORT_OPTIONS}
            />
          </div>

          <Link to="/admin/products/new" className="ml-auto pb-0.5">
            <Btn variant="primary" size="md" className="gap-1.5">
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              Add new
            </Btn>
          </Link>
        </div>

        {/* Mobile: product image, name, price, stock, actions */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-full max-w-[160px]" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </li>
            ))
          ) : paged.length === 0 ? (
            <li className="px-4 py-14 text-center">
              <p className="text-sm font-medium text-[#f8fafc]">No products match your filters</p>
              <p className="mt-1 text-xs text-[#8b95a7]">Try another category or clear the search.</p>
            </li>
          ) : (
            paged.map((p) => (
              <li key={p.id} className="space-y-2 px-4 py-3 transition hover:bg-[#182238]/60">
                <div className="flex gap-3">
                  <ProductThumbnail src={resolveProductImage(p)} alt={p.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#f8fafc]" title={p.name}>
                          {p.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-[#d8b84f]">#{p.id}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StockBadge product={p} />
                        <div className="whitespace-nowrap text-sm">{renderProductPrice(p)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {renderProductActions(p)}
              </li>
            ))
          )}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Product ID</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Units sold</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Start date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading ? (
                <SkeletonRows cols={8} rows={8} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No products match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try another category or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const qty = p.quantity ?? p.stock ?? 0;
                  return (
                    <tr key={p.id} className="transition hover:bg-[#182238]/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail src={resolveProductImage(p)} alt={p.name} size={40} />
                          <p className="max-w-[200px] truncate font-medium text-[#f8fafc]" title={p.name}>
                            {p.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#d8b84f]">
                        #{p.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{renderProductPrice(p)}</td>
                      <td className="px-4 py-3 tabular-nums text-[#f8fafc]">{qty}</td>
                      <td className="px-4 py-3 tabular-nums text-[#8b95a7]">
                        {p.salesCount ?? p.sales ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge product={p} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                        {fmtDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{renderProductActions(p)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
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
