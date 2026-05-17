import React, { useCallback, useEffect, useState } from "react";
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  patchAdminCategory,
} from "../../services/adminApi";

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const COLOR_OPTIONS = [
  "#C8A951", "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1",
];

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400 shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-4">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", slug: "" });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryColors, setCategoryColors] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cat-colors") || "{}"); } catch { return {}; }
  });

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    return fetchAdminCategories()
      .then((res) => setItems(res.items || []))
      .catch((e) => setError(e.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const persistColor = (id, color) => {
    const next = { ...categoryColors, [id]: color };
    setCategoryColors(next);
    localStorage.setItem("cat-colors", JSON.stringify(next));
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createAdminCategory({
        name: draft.name.trim(),
        slug: (draft.slug.trim() || slugify(draft.name)).slice(0, 160),
      });
      setDraft({ name: "", slug: "" });
      setToast("Category created successfully");
      await load();
    } catch (err) {
      setError(err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row) => {
    setEditing((prev) => ({ ...prev, [row.id]: { name: row.name, slug: row.slug } }));
  };

  const cancelEdit = (id) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveEdit = async (id) => {
    const draftRow = editing[id];
    if (!draftRow) return;
    setSavingId(id);
    setError("");
    try {
      const updated = await patchAdminCategory(id, {
        name: draftRow.name.trim(),
        slug: (draftRow.slug.trim() || slugify(draftRow.name)).slice(0, 160),
      });
      setItems((prev) => prev.map((c) => (c.id === id ? updated : c)));
      cancelEdit(id);
      setToast("Category updated");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      await deleteAdminCategory(deleteTarget.id);
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setToast("Category deleted");
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const SkeletonRows = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <tr key={i}>
        <td className="px-4 py-3"><div className="h-4 w-6 bg-white/[0.06] animate-pulse rounded" /></td>
        <td className="px-4 py-3"><div className="h-4 w-4 rounded-full bg-white/[0.06] animate-pulse" /></td>
        <td className="px-4 py-3"><div className="h-4 w-32 bg-white/[0.06] animate-pulse rounded" /></td>
        <td className="px-4 py-3"><div className="h-4 w-28 bg-white/[0.06] animate-pulse rounded" /></td>
        <td className="px-4 py-3"><div className="h-4 w-8 bg-white/[0.06] animate-pulse rounded" /></td>
        <td className="px-4 py-3"><div className="h-4 w-24 bg-white/[0.06] animate-pulse rounded ml-auto" /></td>
      </tr>
    ));

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? Products linked by this slug will keep their slug string.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-white">Categories</h1>
            <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/40">
            Slugs power public catalogue URLs and the navigation menu. Names are user-facing.
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30 sm:w-64"
          />
        </div>
      </div>

      <form
        onSubmit={submitCreate}
        className="grid gap-3 rounded-2xl border border-white/[0.06] bg-[#111827] p-5 shadow-premium sm:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <label className="text-xs font-medium text-white/40">Name</label>
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Women's Clothing"
            className="mt-1 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Slug (auto if blank)</label>
          <input
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            placeholder="womens-clothing"
            pattern="[a-z0-9-]+"
            className="mt-1 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="self-end rounded-xl bg-brand-gold px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
        >
          {creating ? "Adding…" : "Add category"}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3 w-12">ID</th>
                <th className="px-4 py-3 w-10">
                  <span className="sr-only">Color</span>
                </th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
                        <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/70">No categories yet</p>
                        <p className="mt-1 text-xs text-white/40">Create your first category using the form above</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/40 text-sm">
                    No categories match "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const draftRow = editing[row.id];
                  const isEditing = Boolean(draftRow);
                  const color = categoryColors[row.id] || COLOR_OPTIONS[0];
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white/40">{row.id}</td>
                      <td className="px-4 py-3">
                        <div className="relative group">
                          <button
                            type="button"
                            className="h-5 w-5 rounded-full border-2 border-white/10 transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            title="Pick color"
                          />
                          <div className="invisible group-hover:visible absolute left-0 top-8 z-20 flex gap-1 rounded-xl border border-white/[0.1] bg-[#0a0f1a] p-2 shadow-2xl">
                            {COLOR_OPTIONS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => persistColor(row.id, c)}
                                className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-125"
                                style={{
                                  backgroundColor: c,
                                  borderColor: c === color ? "white" : "transparent",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            value={draftRow.name}
                            onChange={(e) =>
                              setEditing((prev) => ({ ...prev, [row.id]: { ...draftRow, name: e.target.value } }))
                            }
                            className="w-full rounded-lg bg-white/[0.05] border border-white/[0.1] px-2 py-1 text-sm text-white focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                          />
                        ) : (
                          <span className="font-medium text-white">{row.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/50">
                        {isEditing ? (
                          <input
                            value={draftRow.slug}
                            onChange={(e) =>
                              setEditing((prev) => ({ ...prev, [row.id]: { ...draftRow, slug: e.target.value } }))
                            }
                            pattern="[a-z0-9-]+"
                            className="w-full rounded-lg bg-white/[0.05] border border-white/[0.1] px-2 py-1 text-xs text-white focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                          />
                        ) : (
                          row.slug
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/30">—</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit(row.id)}
                                disabled={savingId === row.id}
                                className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
                              >
                                {savingId === row.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelEdit(row.id)}
                                className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(row)}
                                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
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
