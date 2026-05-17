import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchAdminOrders } from "../../services/adminApi";

const STATUS_OPTIONS = ["", "pending", "processing", "completed", "cancelled"];
const PER_PAGE = 20;

function formatLkr(n, { compact = false } = {}) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  if (compact && Math.abs(x) >= 1000) {
    if (Math.abs(x) >= 1_000_000) return `LKR ${(x / 1_000_000).toFixed(1)}M`;
    return `LKR ${(x / 1000).toFixed(1)}k`;
  }
  return `LKR ${x.toLocaleString()}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Skeleton({ className = "h-4 w-24" }) {
  return <span className={`inline-block animate-pulse rounded-md bg-white/[0.06] ${className}`} />;
}

const STATUS_PILL = {
  pending: "bg-amber-500/15 text-amber-400",
  processing: "bg-indigo-500/15 text-indigo-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-400",
};

const PAYMENT_PILL = {
  paid: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-amber-500/15 text-amber-400",
  failed: "bg-rose-500/15 text-rose-400",
};

function StatusPill({ status }) {
  const cls = STATUS_PILL[String(status).toLowerCase()] || "bg-white/[0.06] text-white/60";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function PaymentPill({ status }) {
  const cls = PAYMENT_PILL[String(status).toLowerCase()] || "bg-white/[0.06] text-white/60";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

function SortIcon({ dir }) {
  if (!dir) return <span className="ml-1 text-white/20">↕</span>;
  return <span className="ml-1 text-brand-gold">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusFilter = searchParams.get("status") || "";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [csvCopied, setCsvCopied] = useState(false);

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
      .catch((e) => {
        if (on) setError(e.message || "Failed to load orders");
      })
      .finally(() => {
        if (on) setLoading(false);
      });
    return () => { on = false; };
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, statusFilter]);

  const setStatus = (v) => {
    const next = new URLSearchParams(searchParams);
    if (v) next.set("status", v);
    else next.delete("status");
    setSearchParams(next);
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.order_number || "").toLowerCase().includes(q) ||
          (o.customer_name || "").toLowerCase().includes(q)
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
    return list;
  }, [items, search, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      let va = a[sortCol];
      let vb = b[sortCol];
      if (sortCol === "total_amount") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else if (sortCol === "created_at") {
        va = new Date(va).getTime() || 0;
        vb = new Date(vb).getTime() || 0;
      } else {
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalRevenue = useMemo(() => {
    return filtered.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  }, [filtered]);

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? "" : "asc"));
      if (sortDir === "desc") setSortCol("");
    } else {
      setSortCol(col);
      setSortDir("asc");
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

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((o) => o.id)));
    }
  };

  const exportCsv = () => {
    const headers = ["Order Number", "Customer", "Email", "Total", "Status", "Payment Status", "Payment Method", "Date"];
    const rows = sorted.map((o) => [
      o.order_number,
      o.customer_name,
      o.customer_email,
      o.total_amount,
      o.status,
      o.payment_status,
      o.payment_method,
      o.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCsvCopied(true);
    setTimeout(() => setCsvCopied(false), 2000);
  };

  const thClass = "px-4 py-3 text-left cursor-pointer select-none transition hover:text-white/70";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">Management</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-white">Orders</h1>
          <p className="mt-1 text-sm text-white/50">
            {total} order{total === 1 ? "" : "s"} total
            {statusFilter ? <> · filtered: <span className="text-brand-gold">{statusFilter}</span></> : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-brand-gold-light"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {csvCopied ? "Exported!" : "Export CSV"}
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111827] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/10">
            <svg className="h-5 w-5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Showing</p>
            <p className="font-display text-lg font-bold tabular-nums text-white">{sorted.length} orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111827] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Revenue</p>
            <p className="font-display text-lg font-bold tabular-nums text-white">{formatLkr(totalRevenue, { compact: true })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Search</label>
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order number or customer name…"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] py-2 pl-10 pr-3 text-sm text-white placeholder-white/30 transition focus:border-brand-gold focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-white transition focus:border-brand-gold focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-white transition focus:border-brand-gold focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-white/40">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-sm text-white transition focus:border-brand-gold focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || "all"} value={s} className="bg-[#111827] text-white">
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}
              </option>
            ))}
          </select>
        </div>
        {(search || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
            className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/[0.1] hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
          <span className="text-sm font-medium text-brand-gold">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-1.5 text-sm text-white focus:border-brand-gold focus:outline-none"
          >
            <option value="" className="bg-[#111827]">Update status to…</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s} className="bg-[#111827]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {bulkStatus && (
            <button
              type="button"
              onClick={() => {
                alert(`Would update ${selected.size} orders to "${bulkStatus}" (API not yet wired)`);
                setSelected(new Set());
                setBulkStatus("");
              }}
              className="rounded-lg bg-brand-gold px-3 py-1.5 text-xs font-semibold text-navy-950 transition hover:bg-brand-gold-light"
            >
              Apply
            </button>
          )}
          <button
            type="button"
            onClick={() => { setSelected(new Set()); setBulkStatus(""); }}
            className="ml-auto text-xs font-medium text-white/50 hover:text-white"
          >
            Deselect all
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111827] px-6 py-16 text-center shadow-premium">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
            <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">No orders found</h3>
          <p className="mt-1 text-sm text-white/50">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selected.size === paged.length}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-white/[0.05] text-brand-gold focus:ring-brand-gold"
                    />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("order_number")}>
                    Order <SortIcon dir={sortCol === "order_number" ? sortDir : ""} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("customer_name")}>
                    Customer <SortIcon dir={sortCol === "customer_name" ? sortDir : ""} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("total_amount")}>
                    Total <SortIcon dir={sortCol === "total_amount" ? sortDir : ""} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("status")}>
                    Status <SortIcon dir={sortCol === "status" ? sortDir : ""} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("payment_status")}>
                    Payment <SortIcon dir={sortCol === "payment_status" ? sortDir : ""} />
                  </th>
                  <th className={thClass} onClick={() => toggleSort("created_at")}>
                    Date <SortIcon dir={sortCol === "created_at" ? sortDir : ""} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {paged.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/admin/orders/${o.id}`)}
                    className="cursor-pointer transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded border-white/20 bg-white/[0.05] text-brand-gold focus:ring-brand-gold"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-brand-gold">{o.order_number}</span>
                      <span className="ml-2 text-[11px] text-white/30">#{o.id}</span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">
                      <span className="text-sm font-medium text-white">{o.customer_name}</span>
                      <span className="block truncate text-[11px] text-white/40">{o.customer_email}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold tabular-nums text-white">{formatLkr(o.total_amount)}</td>
                    <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-4 py-3"><PaymentPill status={o.payment_status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-white/40">{formatDate(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <p className="text-xs text-white/40">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="px-3 text-xs tabular-nums text-white/60">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
