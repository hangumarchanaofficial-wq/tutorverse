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
  SkeletonRows,
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

function formatPaymentId(id) {
  return String(id).startsWith("PAY") ? id : `PAY${String(id).padStart(4, "0")}`;
}

function MethodBadge({ method }) {
  const color = METHOD_COLORS[method] || "#8b95a7";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `${color}20`, color }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {method}
    </span>
  );
}

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

  const paymentMenuItems = (p) => {
    const isPaid = p.status === "succeeded";
    const isFailed = p.status === "failed";
    const isCod = p.method === "COD";
    const busy = actionPendingId === p.id;
    return [
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
    ];
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 w-full flex-1 sm:max-w-xs">
          <Input
            placeholder="Search transaction ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={METHOD_OPTIONS}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        {/* Mobile */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading && items.length === 0 ? (
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="px-4 py-3">
                <Skeleton className="mb-2 h-3.5 w-20" />
                <Skeleton className="mb-2 h-3 w-36" />
                <Skeleton className="h-3 w-28" />
              </li>
            ))
          ) : items.length === 0 ? (
            <li className="px-4 py-12">
              <EmptyState
                title="No payments found"
                description="Try clearing filters, or wait for new orders to come through."
              />
            </li>
          ) : (
            paged.map((p) => {
              const busy = actionPendingId === p.id;
              return (
                <li
                  key={p.id}
                  className={`flex gap-3 px-4 py-3 transition hover:bg-[#182238]/60 ${busy ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#d8b84f]">
                        {formatPaymentId(p.id)}
                      </span>
                      <StatusBadge status={STATUS_LABEL[p.status] || p.status} />
                    </div>
                    <Link
                      to={`/admin/orders/${p.orderId}`}
                      className="mt-1 block truncate text-xs text-[#60a5fa] hover:underline"
                    >
                      {p.orderNumber || `#${p.orderId}`}
                    </Link>
                    <p className="mt-0.5 truncate text-sm font-medium text-[#f8fafc]" title={p.customerName}>
                      {p.customerName || "—"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <MethodBadge method={p.method} />
                      <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-[#f8fafc]">
                        {formatLkr(p.amount)}
                      </span>
                      <span className="text-xs text-[#8b95a7]">{fmtDate(p.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 self-center">
                    <ActionMenu items={paymentMenuItems(p)} />
                  </div>
                </li>
              );
            })
          )}
        </ul>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 align-middle font-medium">Payment ID</th>
                <th className="px-4 py-3 align-middle font-medium">Order</th>
                <th className="min-w-[160px] px-4 py-3 align-middle font-medium">Customer</th>
                <th className="px-4 py-3 align-middle font-medium">Method</th>
                <th className="px-4 py-3 align-middle text-right font-medium">Amount</th>
                <th className="px-4 py-3 align-middle font-medium">Status</th>
                <th className="px-4 py-3 align-middle font-medium">Transaction Ref</th>
                <th className="px-4 py-3 align-middle font-medium">Gateway</th>
                <th className="px-4 py-3 align-middle font-medium">Date</th>
                <th className="w-10 px-4 py-3 align-middle" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading && items.length === 0 ? (
                <SkeletonRows rows={6} cols={10} />
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
                  const busy = actionPendingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className={`transition hover:bg-[#182238]/60 ${busy ? "opacity-60" : ""}`}
                    >
                      <td className="align-middle whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#d8b84f]">
                        {formatPaymentId(p.id)}
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3">
                        <Link to={`/admin/orders/${p.orderId}`} className="text-[#60a5fa] hover:underline">
                          {p.orderNumber || `#${p.orderId}`}
                        </Link>
                      </td>
                      <td className="align-middle max-w-[200px] px-4 py-3">
                        <p className="truncate font-medium text-[#f8fafc]" title={p.customerName}>
                          {p.customerName || "—"}
                        </p>
                        {p.customerEmail && (
                          <p className="truncate text-[11px] text-[#8b95a7]" title={p.customerEmail}>
                            {p.customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3">
                        <MethodBadge method={p.method} />
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#f8fafc]">
                        {formatLkr(p.amount)}
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3">
                        <StatusBadge status={STATUS_LABEL[p.status] || p.status} />
                      </td>
                      <td className="align-middle max-w-[180px] px-4 py-3">
                        <span
                          className="block truncate font-mono text-xs text-[#8b95a7]"
                          title={p.transactionRef}
                        >
                          {p.transactionRef || "—"}
                        </span>
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                        {p.gateway}
                      </td>
                      <td className="align-middle whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                        {fmtDate(p.createdAt)}
                      </td>
                      <td className="align-middle px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <ActionMenu items={paymentMenuItems(p)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && items.length > pageSize && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-medium text-[#8b95a7]">
                Show data{" "}
                <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
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
