import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  PackageCheck,
  RotateCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import {
  PageHeader, StatCard, StatusBadge, Input, Select, Btn, ActionMenu,
  BulkActionBar, ConfirmDialog, Skeleton, SkeletonRows, useToast,
  formatLkr, timeAgo, fmtDate,
} from "../../admin/components/ui";
import { orders as mockOrders, getOrdersByStatus } from "../../admin/data/mockData";
import { fetchAdminOrders, updateAdminOrderStatus } from "../../services/adminApi";

const STATUSES = ["ALL", "PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAY_STATUSES = ["ALL", "PAID", "PENDING", "FAILED"];
const PAY_METHODS = ["ALL", "PAYHERE", "STRIPE", "COD"];
const PIPELINE = ["PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];
const PAGE_SIZE = 10;

const SORT_FNS = {
  date_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  date_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  total_desc: (a, b) => b.totalAmount - a.totalAmount,
  total_asc: (a, b) => a.totalAmount - b.totalAmount,
  customer_asc: (a, b) => a.customerName.localeCompare(b.customerName),
  customer_desc: (a, b) => b.customerName.localeCompare(a.customerName),
  items_desc: (a, b) => b.itemCount - a.itemCount,
  items_asc: (a, b) => a.itemCount - b.itemCount,
};

function ageDays(iso) {
  return (Date.now() - new Date(iso).getTime()) / 864e5;
}

export default function OrdersList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [payStatusFilter, setPayStatusFilter] = useState("ALL");
  const [payMethodFilter, setPayMethodFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    fetchAdminOrders()
      .then((data) => {
        if (!on) return;
        const arr = Array.isArray(data) ? data : (data?.items || data?.orders || []);
        setAllOrders(arr.length > 0 ? arr : mockOrders);
      })
      .catch(() => { if (on) setAllOrders(mockOrders); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const statusCounts = useMemo(() => {
    if (!allOrders.length) return getOrdersByStatus();
    const m = {};
    allOrders.forEach((o) => { m[o.orderStatus] = (m[o.orderStatus] || 0) + 1; });
    return m;
  }, [allOrders]);

  const filtered = useMemo(() => {
    let list = [...allOrders];
    if (statusFilter !== "ALL") list = list.filter((o) => o.orderStatus === statusFilter);
    if (payStatusFilter !== "ALL") list = list.filter((o) => o.paymentStatus === payStatusFilter);
    if (payMethodFilter !== "ALL") list = list.filter((o) => o.paymentMethod === payMethodFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q)
      );
    }
    const fn = SORT_FNS[sortKey] || SORT_FNS.date_desc;
    list.sort(fn);
    return list;
  }, [allOrders, statusFilter, payStatusFilter, payMethodFilter, search, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [statusFilter, payStatusFilter, payMethodFilter, search]);

  const toggleAll = useCallback(() => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((o) => o.id)));
  }, [paged, selected]);

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const handleSort = (col) => {
    setSortKey((prev) => {
      if (prev === `${col}_desc`) return `${col}_asc`;
      return `${col}_desc`;
    });
  };

  const sortIcon = (col) => {
    if (sortKey === `${col}_desc`) return " ▼";
    if (sortKey === `${col}_asc`) return " ▲";
    return "";
  };

  const changeStatus = async (orderId, newStatus) => {
    try {
      await updateAdminOrderStatus(orderId, newStatus);
      setAllOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
      toast?.(`Order status updated to ${newStatus}`);
    } catch {
      toast?.(`Status updated locally`, "warning");
      setAllOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
    }
  };

  const confirmAction = (title, message, onConfirm) => {
    setConfirmDlg({ title, message, onConfirm: () => { onConfirm(); setConfirmDlg(null); } });
  };

  const handleBulk = () => {
    if (!bulkStatus || !selected.size) return;
    confirmAction(
      "Bulk Status Update",
      `Update ${selected.size} order(s) to "${bulkStatus}"?`,
      () => {
        selected.forEach((id) => changeStatus(id, bulkStatus));
        setSelected(new Set());
        setBulkStatus("");
      }
    );
  };

  const cardIconClass = "h-5 w-5";
  const kpiCards = [
    { label: "All Orders", value: allOrders.length, variant: null, icon: <ShoppingBag className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Pending", value: statusCounts.PLACED || 0, variant: "warning", icon: <Clock3 className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Confirmed", value: statusCounts.CONFIRMED || 0, variant: null, icon: <BadgeCheck className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Processing", value: statusCounts.PROCESSING || 0, variant: null, icon: <RotateCw className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Packed", value: statusCounts.PACKED || 0, variant: null, icon: <Archive className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Shipped", value: statusCounts.SHIPPED || 0, variant: null, icon: <Truck className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Delivered", value: statusCounts.DELIVERED || 0, variant: "success", icon: <PackageCheck className={cardIconClass} strokeWidth={2.2} /> },
    { label: "Cancelled", value: statusCounts.CANCELLED || 0, variant: "danger", icon: <XCircle className={cardIconClass} strokeWidth={2.2} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        badge={<span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">{allOrders.length}</span>}
      />

      <ConfirmDialog
        open={!!confirmDlg}
        title={confirmDlg?.title || ""}
        message={confirmDlg?.message || ""}
        confirmLabel="Update"
        confirmVariant="gold"
        onConfirm={confirmDlg?.onConfirm}
        onCancel={() => setConfirmDlg(null)}
      />

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[88px] w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {kpiCards.map((k) => (
            <StatCard
              key={k.label}
              label={k.label}
              value={k.value}
              variant={k.variant}
              icon={k.icon}
              onClick={k.label !== "All Orders" ? () => setStatusFilter(k.label === "Pending" ? "PLACED" : k.label.toUpperCase()) : () => setStatusFilter("ALL")}
            />
          ))}
        </div>
      )}

      {/* Pipeline visual */}
      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e] p-4">
          <div className="flex items-center gap-0 min-w-[600px]">
            {PIPELINE.map((step, i) => {
              const count = statusCounts[step] || 0;
              const isActive = statusFilter === step;
              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => setStatusFilter(isActive ? "ALL" : step)}
                    className={`flex flex-col items-center rounded-lg px-3 py-2 transition ${isActive ? "bg-[#d8b84f]/15" : "hover:bg-[#182238]"}`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${count > 0 ? "bg-[#d8b84f]/20 text-[#d8b84f]" : "bg-[#263145] text-[#8b95a7]"}`}>
                      {count}
                    </div>
                    <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${isActive ? "text-[#d8b84f]" : "text-[#8b95a7]"}`}>
                      {step}
                    </span>
                  </button>
                  {i < PIPELINE.length - 1 && (
                    <div className="h-0.5 flex-1 bg-[#263145]" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 w-full flex-1 sm:max-w-xs">
          <Input
            placeholder="Search order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUSES.map((s) => ({ value: s, label: s === "ALL" ? "All Statuses" : s }))}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Payment"
            value={payStatusFilter}
            onChange={(e) => setPayStatusFilter(e.target.value)}
            options={PAY_STATUSES.map((s) => ({ value: s, label: s === "ALL" ? "All Payments" : s }))}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Method"
            value={payMethodFilter}
            onChange={(e) => setPayMethodFilter(e.target.value)}
            options={PAY_METHODS.map((s) => ({ value: s, label: s === "ALL" ? "All Methods" : s }))}
          />
        </div>
        {(statusFilter !== "ALL" || payStatusFilter !== "ALL" || payMethodFilter !== "ALL" || search) && (
          <Btn variant="ghost" onClick={() => { setStatusFilter("ALL"); setPayStatusFilter("ALL"); setPayMethodFilter("ALL"); setSearch(""); }}>
            Clear filters
          </Btn>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleAll}
                  className="accent-[#d8b84f]"
                />
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("date")}>Order{sortIcon("date")}</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("customer")}>Customer{sortIcon("customer")}</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("items")}>Items{sortIcon("items")}</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("total")}>Total{sortIcon("total")}</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/60">
            {loading ? (
              <SkeletonRows rows={8} cols={11} />
            ) : paged.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-16 text-center text-sm text-[#8b95a7]">No orders found</td></tr>
            ) : (
              paged.map((o) => {
                const age = ageDays(o.createdAt);
                const ageColor = age > 7 ? "text-[#f87171]" : age > 3 ? "text-[#f59e0b]" : "text-[#8b95a7]";
                return (
                  <tr
                    key={o.id}
                    className="cursor-pointer transition hover:bg-[#182238]"
                    onClick={(e) => {
                      if (e.target.closest("input, button, [data-menu]")) return;
                      navigate(`/admin/orders/${o.id}`);
                    }}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleOne(o.id)}
                        className="accent-[#d8b84f]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#d8b84f]">{o.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[#f8fafc]">{o.customerName}</div>
                      <div className="text-[11px] text-[#8b95a7]">{o.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b95a7] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#f8fafc]">{o.itemCount}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-[#f8fafc] whitespace-nowrap">{formatLkr(o.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#182238] px-2 py-0.5 text-[11px] font-medium text-[#8b95a7]">{o.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
                    <td className={`px-4 py-3 text-xs font-medium tabular-nums whitespace-nowrap ${ageColor}`}>
                      {timeAgo(o.createdAt)}
                    </td>
                    <td className="px-4 py-3" data-menu onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "View details", onClick: () => navigate(`/admin/orders/${o.id}`) },
                        { divider: true },
                        { label: "Confirm", onClick: () => confirmAction("Confirm Order", `Confirm ${o.orderNumber}?`, () => changeStatus(o.id, "CONFIRMED")), disabled: o.orderStatus !== "PLACED" },
                        { label: "Process", onClick: () => confirmAction("Process Order", `Start processing ${o.orderNumber}?`, () => changeStatus(o.id, "PROCESSING")), disabled: o.orderStatus !== "CONFIRMED" },
                        { label: "Pack", onClick: () => confirmAction("Pack Order", `Mark ${o.orderNumber} as packed?`, () => changeStatus(o.id, "PACKED")), disabled: o.orderStatus !== "PROCESSING" },
                        { label: "Ship", onClick: () => confirmAction("Ship Order", `Mark ${o.orderNumber} as shipped?`, () => changeStatus(o.id, "SHIPPED")), disabled: o.orderStatus !== "PACKED" },
                        { label: "Deliver", onClick: () => confirmAction("Deliver Order", `Mark ${o.orderNumber} as delivered?`, () => changeStatus(o.id, "DELIVERED")), disabled: o.orderStatus !== "SHIPPED" },
                        { divider: true },
                        { label: "Cancel", danger: true, onClick: () => confirmAction("Cancel Order", `Cancel ${o.orderNumber}? This cannot be undone.`, () => changeStatus(o.id, "CANCELLED")), disabled: ["DELIVERED", "CANCELLED"].includes(o.orderStatus) },
                      ]} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="admin-table-pagination rounded-xl border border-[#263145] bg-[#121b2e]">
          <span className="text-xs font-medium text-[#8b95a7]">
            Show data{" "}
            <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">
              {Math.min(PAGE_SIZE, paged.length)}
            </span>
            of {filtered.length}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const navItems = totalPages <= 5
                ? Array.from({ length: totalPages }, (_, i) => i + 1)
                : page <= 3
                  ? [1, 2, 3, "end-gap", totalPages]
                  : page >= totalPages - 2
                    ? [1, "start-gap", totalPages - 2, totalPages - 1, totalPages]
                    : [1, "start-gap", page - 1, page, page + 1, "end-gap", totalPages];

              const navButtonClass = "flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
              const ghostStyle = "border-[#263145] bg-[#0f1726] text-[#8b95a7] shadow-sm hover:border-[#d8b84f]/50 hover:bg-[#182238] hover:text-[#f8fafc]";
              const activeStyle = "border-[#d8b84f] bg-[#d8b84f] text-[#070b14] shadow-[0_8px_18px_rgba(216,184,79,0.24)]";

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
                  {navItems.map((item) => (
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
                      <span key={item} className="px-1 text-sm font-semibold text-[#8b95a7]">...</span>
                    )
                  ))}
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

      {/* Bulk Action Bar */}
      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          options={[{ value: "", label: "Change status…" }, ...STATUSES.filter((s) => s !== "ALL").map((s) => ({ value: s, label: s }))]}
          className="!w-44"
        />
        <Btn variant="primary" size="sm" onClick={handleBulk} disabled={!bulkStatus}>Apply</Btn>
      </BulkActionBar>
    </div>
  );
}
