import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  importAdminProducts,
  patchAdminProduct,
} from "../../services/adminApi";

function formatLkr(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `LKR ${x.toLocaleString()}`;
}

const emptyDraft = {
  title: "",
  description: "",
  category_slug: "",
  brand: "",
  price: "",
  original_price: "",
  discount: "0",
  stock_qty: "0",
  image: "",
  images_json: "",
  is_active: true,
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: false,
};

function fromRow(row) {
  return {
    title: row.title || "",
    description: row.description || "",
    category_slug: row.category_slug || "",
    brand: row.brand || "",
    price: row.price != null ? String(row.price) : "",
    original_price: row.original_price != null ? String(row.original_price) : "",
    discount: row.discount != null ? String(row.discount) : "0",
    stock_qty: row.stock_qty != null ? String(row.stock_qty) : "0",
    image: row.image || "",
    images_json: Array.isArray(row.images_json) ? row.images_json.join("\n") : "",
    is_active: !!row.is_active,
    is_featured: !!row.is_featured,
    is_best_seller: !!row.is_best_seller,
    is_new_arrival: !!row.is_new_arrival,
  };
}

function toPayload(draft, { partial = false } = {}) {
  const payload = {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    category_slug: draft.category_slug.trim() || null,
    brand: draft.brand.trim() || null,
    price: Number(draft.price),
    original_price: draft.original_price.trim() === "" ? null : Number(draft.original_price),
    discount: Number(draft.discount) || 0,
    stock_qty: Number(draft.stock_qty) || 0,
    image: draft.image.trim() || null,
    images_json: draft.images_json
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    is_active: draft.is_active,
    is_featured: draft.is_featured,
    is_best_seller: draft.is_best_seller,
    is_new_arrival: draft.is_new_arrival,
  };
  if (partial && !payload.title) delete payload.title;
  if (partial && Number.isNaN(payload.price)) delete payload.price;
  return payload;
}

function StockBadge({ qty }) {
  const n = Number(qty) || 0;
  if (n === 0)
    return <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">Out</span>;
  if (n <= 5)
    return <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{n}</span>;
  return <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">{n}</span>;
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827]">
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-2.5 w-1/3 rounded bg-white/[0.06] animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-6 w-12 rounded-full bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4 space-y-3">
          <div className="aspect-square w-full rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-white/[0.06] animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-12 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-12 rounded-full bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickStats({ items }) {
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((p) => p.is_active).length;
    const featured = items.filter((p) => p.is_featured).length;
    const lowStock = items.filter((p) => (Number(p.stock_qty) || 0) <= 5).length;
    return { total, active, featured, lowStock };
  }, [items]);

  const cards = [
    { label: "Total Products", value: stats.total, icon: "📦", color: "text-white" },
    { label: "Active", value: stats.active, icon: "✓", color: "text-emerald-400" },
    { label: "Featured", value: stats.featured, icon: "★", color: "text-brand-gold" },
    { label: "Low Stock", value: stats.lowStock, icon: "⚠", color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-white/[0.06] bg-[#111827] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">{c.label}</span>
            <span className="text-sm">{c.icon}</span>
          </div>
          <p className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ProductForm({ draft, setDraft, error, onSubmit, onCancel, submitting, mode }) {
  const change = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const inputCls = "mt-1 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-premium">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/40">
          {mode === "edit" ? "Edit product" : "New product"}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs font-semibold text-white/50 hover:text-white">
            Close
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-white/40">Title *</label>
          <input required value={draft.title} onChange={change("title")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Price (LKR) *</label>
          <input required type="number" min="0" step="0.01" value={draft.price} onChange={change("price")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Original price</label>
          <input type="number" min="0" step="0.01" value={draft.original_price} onChange={change("original_price")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Discount (%)</label>
          <input type="number" min="0" max="100" value={draft.discount} onChange={change("discount")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Stock</label>
          <input type="number" min="0" value={draft.stock_qty} onChange={change("stock_qty")} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Category slug</label>
          <input value={draft.category_slug} onChange={change("category_slug")} placeholder="womens-clothing" className={inputCls + " font-mono"} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Brand</label>
          <input value={draft.brand} onChange={change("brand")} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-white/40">Primary image URL</label>
          <input value={draft.image} onChange={change("image")} className={inputCls} />
          {draft.image && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={draft.image}
                alt="Preview"
                className="h-16 w-16 rounded-lg border border-white/[0.1] object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <span className="text-xs text-white/30">Image preview</span>
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-white/40">Gallery image URLs (one per line)</label>
          <textarea
            rows={3}
            value={draft.images_json}
            onChange={change("images_json")}
            placeholder="https://...\nhttps://..."
            className={inputCls + " font-mono"}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-white/40">Description</label>
          <textarea rows={3} value={draft.description} onChange={change("description")} className={inputCls} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={draft.is_active} onChange={change("is_active")} className="accent-brand-gold" />
          Active (visible on storefront)
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={draft.is_featured} onChange={change("is_featured")} className="accent-brand-gold" />
          Featured on home
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={draft.is_best_seller} onChange={change("is_best_seller")} className="accent-brand-gold" />
          Best seller
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={draft.is_new_arrival} onChange={change("is_new_arrival")} className="accent-brand-gold" />
          New arrival
        </label>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50"
      >
        {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

function ImportPanel({ open, onClose, onImported }) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    let items;
    try {
      const parsed = JSON.parse(text);
      items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) throw new Error("Expected an array of items.");
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
      return;
    }
    setRunning(true);
    try {
      const res = await importAdminProducts(items);
      setResult(res);
      onImported?.();
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-premium-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Bulk import products</h2>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-white/50 hover:text-white">Close</button>
        </div>
        <p className="mt-1 text-xs text-white/40">
          Paste a JSON array (max 500). Each item follows the create-product schema (<code className="text-brand-gold/80">title</code>, <code className="text-brand-gold/80">price</code>, …).
        </p>
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Format hint</p>
          <code className="mt-1 block text-xs text-white/50">[{"{"}"title":"…","price":1990,"category_slug":"…","is_active":true{"}"}]</code>
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='[{"title":"…","price":1990,"category_slug":"…","is_active":true}]'
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 font-mono text-xs text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none"
          />
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
          {result && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white/70">
              <p className="font-semibold text-white">
                Imported {result.inserted ?? 0} of {result.total ?? "—"}
              </p>
              {result.errors?.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-red-400">
                  {result.errors.slice(0, 10).map((er, i) => (
                    <li key={i}>#{er.index}: {er.message}</li>
                  ))}
                  {result.errors.length > 10 && <li>…and {result.errors.length - 10} more</li>}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.1]">Cancel</button>
            <button
              type="submit"
              disabled={running || !text.trim()}
              className="rounded-xl bg-brand-gold px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50"
            >
              {running ? "Importing…" : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCardGrid({ items, selected, onSelect, onTogglePatch, onStartEdit, onRemove }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <div key={p.id} className="group relative rounded-2xl border border-white/[0.06] bg-[#111827] p-4 transition hover:border-white/[0.12]">
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={selected.has(p.id)}
              onChange={() => onSelect(p.id)}
              className="accent-brand-gold h-4 w-4 rounded"
            />
          </div>
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-white/[0.03] mb-3">
            {p.image ? (
              <img src={p.image} alt={p.title} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <div className="flex h-full items-center justify-center text-white/20 text-2xl">📷</div>
            )}
          </div>
          <h3 className="truncate text-sm font-semibold text-white">{p.title}</h3>
          {p.category_slug && <p className="mt-0.5 truncate text-xs text-white/40">{p.category_slug}</p>}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-brand-gold">{formatLkr(p.price)}</span>
            <StockBadge qty={p.stock_qty} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onTogglePatch(p, { is_featured: !p.is_featured })}
              className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                (p.is_featured ? "bg-brand-gold/20 text-brand-gold" : "bg-white/[0.06] text-white/40")}
            >Feat</button>
            <button
              type="button"
              onClick={() => onTogglePatch(p, { is_best_seller: !p.is_best_seller })}
              className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                (p.is_best_seller ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.06] text-white/40")}
            >Best</button>
            <button
              type="button"
              onClick={() => onTogglePatch(p, { is_new_arrival: !p.is_new_arrival })}
              className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                (p.is_new_arrival ? "bg-sky-500/20 text-sky-400" : "bg-white/[0.06] text-white/40")}
            >New</button>
            <button
              type="button"
              onClick={() => onTogglePatch(p, { is_active: !p.is_active })}
              className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                (p.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40")}
            >{p.is_active ? "Active" : "Off"}</button>
          </div>
          <div className="mt-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
            <Link
              to={`/product/${p.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1]"
            >View</Link>
            <button type="button" onClick={() => onStartEdit(p)} className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1]">Edit</button>
            {p.is_active && (
              <button type="button" onClick={() => onRemove(p)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20">Del</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState(emptyDraft);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [showImport, setShowImport] = useState(false);

  const [viewMode, setViewMode] = useState("table");
  const [sortBy, setSortBy] = useState("name");
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    return fetchAdminProducts({
      limit: 100,
      q: q.trim() || undefined,
      is_active: activeFilter === "" ? undefined : activeFilter,
    })
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => setError(e.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, [q, activeFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(t);
  }, [load]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sortBy) {
      case "name": sorted.sort((a, b) => (a.title || "").localeCompare(b.title || "")); break;
      case "price": sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break;
      case "stock": sorted.sort((a, b) => (Number(a.stock_qty) || 0) - (Number(b.stock_qty) || 0)); break;
      case "date": sorted.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      default: break;
    }
    return sorted;
  }, [items, sortBy]);

  const togglePatch = async (row, patch) => {
    try {
      const updated = await patchAdminProduct(row.id, patch);
      setItems((prev) => prev.map((p) => (p.id === row.id ? updated : p)));
    } catch (e) {
      setError(e.message || "Update failed");
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      await createAdminProduct(toPayload(createDraft));
      setCreateDraft(emptyDraft);
      setShowCreate(false);
      await load();
    } catch (err) {
      setCreateError(err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDraft(fromRow(row));
    setEditError("");
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await patchAdminProduct(editingId, toPayload(editDraft, { partial: false }));
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Soft-delete "${row.title}"? It becomes inactive but order history is preserved.`)) return;
    try {
      await deleteAdminProduct(row.id);
      setItems((prev) => prev.map((p) => (p.id === row.id ? { ...p, is_active: false } : p)));
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === sortedItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sortedItems.map((p) => p.id)));
    }
  };

  const bulkAction = async (patch) => {
    const ids = [...selected];
    for (const id of ids) {
      try {
        const updated = await patchAdminProduct(id, patch);
        setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } catch (_) { /* continue */ }
    }
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Products</h1>
          <p className="mt-1 text-sm text-white/40">
            {total} product{total === 1 ? "" : "s"} in catalog
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.1]"
          >
            Bulk import
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate((s) => !s);
              setCreateDraft(emptyDraft);
              setCreateError("");
            }}
            className="rounded-xl bg-brand-gold px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-brand-gold-light"
          >
            {showCreate ? "Close form" : "Add product"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && <QuickStats items={items} />}

      {/* Filters & Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-white/40" htmlFor="prod-q">Search title</label>
          <input
            id="prod-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="mt-1 block w-56 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40" htmlFor="prod-active">Visibility</label>
          <select
            id="prod-active"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="mt-1 block rounded-xl border border-white/[0.1] bg-[#111827] px-3 py-2 text-sm text-white focus:border-brand-gold/60 focus:outline-none"
          >
            <option value="">All</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-white/40" htmlFor="prod-sort">Sort by</label>
          <select
            id="prod-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="mt-1 block rounded-xl border border-white/[0.1] bg-[#111827] px-3 py-2 text-sm text-white focus:border-brand-gold/60 focus:outline-none"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="date">Newest</option>
          </select>
        </div>
        <div className="ml-auto flex items-end gap-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={"rounded-lg px-3 py-2 text-xs font-semibold transition " +
              (viewMode === "table" ? "bg-brand-gold/20 text-brand-gold" : "bg-white/[0.06] text-white/40 hover:text-white/60")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={"rounded-lg px-3 py-2 text-xs font-semibold transition " +
              (viewMode === "grid" ? "bg-brand-gold/20 text-brand-gold" : "bg-white/[0.06] text-white/40 hover:text-white/60")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-gold">{selected.size} selected</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => bulkAction({ is_active: true })} className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25">Activate</button>
            <button type="button" onClick={() => bulkAction({ is_active: false })} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/[0.1]">Deactivate</button>
            <button type="button" onClick={() => bulkAction({ is_featured: true })} className="rounded-lg bg-brand-gold/15 px-3 py-1.5 text-xs font-semibold text-brand-gold hover:bg-brand-gold/25">Feature</button>
            <button type="button" onClick={() => bulkAction({ is_featured: false })} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/[0.1]">Unfeature</button>
            <button type="button" onClick={() => bulkAction({ is_best_seller: true })} className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/25">Best Seller</button>
            <button type="button" onClick={() => bulkAction({ is_new_arrival: true })} className="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/25">New Arrival</button>
          </div>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-white/40 hover:text-white/70">Clear</button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <ProductForm
          draft={createDraft}
          setDraft={setCreateDraft}
          error={createError}
          submitting={creating}
          onSubmit={submitCreate}
          onCancel={() => setShowCreate(false)}
          mode="create"
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        viewMode === "table" ? <SkeletonTable /> : <SkeletonGrid />
      ) : viewMode === "grid" ? (
        <ProductCardGrid
          items={sortedItems}
          selected={selected}
          onSelect={toggleSelect}
          onTogglePatch={togglePatch}
          onStartEdit={startEdit}
          onRemove={remove}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selected.size === sortedItems.length && sortedItems.length > 0} onChange={selectAll} className="accent-brand-gold" />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-white/40">No products match.</td>
                  </tr>
                ) : (
                  sortedItems.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-brand-gold" />
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt="" className="h-9 w-9 rounded-lg border border-white/[0.1] object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/20 text-xs">📷</div>
                          )}
                          <div>
                            <span className="font-medium text-white">{p.title}</span>
                            {p.category_slug && (
                              <span className="mt-0.5 block text-xs text-white/40">{p.category_slug}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/70">{formatLkr(p.price)}</td>
                      <td className="px-4 py-3"><StockBadge qty={p.stock_qty} /></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            title="Toggle featured"
                            onClick={() => togglePatch(p, { is_featured: !p.is_featured })}
                            className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                              (p.is_featured ? "bg-brand-gold/20 text-brand-gold" : "bg-white/[0.06] text-white/40")}
                          >Feat</button>
                          <button
                            type="button"
                            title="Toggle best seller"
                            onClick={() => togglePatch(p, { is_best_seller: !p.is_best_seller })}
                            className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                              (p.is_best_seller ? "bg-rose-500/20 text-rose-400" : "bg-white/[0.06] text-white/40")}
                          >Best</button>
                          <button
                            type="button"
                            title="Toggle new arrival"
                            onClick={() => togglePatch(p, { is_new_arrival: !p.is_new_arrival })}
                            className={"rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                              (p.is_new_arrival ? "bg-sky-500/20 text-sky-400" : "bg-white/[0.06] text-white/40")}
                          >New</button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => togglePatch(p, { is_active: !p.is_active })}
                          className={"rounded-full px-2.5 py-1 text-xs font-semibold " +
                            (p.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/40")}
                        >
                          {p.is_active ? "Active" : "Off"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/product/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1]"
                          >View</Link>
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1]"
                          >Edit</button>
                          {p.is_active && (
                            <button
                              type="button"
                              onClick={() => remove(p)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                            >Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-black/60 backdrop-blur-sm px-4 py-10">
          <div className="w-full max-w-3xl">
            <ProductForm
              draft={editDraft}
              setDraft={setEditDraft}
              error={editError}
              submitting={savingEdit}
              onSubmit={submitEdit}
              onCancel={() => setEditingId(null)}
              mode="edit"
            />
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportPanel
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => load()}
      />
    </div>
  );
}
