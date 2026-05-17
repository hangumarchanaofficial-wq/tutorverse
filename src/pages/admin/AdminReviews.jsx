import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  deleteAdminReview,
  fetchAdminReviews,
  setAdminReviewApproval,
} from "../../services/adminApi";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "all", label: "All" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "rating-desc", label: "Highest rated" },
  { value: "rating-asc", label: "Lowest rated" },
];

const EMPTY_MESSAGES = {
  pending: "All caught up — no reviews waiting for approval.",
  approved: "No approved reviews yet.",
  all: "No reviews match this filter.",
};

function formatDateTime(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function sentimentColor(rating) {
  if (rating <= 2) return "bg-red-500/15 text-red-400";
  if (rating === 3) return "bg-amber-500/15 text-amber-400";
  return "bg-emerald-500/15 text-emerald-400";
}

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-brand-gold" : "text-white/10"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Initials({ userId }) {
  const letters = `U${userId}`.slice(0, 2).toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-xs font-bold text-brand-gold">
      {letters}
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1]">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400 shadow-2xl backdrop-blur-sm">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

export default function AdminReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "pending";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replies, setReplies] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin-review-replies") || "{}"); } catch { return {}; }
  });
  const [replyDraft, setReplyDraft] = useState({});

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    return fetchAdminReviews({ status, limit: 100 })
      .then((res) => {
        setItems(res.items || []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => setError(e.message || "Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const setStatus = (value) => {
    const next = new URLSearchParams(searchParams);
    next.set("status", value);
    setSearchParams(next);
    setSelected(new Set());
  };

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "date-asc": return new Date(a.created_at) - new Date(b.created_at);
      case "rating-desc": return b.rating - a.rating;
      case "rating-asc": return a.rating - b.rating;
      default: return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const pendingCount = items.filter((r) => !r.is_approved).length;
  const approvedCount = items.filter((r) => r.is_approved).length;
  const avgRating = items.length ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1) : "—";

  const approve = async (row, isApproved) => {
    setSavingId(row.id);
    setError("");
    try {
      const updated = await setAdminReviewApproval(row.id, isApproved);
      setItems((prev) =>
        status === "all"
          ? prev.map((r) => (r.id === row.id ? updated : r))
          : prev.filter((r) => r.id !== row.id)
      );
      setToast(isApproved ? "Review approved" : "Review unapproved");
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkSaving(true);
    setError("");
    try {
      for (const id of selected) {
        await setAdminReviewApproval(id, true);
      }
      setToast(`${selected.size} review${selected.size > 1 ? "s" : ""} approved`);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e.message || "Bulk approve failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      await deleteAdminReview(deleteTarget.id);
      setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setToast("Review deleted");
    } catch (e) {
      setError(e.message || "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const saveReply = (reviewId) => {
    const text = replyDraft[reviewId]?.trim();
    if (!text) return;
    const next = { ...replies, [reviewId]: text };
    setReplies(next);
    localStorage.setItem("admin-review-replies", JSON.stringify(next));
    setReplyDraft((d) => { const n = { ...d }; delete n[reviewId]; return n; });
    setToast("Reply saved");
  };

  const stats = [
    { label: "Total", value: total, color: "text-white" },
    { label: "Pending", value: pendingCount, color: "text-amber-400" },
    { label: "Approved", value: approvedCount, color: "text-emerald-400" },
    { label: "Avg rating", value: avgRating, color: "text-brand-gold" },
  ];

  const SkeletonCards = () =>
    Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-5">
        <div className="flex gap-4">
          <div className="h-9 w-9 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-40 bg-white/[0.06] animate-pulse rounded" />
            <div className="h-3 w-64 bg-white/[0.06] animate-pulse rounded" />
            <div className="h-3 w-32 bg-white/[0.06] animate-pulse rounded" />
          </div>
          <div className="h-10 w-12 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    ));

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete review"
        message="Are you sure? This review will be permanently removed."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Reviews</h1>
          <p className="mt-1 text-sm text-white/40">
            {total} review{total === 1 ? "" : "s"} · viewing <span className="font-semibold text-white/70">{status}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-xs font-medium text-white/40" htmlFor="rev-sort">Sort</label>
            <select
              id="rev-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-2 rounded-xl bg-[#111827] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-white/40" htmlFor="rev-status">Filter</label>
            <select
              id="rev-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="ml-2 rounded-xl bg-[#111827] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
            <p className="text-xs font-medium text-white/40">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
          <span className="text-sm font-medium text-brand-gold">{selected.size} selected</span>
          <button
            onClick={bulkApprove}
            disabled={bulkSaving}
            className="rounded-xl bg-brand-gold px-4 py-1.5 text-xs font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
          >
            {bulkSaving ? "Approving…" : "Approve selected"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-xl bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 border border-white/[0.1] hover:bg-white/[0.1] transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3"><SkeletonCards /></div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111827] py-16 shadow-premium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
            <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white/70">{EMPTY_MESSAGES[status] || EMPTY_MESSAGES.all}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((row) => {
            const isExpanded = expandedId === row.id;
            const comment = row.comment || "";
            const isLong = comment.length > 150;
            const reply = replies[row.id];
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-white/[0.06] bg-[#111827] p-5 shadow-premium transition-colors hover:border-white/[0.1]"
              >
                <div className="flex gap-4">
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="rounded border-white/20 bg-white/[0.05] text-brand-gold focus:ring-brand-gold/30"
                    />
                    <Initials userId={row.user_id} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link to={`/product/${row.product_id}`} className="font-mono font-semibold text-brand-gold hover:underline">
                        Product #{row.product_id}
                      </Link>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40">{formatDateTime(row.created_at)}</span>
                      <span className="text-white/20">·</span>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                          (row.is_approved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")
                        }
                      >
                        {row.is_approved ? "Approved" : "Pending"}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="font-mono text-[11px] text-white/30">user {row.user_id}</span>
                    </div>

                    <div className="mt-2">
                      <StarRating rating={row.rating} />
                    </div>

                    <div className="mt-2">
                      {comment ? (
                        <>
                          <p className="whitespace-pre-wrap text-sm text-white/70">
                            {isLong && !isExpanded ? comment.slice(0, 150) + "…" : comment}
                          </p>
                          {isLong && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : row.id)}
                              className="mt-1 text-xs font-medium text-brand-gold hover:text-brand-gold-light"
                            >
                              {isExpanded ? "Show less" : "Read more"}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm italic text-white/30">(No comment)</p>
                      )}
                    </div>

                    {reply && (
                      <div className="mt-3 rounded-xl border border-brand-gold/10 bg-brand-gold/5 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold/60">Admin reply</p>
                        <p className="mt-1 text-sm text-white/70">{reply}</p>
                      </div>
                    )}

                    {isExpanded && !reply && (
                      <div className="mt-3">
                        <textarea
                          value={replyDraft[row.id] || ""}
                          onChange={(e) => setReplyDraft((d) => ({ ...d, [row.id]: e.target.value }))}
                          placeholder="Write an admin reply…"
                          rows={2}
                          className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
                        />
                        <button
                          onClick={() => saveReply(row.id)}
                          disabled={!replyDraft[row.id]?.trim()}
                          className="mt-2 rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-30 transition-colors"
                        >
                          Save reply
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className={`flex items-center justify-center rounded-xl px-3 py-2 ${sentimentColor(row.rating)}`}>
                      <p className="text-xl font-bold">{row.rating}</p>
                      <p className="ml-0.5 text-[10px] font-semibold opacity-60">/ 5</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {row.is_approved ? (
                        <button
                          type="button"
                          onClick={() => approve(row, false)}
                          disabled={savingId === row.id}
                          className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                        >
                          Unapprove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => approve(row, true)}
                          disabled={savingId === row.id}
                          className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
                        >
                          {savingId === row.id ? "Saving…" : "Approve"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
