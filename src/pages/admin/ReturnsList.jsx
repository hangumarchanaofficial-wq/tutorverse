import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader, StatCard, StatusBadge, Select, Input,
  ActionMenu, ConfirmDialog, useToast,
  formatLkr, fmtDate,
} from "../../admin/components/ui";
import { returns } from "../../admin/data/mockData";

const STATUS_FLOW = ["REQUESTED", "APPROVED", "RETURN_RECEIVED", "INSPECTED", "REFUNDED", "REJECTED"];
const FILTER_STATUSES = ["ALL", "REQUESTED", "APPROVED", "RETURN_RECEIVED", "REFUNDED", "REJECTED"];

export default function ReturnsList() {
  const toast = useToast();
  const [allReturns, setAllReturns] = useState(returns);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  const counts = useMemo(() => {
    const m = { total: allReturns.length };
    allReturns.forEach((r) => { m[r.status] = (m[r.status] || 0) + 1; });
    return m;
  }, [allReturns]);

  const filtered = useMemo(() => {
    let list = [...allReturns];
    if (statusFilter !== "ALL") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.id.toLowerCase().includes(q) ||
        r.orderNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [allReturns, statusFilter, search]);

  const confirmAction = (title, message, onConfirm) => {
    setConfirmDlg({ title, message, onConfirm: () => { onConfirm(); setConfirmDlg(null); } });
  };

  const updateStatus = (id, newStatus) => {
    setAllReturns((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus, resolvedAt: newStatus === "REFUNDED" || newStatus === "REJECTED" ? new Date().toISOString() : r.resolvedAt } : r));
    toast?.(`Return ${id} updated to ${newStatus.replace(/_/g, " ")}`);
  };

  const kpis = [
    { label: "Total Returns", value: counts.total || 0 },
    { label: "Requested", value: counts.REQUESTED || 0, variant: "warning" },
    { label: "Approved", value: counts.APPROVED || 0 },
    { label: "Received", value: counts.RETURN_RECEIVED || 0 },
    { label: "Refunded", value: counts.REFUNDED || 0, variant: "success" },
    { label: "Rejected", value: counts.REJECTED || 0, variant: "danger" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Returns & Refunds" subtitle="Manage product returns and process refunds" />

      <ConfirmDialog
        open={!!confirmDlg}
        title={confirmDlg?.title || ""}
        message={confirmDlg?.message || ""}
        confirmLabel="Confirm"
        onConfirm={confirmDlg?.onConfirm}
        onCancel={() => setConfirmDlg(null)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} variant={k.variant} />
        ))}
      </div>

      {/* Status Flow */}
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e] p-4">
        <div className="flex items-center gap-0 min-w-[550px]">
          {STATUS_FLOW.map((step, i) => {
            const count = counts[step] || 0;
            const isEnd = step === "REFUNDED" || step === "REJECTED";
            const endColor = step === "REFUNDED" ? "text-[#34d399]" : step === "REJECTED" ? "text-[#f87171]" : "";
            return (
              <React.Fragment key={step}>
                <button
                  onClick={() => setStatusFilter(statusFilter === step ? "ALL" : step)}
                  className={`flex flex-col items-center rounded-lg px-2 py-2 transition ${statusFilter === step ? "bg-[#d8b84f]/15" : "hover:bg-[#182238]"}`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${count > 0 ? "bg-[#d8b84f]/20 text-[#d8b84f]" : "bg-[#263145] text-[#8b95a7]"}`}>
                    {count}
                  </div>
                  <span className={`mt-1 text-[9px] font-semibold uppercase tracking-wider ${isEnd ? endColor : statusFilter === step ? "text-[#d8b84f]" : "text-[#8b95a7]"}`}>
                    {step.replace(/_/g, " ").slice(0, 8)}
                  </span>
                </button>
                {i < STATUS_FLOW.length - 1 && (
                  <div className="h-0.5 flex-1 bg-[#263145]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input placeholder="Search return, order, customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={FILTER_STATUSES.map((s) => ({ value: s, label: s === "ALL" ? "All Statuses" : s.replace(/_/g, " ") }))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
            <tr>
              <th className="px-4 py-3">Return ID</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Refund</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/60">
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-[#8b95a7]">No returns found</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="transition hover:bg-[#182238]">
                  <td className="px-4 py-3 font-semibold text-[#d8b84f]">{r.id}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${r.orderId}`} className="text-[#60a5fa] hover:underline">{r.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#f8fafc]">{r.customerName}</td>
                  <td className="px-4 py-3 text-[#f8fafc] max-w-[180px] truncate">{r.productName}</td>
                  <td className="px-4 py-3 text-[#8b95a7] max-w-[160px] truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#182238] px-2 py-0.5 text-[11px] font-medium text-[#8b95a7]">{r.condition}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[#f8fafc] whitespace-nowrap">{formatLkr(r.refundAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-[#8b95a7] whitespace-nowrap">{fmtDate(r.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <ActionMenu items={[
                      { label: "Approve", onClick: () => confirmAction("Approve Return", `Approve return ${r.id}?`, () => updateStatus(r.id, "APPROVED")), disabled: r.status !== "REQUESTED" },
                      { label: "Reject", danger: true, onClick: () => confirmAction("Reject Return", `Reject return ${r.id}? The customer will be notified.`, () => updateStatus(r.id, "REJECTED")), disabled: !["REQUESTED", "APPROVED"].includes(r.status) },
                      { divider: true },
                      { label: "Mark Received", onClick: () => confirmAction("Mark Received", `Mark return ${r.id} as received?`, () => updateStatus(r.id, "RETURN_RECEIVED")), disabled: r.status !== "APPROVED" },
                      { label: "Issue Refund", onClick: () => confirmAction("Issue Refund", `Issue ${formatLkr(r.refundAmount)} refund for ${r.id}?`, () => updateStatus(r.id, "REFUNDED")), disabled: !["RETURN_RECEIVED", "APPROVED"].includes(r.status) },
                      { divider: true },
                      { label: "Restock Item", onClick: () => { toast?.(`${r.productName} restocked`); } },
                    ]} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
