import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  Clock,
  MessageSquare,
  Star,
  ThumbsDown,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Tabs,
  Btn,
  BulkActionBar,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  formatNum,
  timeAgo,
  useToast,
} from "../../admin/components/ui";
import { reviews as mockReviews } from "../../admin/data/mockData";
import {
  fetchAdminReviews,
  setAdminReviewApproval,
  deleteAdminReview,
} from "../../services/adminApi";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Rating" },
  { value: "lowest", label: "Lowest Rating" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const cardCls =
  "rounded-xl border bg-[#121b2e] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] transition";

function Stars({ rating, size = 16 }) {
  const color = rating <= 2 ? "#f87171" : rating === 3 ? "#f59e0b" : "#34d399";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={2}
          className={i <= rating ? "" : "text-[#263145]"}
          style={i <= rating ? { color, fill: color } : undefined}
          fill={i <= rating ? color : "#263145"}
        />
      ))}
    </div>
  );
}

function AvatarInitial({ name }) {
  const initial = (name || "?")[0].toUpperCase();
  const hue = name ? (name.charCodeAt(0) * 7) % 360 : 0;
  return (
    <div
      className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: `hsl(${hue}, 45%, 40%)` }}
    >
      {initial}
    </div>
  );
}

export default function ReviewsList() {
  const toast = useToast();
  const [list, setList] = useState(mockReviews);
  const [tab, setTab] = useState("pending");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replies, setReplies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("twoway_review_replies") || "{}");
    } catch {
      return {};
    }
  });
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAdminReviews();
        const arr = Array.isArray(res) ? res : (res?.items || []);
        if (arr.length > 0) setList(arr);
      } catch {
        /* fallback */
      }
    })();
  }, []);

  const pendingCount = list.filter((r) => r.status === "pending").length;
  const approvedCount = list.filter((r) => r.status === "approved").length;

  const kpis = useMemo(() => {
    const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : "0";
    const low = list.filter((r) => r.rating <= 2).length;
    return [
      {
        label: "Average Rating",
        value: avg,
        helpText: `${list.length} review${list.length === 1 ? "" : "s"}`,
        icon: <Star className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Total Reviews",
        value: formatNum(list.length),
        icon: <MessageSquare className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Pending",
        value: formatNum(pendingCount),
        variant: "warning",
        icon: <Clock className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Approved",
        value: formatNum(approvedCount),
        variant: "success",
        icon: <CircleCheck className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Low Ratings (1-2)",
        value: formatNum(low),
        variant: "danger",
        icon: <ThumbsDown className="h-4 w-4" strokeWidth={2} />,
      },
    ];
  }, [list, pendingCount, approvedCount]);

  const tabs = [
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "approved", label: "Approved", count: approvedCount },
    { id: "all", label: "All", count: list.length },
  ];

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const hay = [r.customerName, r.productName, r.comment]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [list, search]);

  const filtered = useMemo(() => {
    let items = tab === "all" ? [...searchFiltered] : searchFiltered.filter((r) => r.status === tab);

    items.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return items;
  }, [searchFiltered, tab, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [tab, sort, search, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async (review) => {
    const next = review.status === "approved" ? "pending" : "approved";
    try {
      await setAdminReviewApproval(review.id, next === "approved");
    } catch {
      /* offline */
    }
    setList((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: next } : r)));
    toast(next === "approved" ? "Review approved" : "Review unapproved");
  };

  // Bulk selection applies to explicitly checked cards (typically on the current page).
  const handleBulkApprove = async () => {
    const ids = [...selected];
    for (const id of ids) {
      try {
        await setAdminReviewApproval(id, true);
      } catch {
        /* offline */
      }
    }
    setList((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: "approved" } : r)));
    setSelected(new Set());
    toast(`${ids.length} reviews approved`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminReview(deleteTarget.id);
    } catch {
      /* offline */
    }
    setList((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(deleteTarget.id);
      return n;
    });
    toast("Review deleted");
    setDeleteTarget(null);
  };

  const saveReply = (reviewId) => {
    if (!replyDraft.trim()) return;
    const next = { ...replies, [reviewId]: replyDraft.trim() };
    setReplies(next);
    localStorage.setItem("twoway_review_replies", JSON.stringify(next));
    toast("Reply saved");
    setReplyOpen(null);
    setReplyDraft("");
  };

  const toggleExpand = (id) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="admin-products-page admin-reviews-page space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Dashboard · Marketing · Reviews"
        badge={
          pendingCount > 0 && (
            <span className="rounded-full bg-[#f59e0b]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f59e0b]">
              {pendingCount} pending
            </span>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {/* Search + Sort */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64 min-w-[10rem]">
          <Input
            placeholder="Search customer, product, comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          label="Sort by"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          options={SORT_OPTIONS}
        />
      </div>

      {/* Bulk Action — selection is per checked card, not all matching filter */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Btn variant="primary" size="xs" onClick={handleBulkApprove}>
          Approve Selected
        </Btn>
      </BulkActionBar>

      {/* Review Cards */}
      {filtered.length === 0 ? (
        <EmptyState title="No reviews" description="No reviews match the current filter." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {paged.map((r) => {
              const isExpanded = expandedComments.has(r.id);
              const isLong = r.comment && r.comment.length > 150;
              const reply = replies[r.id];
              return (
                <div
                  key={r.id}
                  className={`${cardCls} ${selected.has(r.id) ? "border-[#d8b84f]/40" : "border-[#263145]"}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="flex-none cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-[#263145] bg-[#182238]"
                        />
                      </label>
                      <AvatarInitial name={r.customerName} />
                      <div>
                        <p className="text-sm font-semibold text-[#f8fafc]">{r.customerName}</p>
                        <p className="text-[11px] text-[#8b95a7]">{r.productName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Stars rating={r.rating} />
                      <span className="text-[11px] text-[#8b95a7]">{timeAgo(r.createdAt)}</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mt-3">
                    <p className={`text-sm text-[#f8fafc]/90 ${!isExpanded && isLong ? "line-clamp-3" : ""}`}>
                      {r.comment}
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(r.id)}
                        className="mt-1 text-[11px] font-semibold text-[#d8b84f] hover:underline"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>

                  {/* Reply Display */}
                  {reply && (
                    <div className="mt-3 rounded-lg border border-[#263145] bg-[#182238] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                        Admin Reply
                      </p>
                      <p className="mt-1 text-xs text-[#f8fafc]/80">{reply}</p>
                    </div>
                  )}

                  {/* Status + Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge status={r.status} />
                    <div className="flex gap-2">
                      <Btn
                        variant={r.status === "approved" ? "ghost" : "primary"}
                        size="xs"
                        onClick={() => handleApprove(r)}
                      >
                        {r.status === "approved" ? "Unapprove" : "Approve"}
                      </Btn>
                      <Btn
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setReplyOpen(replyOpen === r.id ? null : r.id);
                          setReplyDraft(replies[r.id] || "");
                        }}
                      >
                        Reply
                      </Btn>
                      <Btn variant="danger" size="xs" onClick={() => setDeleteTarget(r)}>
                        Delete
                      </Btn>
                    </div>
                  </div>

                  {/* Reply textarea */}
                  {replyOpen === r.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 focus:border-[#d8b84f]/60 focus:outline-none"
                        placeholder="Write a reply..."
                      />
                      <div className="flex gap-2">
                        <Btn variant="primary" size="xs" onClick={() => saveReply(r.id)}>
                          Save Reply
                        </Btn>
                        <Btn variant="ghost" size="xs" onClick={() => setReplyOpen(null)}>
                          Cancel
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length > 10 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#263145] bg-[#121b2e] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-[#8b95a7]">
                  Show{" "}
                  <span className="mx-1 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                  of {filtered.length}
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
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Review"
        message={`Delete review by "${deleteTarget?.customerName}" for "${deleteTarget?.productName}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
