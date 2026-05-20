import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleX,
  Clock,
  CreditCard,
  Download,
  RotateCcw,
  Wallet,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  ChartCard,
  MiniDonut,
  MiniBarChart,
  Select,
  Input,
  Btn,
  ActionMenu,
  useToast,
  EmptyState,
  Skeleton,
  formatLkr,
  fmtDate,
} from "../../admin/components/ui";
import { fetchAdminPayments, updateAdminPayment } from "../../services/adminApi";
import { loadMockPayments } from "../../admin/utils/payments";

const METHOD_COLORS = {
  PAYHERE: "#d8b84f",
  STRIPE: "#a78bfa",
  COD: "#60a5fa",
  BANK: "#34d399",
  OTHER: "#8b95a7",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "succeeded", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "initiated", label: "Initiated" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "canceled", label: "Canceled" },
];

const METHOD_OPTIONS = [
  { value: "all", label: "All Methods" },
  { value: "payhere", label: "PAYHERE" },
  { value: "stripe", label: "STRIPE" },
  { value: "cod", label: "COD" },
  { value: "bank", label: "BANK" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const STATUS_LABEL = {
  succeeded: "PAID",
  pending: "PENDING",
  initiated: "INITIATED",
  failed: "FAILED",
  refunded: "REFUNDED",
  canceled: "CANCELED",
};

export default function PaymentsList() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [actionPendingId, setActionPendingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { limit: 200 };
    if (statusFilter !== "all") params.status = statusFilter;
    if (methodFilter !== "all") params.method = methodFilter;
    if (search.trim()) params.q = search.trim();

    try {
      const res = await fetchAdminPayments(params);
      setItems(res?.items || []);
      setTotal(res?.total ?? (res?.items?.length || 0));
      setUsingMock(false);
    } catch {
      const mock = loadMockPayments(params);
      setItems(mock.items);
      setTotal(mock.total);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paged = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, methodFilter, search, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const kpis = useMemo(() => {
    const paid = items.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amount, 0);
    const pending = items
      .filter((p) => ["pending", "initiated"].includes(p.status))
      .reduce((s, p) => s + p.amount, 0);
    const failed = items.filter((p) => p.status === "failed").length;
    const cod = items.filter((p) => p.method === "COD").length;
    const online = items.filter((p) => p.method !== "COD" && p.method !== "BANK").length;
    const refunded = items.filter((p) => p.status === "refunded").length;
    return [
      {
        label: "Total Paid",
        value: formatLkr(paid, true),
        variant: "success",
        icon: <Banknote className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Pending",
        value: formatLkr(pending, true),
        variant: "warning",
        icon: <Clock className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Failed",
        value: failed,
        variant: "danger",
        icon: <CircleX className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "COD Orders",
        value: cod,
        icon: <Wallet className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Online",
        value: online,
        icon: <CreditCard className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Refunded",
        value: refunded,
        icon: <RotateCcw className="h-4 w-4" strokeWidth={2} />,
      },
    ];
  }, [items]);

  const breakdown = useMemo(() => {
    const map = new Map();
    items.forEach((p) => {
      const slot = map.get(p.method) || { method: p.method, amount: 0, count: 0 };
      slot.amount += p.amount;
      slot.count += 1;
      map.set(p.method, slot);
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [items]);

  const donutSegments = breakdown.map((b) => ({
    value: b.amount,
    color: METHOD_COLORS[b.method] || "#8b95a7",
  }));
  const donutTotal = breakdown.reduce((s, b) => s + b.amount, 0);

  const barItems = breakdown.map((b) => ({
    label: b.method,
    value: b.amount,
    formattedValue: formatLkr(b.amount, true),
    color: METHOD_COLORS[b.method] || "#8b95a7",
  }));

  const runAction = useCallback(
    async (id, action, label) => {
      setActionPendingId(id);
      try {
        await updateAdminPayment(id, action);
        toast?.(label);
        await load();
      } catch (e) {
        toast?.(e?.message || "Action failed", "error");
      } finally {
        setActionPendingId(null);
      }
    },
    [load, toast]
  );

  return (
    <div className="admin-products-page admin-payments-page space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Dashboard · Finance · Payments"
        badge={
          <span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">
            {total}
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => toast?.("Export started — you'll receive a download shortly")}
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              Export
            </Btn>
          </div>
        }
      />

      {usingMock && (
        <div className="rounded-lg border border-[#d8b84f]/30 bg-[#d8b84f]/10 px-4 py-3 text-sm text-[#8b95a7]">
          Showing demo payments — connect the API to load live payment data.{" "}
          <button type="button" onClick={load} className="font-semibold text-[#d8b84f] underline">
            Retry
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}{" "}
          <button type="button" onClick={load} className="ml-2 underline">
            Try again
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Payment Method Breakdown" subtitle="Revenue by payment method">
          {loading && items.length === 0 ? (
            <Skeleton className="mx-auto h-[130px] w-[130px] rounded-full" />
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b95a7]">No payment data yet.</p>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <MiniDonut
                segments={donutSegments}
                size={130}
                thickness={16}
                centerLabel="Total"
                centerValue={formatLkr(donutTotal, true)}
              />
              <div className="space-y-2">
                {breakdown.map((b) => (
                  <div key={b.method} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: METHOD_COLORS[b.method] || "#8b95a7" }}
                    />
                    <span className="text-xs text-[#f8fafc]">{b.method}</span>
                    <span className="ml-auto text-xs tabular-nums text-[#8b95a7]">{b.count} txn</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
        <ChartCard title="Revenue by Method" subtitle="Comparative view">
          {loading && items.length === 0 ? (
            <Skeleton className="h-32 w-full" />
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#8b95a7]">No payment data yet.</p>
          ) : (
            <MiniBarChart items={barItems} labelClassName="uppercase tracking-wide font-semibold" />
          )}
        </ChartCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64 min-w-[10rem]">
          <Input
            placeholder="Search transaction ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-44">
          <Select
            label="Method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={METHOD_OPTIONS}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Transaction Ref</th>
                <th className="px-4 py-3">Gateway</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading && items.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, c) => (
                      <td key={c} className="px-4 py-3">
                        <Skeleton className="h-3.5 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12">
                    <EmptyState
                      title="No payments found"
                      description="Try clearing filters, or wait for new orders to come through."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const isPaid = p.status === "succeeded";
                  const isFailed = p.status === "failed";
                  const isCod = p.method === "COD";
                  const busy = actionPendingId === p.id;
                  return (
                    <tr key={p.id} className={`transition hover:bg-[#182238]/60 ${busy ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#d8b84f]">
                        {String(p.id).startsWith("PAY") ? p.id : `PAY${String(p.id).padStart(4, "0")}`}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/orders/${p.orderId}`} className="text-[#60a5fa] hover:underline">
                          {p.orderNumber || `#${p.orderId}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#f8fafc]">
                        {p.customerName || "—"}
                        {p.customerEmail && (
                          <p className="text-[11px] text-[#8b95a7]">{p.customerEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: `${METHOD_COLORS[p.method] || "#8b95a7"}20`,
                            color: METHOD_COLORS[p.method] || "#8b95a7",
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: METHOD_COLORS[p.method] || "#8b95a7" }}
                          />
                          {p.method}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[#f8fafc]">
                        {formatLkr(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={STATUS_LABEL[p.status] || p.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#8b95a7]">{p.transactionRef || "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#8b95a7]">{p.gateway}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3">
                        <ActionMenu
                          items={[
                            {
                              label: "View Order",
                              onClick: () => {
                                window.location.href = `/admin/orders/${p.orderId}`;
                              },
                              disabled: !p.orderId,
                            },
                            { divider: true },
                            {
                              label: "Mark COD Collected",
                              onClick: () => runAction(p.id, "cod_collect", "COD payment marked as collected"),
                              disabled: !isCod || isPaid || busy,
                            },
                            {
                              label: "Retry Payment",
                              onClick: () => runAction(p.id, "retry", "Retry initiated"),
                              disabled: !isFailed || busy,
                            },
                            { divider: true },
                            {
                              label: "Refund",
                              danger: true,
                              onClick: () => runAction(p.id, "refund", "Refund initiated"),
                              disabled: !isPaid || busy,
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {items.length > 10 && (
          <div className="flex flex-col gap-3 border-t border-[#263145] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-[#8b95a7]">
                Show{" "}
                <span className="mx-1 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                of {items.length}
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
      </div>
    </div>
  );
}
