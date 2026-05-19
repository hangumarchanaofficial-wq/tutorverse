import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAdminOrders } from "../../services/adminApi";
import {
  Download, Search, X, MoreVertical,
  ShoppingBag, Clock, CircleCheck, Settings2, Archive,
  Truck, PackageCheck, XCircle, RotateCcw, Layers,
} from "lucide-react";

/* ─── Icon map per status (v2) ─────────────────── */
const STATUS_ICONS = {
  all:        ShoppingBag,
  placed:     Layers,
  pending:    Clock,
  confirmed:  CircleCheck,
  processing: Settings2,
  packed:     Archive,
  shipped:    Truck,
  delivered:  PackageCheck,
  completed:  PackageCheck,
  cancelled:  XCircle,
  refunded:   RotateCcw,
};

/* ─── helpers ─────────────────────────────────── */
function formatLkr(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `LKR ${x.toLocaleString()}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

/* ─── Theme hook ───────────────────────────────── */
function useAdminTheme() {
  const [theme, setTheme] = useState(
    () => (typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-admin-theme") || "light"
      : "light")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setTheme(el.getAttribute("data-admin-theme") || "light")
    );
    obs.observe(el, { attributes: true, attributeFilter: ["data-admin-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/* ─── Status / payment palettes ────────────────── */
const STATUS_PAL = {
  light: {
    placed:      { bg: "#f0f9ff", text: "#0369a1",  dot: "#38bdf8" },
    pending:     { bg: "#fffbeb", text: "#92400e",  dot: "#f59e0b" },
    confirmed:   { bg: "#f0fdf4", text: "#065f46",  dot: "#34d399" },
    processing:  { bg: "#eef2ff", text: "#3730a3",  dot: "#818cf8" },
    packed:      { bg: "#fdf4ff", text: "#7e22ce",  dot: "#c084fc" },
    shipped:     { bg: "#fff7ed", text: "#c2410c",  dot: "#fb923c" },
    delivered:   { bg: "#f0fdf4", text: "#14532d",  dot: "#22c55e" },
    completed:   { bg: "#f0fdf4", text: "#14532d",  dot: "#22c55e" },
    cancelled:   { bg: "#fff1f2", text: "#9f1239",  dot: "#f43f5e" },
    refunded:    { bg: "#f8fafc", text: "#475467",  dot: "#94a3b8" },
  },
  dark: {
    placed:      { bg: "rgba(56,189,248,0.12)",  text: "#38bdf8",  dot: "#38bdf8" },
    pending:     { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24",  dot: "#fbbf24" },
    confirmed:   { bg: "rgba(52,211,153,0.12)",  text: "#34d399",  dot: "#34d399" },
    processing:  { bg: "rgba(129,140,248,0.12)", text: "#818cf8",  dot: "#818cf8" },
    packed:      { bg: "rgba(192,132,252,0.12)", text: "#c084fc",  dot: "#c084fc" },
    shipped:     { bg: "rgba(251,146,60,0.12)",  text: "#fb923c",  dot: "#fb923c" },
    delivered:   { bg: "rgba(34,197,94,0.12)",   text: "#4ade80",  dot: "#4ade80" },
    completed:   { bg: "rgba(34,197,94,0.12)",   text: "#4ade80",  dot: "#4ade80" },
    cancelled:   { bg: "rgba(244,63,94,0.12)",   text: "#fb7185",  dot: "#fb7185" },
    refunded:    { bg: "rgba(148,163,184,0.12)", text: "#94a3b8",  dot: "#94a3b8" },
  },
};

const PAY_PAL = {
  light: {
    paid:    { bg: "#f0fdf4", text: "#065f46" },
    pending: { bg: "#fffbeb", text: "#92400e" },
    failed:  { bg: "#fff1f2", text: "#9f1239" },
    refunded:{ bg: "#f8fafc", text: "#475467" },
  },
  dark: {
    paid:    { bg: "rgba(52,211,153,0.12)",  text: "#34d399" },
    pending: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
    failed:  { bg: "rgba(244,63,94,0.12)",   text: "#fb7185" },
    refunded:{ bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
  },
};

/* Pipeline stages */
const PIPELINE = ["placed", "confirmed", "processing", "packed", "shipped", "delivered"];

const ALL_STATUSES = ["placed", "pending", "confirmed", "processing", "packed", "shipped", "delivered", "completed", "cancelled", "refunded"];
const PER_PAGE = 10;

/* ─── Sub-components ───────────────────────────── */
function StatusPill({ status, palette }) {
  const key = String(status || "").toLowerCase();
  const p = palette[key] || { bg: "transparent", text: "#94a3b8", dot: "#94a3b8" };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: p.bg, color: p.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.dot }} />
      {status || "—"}
    </span>
  );
}

function PaymentPill({ status, palette }) {
  const key = String(status || "").toLowerCase();
  const p = palette[key] || { bg: "transparent", text: "#94a3b8" };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: p.bg, color: p.text }}>
      {status || "—"}
    </span>
  );
}

function SortIcon({ dir }) {
  if (!dir) return <span className="ml-1 opacity-20">↕</span>;
  return <span className="ml-1 text-orange-500">{dir === "asc" ? "↑" : "↓"}</span>;
}

function Skeleton({ w = "w-24", h = "h-4" }) {
  return <span className={`inline-block animate-pulse rounded-md bg-[#e5e7eb] ${w} ${h}`} />;
}

export default function AdminOrders() {
  const theme = useAdminTheme();
  const isDark = theme === "dark";

  const sPal  = STATUS_PAL[isDark ? "dark" : "light"];
  const pyPal = PAY_PAL[isDark ? "dark" : "light"];

  const card   = isDark ? "#0d0d0d" : "#ffffff";
  const border = isDark ? "#1e1e1e" : "#eceff3";
  const sub    = isDark ? "#ffffff1a" : "#f8fafc";
  const text1  = isDark ? "#f1f5f9"  : "#0b1220";
  const text2  = isDark ? "#94a3b8"  : "#667085";
  const text3  = isDark ? "#64748b"  : "#9ca3af";
  const dividerClr = isDark ? "#1e1e1e" : "#f3f4f6";
  const hoverRow   = isDark ? "#141414" : "#f8fafc";

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusFilter = searchParams.get("status") || "";

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [payFilter, setPayFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [sortCol,  setSortCol]  = useState("created_at");
  const [sortDir,  setSortDir]  = useState("desc");
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [csvCopied, setCsvCopied] = useState(false);
  const [hoverRow_id, setHoverRow] = useState(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setError("");
    fetchAdminOrders({ limit: 500, status: statusFilter || undefined })
      .then((res) => {
        if (!on) return;
        setItems(res.items || []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => { if (on) setError(e.message || "Failed to load orders"); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [statusFilter]);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo, statusFilter, payFilter, methodFilter]);

  const setStatus = (v) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set("status", v); else next.delete("status");
    setSearchParams(next);
  };

  /* Status counts for the stat strip */
  const statusCounts = useMemo(() => {
    const counts = { all: items.length };
    for (const o of items) {
      const s = String(o.status || "").toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [items]);

  /* Unique payment methods */
  const payMethods = useMemo(() => {
    const set = new Set();
    for (const o of items) if (o.payment_method) set.add(o.payment_method.toUpperCase());
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        (o.order_number || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_email || "").toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      list = list.filter((o) => new Date(o.created_at).getTime() < to);
    }
    if (payFilter) {
      list = list.filter((o) => String(o.payment_status || "").toLowerCase() === payFilter);
    }
    if (methodFilter) {
      list = list.filter((o) => (o.payment_method || "").toUpperCase() === methodFilter);
    }
    return list;
  }, [items, search, dateFrom, dateTo, payFilter, methodFilter]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "total_amount") { va = Number(va) || 0; vb = Number(vb) || 0; }
      else if (sortCol === "created_at") { va = new Date(va).getTime() || 0; vb = new Date(vb).getTime() || 0; }
      else { va = String(va || "").toLowerCase(); vb = String(vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalRevenue = useMemo(
    () => filtered.reduce((s, o) => s + (Number(o.total_amount) || 0), 0),
    [filtered]
  );

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    setSelected(selected.size === paged.length ? new Set() : new Set(paged.map((o) => o.id)));
  };

  const activePipelineIndex = PIPELINE.reduce(
    (last, stage, i) => (statusCounts[stage] ? i : last),
    -1
  );
  const pipelineProgress = activePipelineIndex <= 0
    ? 0
    : Math.round((activePipelineIndex / (PIPELINE.length - 1)) * 100);

  const exportCsv = () => {
    const headers = ["Order", "Customer", "Email", "Date", "Total", "Method", "Payment", "Status"];
    const rows = sorted.map((o) => [
      o.order_number, o.customer_name, o.customer_email,
      formatDate(o.created_at), o.total_amount,
      o.payment_method, o.payment_status, o.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); a.remove();
    setCsvCopied(true); setTimeout(() => setCsvCopied(false), 2000);
  };

  const hasFilters = search || dateFrom || dateTo || payFilter || methodFilter;

  const Th = ({ col, children, cls = "" }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition ${cls}`}
      style={{ color: text3 }}
    >
      {children}
      <SortIcon dir={sortCol === col ? sortDir : ""} />
    </th>
  );

  const PaginationControls = () => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous transactions"
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6",
          border: `1px solid ${border}`,
          color: text1,
        }}
      >
        &lt;
      </button>
      <span className="text-xs font-semibold tabular-nums" style={{ color: text3 }}>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        aria-label="Next transactions"
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6",
          border: `1px solid ${border}`,
          color: text1,
        }}
      >
        &gt;
      </button>
    </div>
  );

  return (
    <div className="space-y-6 py-6 px-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: text1 }}>
            Orders
            <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold"
              style={{ backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#fff7ed", color: "#f97316" }}>
              {total}
            </span>
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: text2 }}>
            Manage and track all customer orders
            {statusFilter && <> · <span style={{ color: "#f97316" }}>{statusFilter}</span></>}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition"
          style={{
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            color: text1,
            border: `1px solid ${border}`,
          }}
        >
          <Download className="h-4 w-4" style={{ color: "#f97316" }} />
          {csvCopied ? "Exported!" : "Export CSV"}
        </button>
      </div>

      {/* ── Status stat strip ── */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {[{ key: "all", label: "All Orders" },
          ...ALL_STATUSES.map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
        ].filter(({ key }) => key === "all" || statusCounts[key])
         .map(({ key, label }) => {
          const count  = key === "all" ? statusCounts.all : (statusCounts[key] || 0);
          const active = key === "all" ? !statusFilter : statusFilter === key;
          const pal    = sPal[key] || { bg: isDark ? "rgba(249,115,22,0.12)" : "#fff7ed", dot: "#f97316", text: text2 };
          const Icon   = STATUS_ICONS[key] || ShoppingBag;

          /* icon tile: active → orange tint, else use the status colour as tinted bg */
          const iconBg  = active
            ? (isDark ? "rgba(249,115,22,0.22)" : "#fff7ed")
            : (isDark ? pal.bg : "#f3f4f6");
          const iconClr = active ? "#f97316" : pal.dot;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key === "all" ? "" : key)}
              className="shrink-0 rounded-2xl px-4 py-3.5 text-left transition group"
              style={{
                backgroundColor: active
                  ? (isDark ? "rgba(249,115,22,0.08)" : "#fffbf5")
                  : (isDark ? "#0d0d0d" : "#ffffff"),
                border: `1px solid ${active
                  ? (isDark ? "rgba(249,115,22,0.35)" : "#fed7aa")
                  : border}`,
                boxShadow: active
                  ? "none"
                  : isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
                minWidth: 110,
              }}
            >
              {/* icon tile */}
              <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: iconBg }}>
                <Icon size={18} style={{ color: iconClr }} strokeWidth={2} />
              </div>

              {/* label */}
              <p className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: active ? "#f97316" : text3 }}>
                {label}
              </p>

              {/* count */}
              <p className="mt-0.5 text-2xl font-bold tabular-nums leading-none"
                style={{ color: active ? "#f97316" : text1 }}>
                {loading ? "—" : count}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Pipeline track ── */}
      {!loading && items.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl px-6 py-5"
          style={{
            backgroundColor: card,
            border: `1px solid ${border}`,
            boxShadow: isDark ? "0 18px 50px rgba(0,0,0,0.28)" : "0 14px 40px rgba(15,23,42,0.05)",
          }}>
          <style>{`
            @keyframes twowayPipelineShimmer {
              0% { transform: translateX(-120%); opacity: 0; }
              20% { opacity: .75; }
              100% { transform: translateX(120%); opacity: 0; }
            }
            @keyframes twowayPipelinePulse {
              0%, 100% { transform: scale(.96); opacity: .38; }
              50% { transform: scale(1.08); opacity: .9; }
            }
          `}</style>
          <div className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? "radial-gradient(circle at 50% 0%, rgba(216,184,79,0.12), transparent 38%)"
                : "linear-gradient(135deg, rgba(255,247,237,0.75), rgba(255,255,255,0) 42%), radial-gradient(circle at 50% 0%, rgba(249,115,22,0.08), transparent 38%)",
            }}
          />
          <div className="relative mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: text3 }}>
              Order Pipeline
            </p>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: isDark ? "rgba(216,184,79,0.12)" : "#fff7ed",
                color: isDark ? "#d8b84f" : "#f97316",
              }}>
              Live Flow
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-8 right-8 top-6 h-1.5 overflow-hidden rounded-full"
              style={{
                backgroundColor: isDark ? "#070b14" : "#e5e7eb",
                boxShadow: isDark ? "inset 0 1px 2px rgba(0,0,0,0.5)" : "inset 0 1px 2px rgba(15,23,42,0.08)",
              }}>
              <div
                className="relative h-full rounded-full transition-[width] duration-1000 ease-out"
                style={{
                  width: `${pipelineProgress}%`,
                  background: isDark
                    ? "linear-gradient(90deg, #d8b84f, #34d399, #22d3ee)"
                    : "linear-gradient(90deg, #f97316, #34d399, #06b6d4)",
                }}
              >
                <span className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  style={{ animation: "twowayPipelineShimmer 2.4s ease-in-out infinite" }} />
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {PIPELINE.map((stage, i) => {
              const count = statusCounts[stage] || 0;
              const p = sPal[stage] || {};
              const Icon = STATUS_ICONS[stage] || ShoppingBag;
              const active = count > 0;
              const isLatest = i === activePipelineIndex;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStatus(statusFilter === stage ? "" : stage)}
                  className="group flex flex-col items-center gap-2 text-center transition"
                >
                  <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl border transition duration-300 group-hover:-translate-y-0.5"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: active
                        ? (isDark ? p.bg : "#ffffff")
                        : (isDark ? "#111827" : "#ffffff"),
                      color: active ? p.dot : text3,
                      borderColor: active ? `${p.dot}66` : (isDark ? "#263145" : "#e5e7eb"),
                      boxShadow: active
                        ? `0 14px 34px ${p.dot}26, inset 0 1px 0 rgba(255,255,255,0.7)`
                        : isDark ? "none" : "0 8px 20px rgba(15,23,42,0.05)",
                    }}>
                    {active && (
                      <span className="absolute inset-[-7px] rounded-[1.35rem] border"
                        style={{
                          borderColor: `${p.dot}30`,
                          backgroundColor: `${p.dot}12`,
                          animation: isLatest ? "twowayPipelinePulse 1.9s ease-in-out infinite" : undefined,
                        }}
                      />
                    )}
                    <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 56 56" aria-hidden="true">
                      <path
                        d="M10 19c0-4.97 4.03-9 9-9h18c4.97 0 9 4.03 9 9v18c0 4.97-4.03 9-9 9H19c-4.97 0-9-4.03-9-9V19Z"
                        fill={active ? `${p.dot}18` : isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.04)"}
                      />
                    </svg>
                    <Icon className="relative h-5 w-5" strokeWidth={2.25} />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-bold tabular-nums"
                      style={{
                        backgroundColor: active ? p.dot : (isDark ? "#1e293b" : "#f8fafc"),
                        borderColor: card,
                        color: active ? "#fff" : text3,
                      }}>
                      {count}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: active ? (isLatest ? p.dot : text1) : text3 }}>
                    {stage}
                  </span>
                  <span className="text-[10px]" style={{ color: text3 }}>
                    {count > 0 ? `${count} orders` : "No orders"}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl px-5 py-4"
        style={{ backgroundColor: card, border: `1px solid ${border}` }}>
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: text3 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number or customer…"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm transition focus:outline-none"
              style={{
                backgroundColor: isDark ? "#111111" : "#f8fafc",
                border: `1px solid ${border}`,
                color: text1,
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl py-2.5 px-3 text-sm transition focus:outline-none appearance-none cursor-pointer"
            style={{ backgroundColor: isDark ? "#111111" : "#f8fafc", border: `1px solid ${border}`, color: text1, minWidth: 140 }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Payment */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>Payment</label>
          <select
            value={payFilter}
            onChange={(e) => setPayFilter(e.target.value)}
            className="rounded-xl py-2.5 px-3 text-sm transition focus:outline-none appearance-none cursor-pointer"
            style={{ backgroundColor: isDark ? "#111111" : "#f8fafc", border: `1px solid ${border}`, color: text1, minWidth: 140 }}
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Method */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>Method</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl py-2.5 px-3 text-sm transition focus:outline-none appearance-none cursor-pointer"
            style={{ backgroundColor: isDark ? "#111111" : "#f8fafc", border: `1px solid ${border}`, color: text1, minWidth: 140 }}
          >
            <option value="">All Methods</option>
            {payMethods.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl py-2.5 px-3 text-sm focus:outline-none"
            style={{ backgroundColor: isDark ? "#111111" : "#f8fafc", border: `1px solid ${border}`, color: text1, colorScheme: isDark ? "dark" : "light" }} />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: text3 }}>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl py-2.5 px-3 text-sm focus:outline-none"
            style={{ backgroundColor: isDark ? "#111111" : "#f8fafc", border: `1px solid ${border}`, color: text1, colorScheme: isDark ? "dark" : "light" }} />
        </div>

        {hasFilters && (
          <button type="button"
            onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setPayFilter(""); setMethodFilter(""); }}
            className="inline-flex items-center gap-1.5 rounded-xl py-2.5 px-3 text-sm font-medium transition hover:opacity-80"
            style={{ backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6", color: text2, border: `1px solid ${border}` }}>
            <X className="h-3.5 w-3.5" />Clear
          </button>
        )}
      </div>

      {/* ── Summary row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm" style={{ color: text2 }}>
          {loading ? "Loading…" : (
            <>Showing <span className="font-semibold" style={{ color: text1 }}>
              {sorted.length === 0 ? 0 : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, sorted.length)}`}
            </span> of <span className="font-semibold" style={{ color: text1 }}>{sorted.length}</span> orders
              {sorted.length !== total && <> of {total}</>}
              {" · "}Revenue <span className="font-semibold" style={{ color: text1 }}>{formatLkr(totalRevenue)}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {selected.size > 0 && (
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{ backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <span className="text-sm font-semibold" style={{ color: "#f97316" }}>{selected.size} selected</span>
              <button type="button" onClick={() => setSelected(new Set())}
                className="text-xs font-medium hover:underline" style={{ color: text3 }}>
                Clear
              </button>
            </div>
          )}
          {!loading && sorted.length > 0 && <PaginationControls />}
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: card, border: `1px solid ${border}`, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ borderBottom: `1px solid ${dividerClr}`, backgroundColor: sub }}>
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                    style={{ accentColor: "#f97316" }}
                  />
                </th>
                <Th col="order_number">Order</Th>
                <Th col="customer_name">Customer</Th>
                <Th col="created_at">Date</Th>
                <Th col="total_amount" cls="text-right">Total</Th>
                <Th col="payment_method">Method</Th>
                <Th col="payment_status">Payment</Th>
                <Th col="status">Status</Th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: text3 }}>Age</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${dividerClr}` }}>
                    <td className="px-4 py-3.5"><Skeleton w="w-4" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-24" /></td>
                    <td className="px-4 py-3.5">
                      <Skeleton w="w-32" />
                      <Skeleton w="w-24 mt-1" h="h-3" />
                    </td>
                    <td className="px-4 py-3.5"><Skeleton w="w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton w="w-14" /></td>
                    <td className="px-4 py-3.5" />
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: isDark ? "#111111" : "#f3f4f6" }}>
                      <ShoppingBag className="h-7 w-7" style={{ color: text3 }} />
                    </div>
                    <p className="mt-4 text-base font-semibold" style={{ color: text1 }}>No orders found</p>
                    <p className="mt-1 text-sm" style={{ color: text2 }}>Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                paged.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                    onMouseEnter={() => setHoverRow(o.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    style={{
                      borderBottom: `1px solid ${dividerClr}`,
                      backgroundColor: hoverRow_id === o.id ? hoverRow : "transparent",
                      cursor: "pointer",
                      transition: "background-color 120ms ease",
                    }}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded"
                        style={{ accentColor: "#f97316" }}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold" style={{ color: "#f97316" }}>
                        {o.order_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <p className="truncate text-sm font-medium" style={{ color: text1 }}>{o.customer_name || "—"}</p>
                      <p className="truncate text-[11px]" style={{ color: text3 }}>{o.customer_email || ""}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm" style={{ color: text2 }}>
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: text1 }}>
                        {formatLkr(o.total_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: text2 }}>
                        {o.payment_method || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PaymentPill status={o.payment_status} palette={pyPal} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={o.status} palette={sPal} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs" style={{ color: text3 }}>
                      {timeAgo(o.created_at)}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
                        style={{ backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6" }}>
                        <MoreVertical className="h-3.5 w-3.5" style={{ color: text3 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && sorted.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderTop: `1px solid ${dividerClr}` }}>

            {/* left: record range */}
            <p className="text-sm" style={{ color: text3 }}>
              <span className="font-semibold tabular-nums" style={{ color: text1 }}>
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)}
              </span>
              {" "}of{" "}
              <span className="font-semibold" style={{ color: text1 }}>{sorted.length}</span>
              {" "}orders
            </p>

            {/* right: arrow + page pills + arrow */}
            <div className="flex items-center gap-2">

              <button
                type="button"
                aria-label="Previous transactions"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6",
                  border: `1px solid ${border}`,
                  color: text1,
                }}
              >
                &lt;
              </button>

              {/* page pills */}
              <div className="flex items-center gap-1">
                {(() => {
                  const delta = 2;
                  const pages = [];
                  for (let p = 1; p <= totalPages; p++) {
                    if (
                      p === 1 || p === totalPages ||
                      (p >= page - delta && p <= page + delta)
                    ) pages.push(p);
                  }
                  const result = [];
                  let prev = 0;
                  for (const p of pages) {
                    if (prev && p - prev > 1) {
                      result.push(
                        <span key={`gap-${p}`} className="px-1 text-sm" style={{ color: text3 }}>…</span>
                      );
                    }
                    result.push(
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className="flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm font-semibold transition"
                        style={{
                          backgroundColor: p === page ? "#f97316" : "transparent",
                          color: p === page ? "#fff" : text2,
                          border: p === page ? "1px solid #f97316" : "1px solid transparent",
                        }}
                      >
                        {p}
                      </button>
                    );
                    prev = p;
                  }
                  return result;
                })()}
              </div>

              <button
                type="button"
                aria-label="Next transactions"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  backgroundColor: isDark ? "#1a1a1a" : "#f3f4f6",
                  border: `1px solid ${border}`,
                  color: text1,
                }}
              >
                &gt;
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
