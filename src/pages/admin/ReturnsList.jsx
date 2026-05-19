import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  PackageCheck,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Select,
  Input,
  ActionMenu,
  ConfirmDialog,
  ReturnPipelineSummary,
  Skeleton,
  SkeletonRows,
  useToast,
  formatLkr,
  fmtDate,
} from "../../admin/components/ui";
import { returns as mockReturns } from "../../admin/data/mockData";
import {
  RETURN_FILTER_STATUSES,
  normalizeReturnStatus,
  canTransition,
  isReturnActionNeeded,
  isReturnInProgress,
  isReturnTerminal,
} from "../../lib/returnStatus";

const PAGE_SIZE = 10;
const cardIconClass = "h-[18px] w-[18px]";

const CONDITION_STYLES = {
  Unopened: "bg-[#34d399]/15 text-[#34d399]",
  Good: "bg-[#60a5fa]/15 text-[#60a5fa]",
  Used: "bg-[#f59e0b]/15 text-[#f59e0b]",
  Damaged: "bg-[#f87171]/15 text-[#f87171]",
};

function ConditionBadge({ condition }) {
  const style = CONDITION_STYLES[condition] || "bg-[#8b95a7]/15 text-[#8b95a7]";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {condition || "—"}
    </span>
  );
}

export default function ReturnsList() {
  const toast = useToast();
  const [allReturns, setAllReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let on = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (on) {
        setAllReturns(
          mockReturns.map((r) => ({
            ...r,
            status: normalizeReturnStatus(r.status),
          }))
        );
        setLoading(false);
      }
    }, 280);
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, []);

  const counts = useMemo(() => {
    const m = {};
    allReturns.forEach((r) => {
      const s = normalizeReturnStatus(r.status);
      m[s] = (m[s] || 0) + 1;
    });
    m.total = allReturns.length;
    return m;
  }, [allReturns]);

  const pendingRefundTotal = useMemo(
    () =>
      allReturns
        .filter((r) => !isReturnTerminal(r.status))
        .reduce((sum, r) => sum + (r.refundAmount || 0), 0),
    [allReturns]
  );

  const actionNeededCount = useMemo(
    () => allReturns.filter((r) => isReturnActionNeeded(r.status)).length,
    [allReturns]
  );

  const inProgressCount = useMemo(
    () => allReturns.filter((r) => isReturnInProgress(r.status)).length,
    [allReturns]
  );

  const filtered = useMemo(() => {
    let list = [...allReturns];
    if (statusFilter !== "ALL") {
      list = list.filter((r) => normalizeReturnStatus(r.status) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.orderNumber?.toLowerCase().includes(q) ||
          r.customerName?.toLowerCase().includes(q) ||
          r.productName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [allReturns, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const setStatusQuick = useCallback((status) => {
    setStatusFilter((prev) => (prev === status ? "ALL" : status));
  }, []);

  const confirmAction = (title, message, onConfirm) => {
    setConfirmDlg({
      title,
      message,
      onConfirm: async () => {
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setConfirmDlg(null);
        }
      },
    });
  };

  const updateStatus = (id, newStatus) => {
    const row = allReturns.find((r) => r.id === id);
    if (!row || !canTransition(row.status, newStatus)) {
      toast?.("This status change is not allowed", "error");
      return;
    }
    setAllReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              resolvedAt:
                newStatus === "REFUNDED" || newStatus === "REJECTED"
                  ? new Date().toISOString()
                  : r.resolvedAt,
            }
          : r
      )
    );
    toast?.(`Return ${id} updated to ${newStatus.replace(/_/g, " ")}`);
  };

  const statusOptions = RETURN_FILTER_STATUSES.map((s) => ({
    value: s,
    label:
      s === "ALL"
        ? "All statuses"
        : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title="Returns & Refunds"
        subtitle="Manage product returns and process refunds"
        badge={
          <span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">
            {allReturns.length} returns
          </span>
        }
        actions={
          <div className="rounded-lg border border-[#263145] bg-[#121b2e] px-3 py-2 text-xs">
            <span className="text-[#8b95a7]">Pending refund </span>
            <span className="font-semibold tabular-nums text-[#f59e0b]">
              {formatLkr(pendingRefundTotal)}
            </span>
          </div>
        }
      />

      <ConfirmDialog
        open={!!confirmDlg}
        title={confirmDlg?.title || ""}
        message={confirmDlg?.message || ""}
        confirmLabel="Confirm"
        onConfirm={confirmDlg?.onConfirm}
        onCancel={() => !busy && setConfirmDlg(null)}
        busy={busy}
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total returns"
            value={counts.total || 0}
            icon={<ClipboardList className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusFilter("ALL")}
          />
          <StatCard
            label="Action needed"
            value={actionNeededCount}
            variant="warning"
            icon={<AlertCircle className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("REQUESTED")}
          />
          <StatCard
            label="In progress"
            value={inProgressCount}
            icon={<RotateCcw className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusFilter("RETURN_RECEIVED")}
          />
          <StatCard
            label="Refunded"
            value={counts.REFUNDED || 0}
            variant="success"
            icon={<PackageCheck className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("REFUNDED")}
          />
        </div>
      )}

      {!loading && (
        <ReturnPipelineSummary
          counts={counts}
          activeFilter={statusFilter}
          onFilter={setStatusFilter}
        />
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a7]" />
          <Input
            className="pl-9"
            placeholder="Search return, order, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 font-medium">Return ID</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Condition</th>
                <th className="px-4 py-3 font-medium">Refund</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Requested</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading ? (
                <SkeletonRows cols={10} rows={8} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No returns match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try a different status or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const status = normalizeReturnStatus(r.status);
                  return (
                    <tr key={r.id} className="transition">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#d8b84f]">
                        {r.id}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${r.orderId}`}
                          className="font-mono text-xs text-[#60a5fa] hover:underline"
                        >
                          {r.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#f8fafc]">{r.customerName}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-[#f8fafc]" title={r.productName}>
                        {r.productName}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-[#8b95a7]" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-4 py-3">
                        <ConditionBadge condition={r.condition} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[#f8fafc]">
                        {formatLkr(r.refundAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                        {fmtDate(r.requestedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ActionMenu
                          items={[
                            {
                              label: "Approve",
                              onClick: () =>
                                confirmAction("Approve Return", `Approve return ${r.id}?`, () =>
                                  updateStatus(r.id, "APPROVED")
                                ),
                              disabled: !canTransition(status, "APPROVED"),
                            },
                            {
                              label: "Reject",
                              danger: true,
                              onClick: () =>
                                confirmAction(
                                  "Reject Return",
                                  `Reject return ${r.id}? The customer will be notified.`,
                                  () => updateStatus(r.id, "REJECTED")
                                ),
                              disabled: !canTransition(status, "REJECTED"),
                            },
                            { divider: true },
                            {
                              label: "Mark received",
                              onClick: () =>
                                confirmAction("Mark Received", `Mark return ${r.id} as received?`, () =>
                                  updateStatus(r.id, "RETURN_RECEIVED")
                                ),
                              disabled: !canTransition(status, "RETURN_RECEIVED"),
                            },
                            {
                              label: "Mark inspected",
                              onClick: () =>
                                confirmAction("Mark Inspected", `Mark return ${r.id} as inspected?`, () =>
                                  updateStatus(r.id, "INSPECTED")
                                ),
                              disabled: !canTransition(status, "INSPECTED"),
                            },
                            {
                              label: "Issue refund",
                              onClick: () =>
                                confirmAction(
                                  "Issue Refund",
                                  `Issue ${formatLkr(r.refundAmount)} refund for ${r.id}? Refund will be sent to the original payment method after inspection.`,
                                  () => updateStatus(r.id, "REFUNDED")
                                ),
                              disabled: !canTransition(status, "REFUNDED"),
                            },
                            { divider: true },
                            {
                              label: "Restock item",
                              onClick: () => toast?.(`${r.productName} restocked`),
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

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#263145] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
