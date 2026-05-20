import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Package,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Input,
  Select,
  Skeleton,
  SkeletonRows,
  fmtDateTime,
} from "../../admin/components/ui";
import { orders as mockOrders } from "../../admin/data/mockData";
import { fetchAdminOrders } from "../../services/adminApi";
import { normalizeOrderPipelineStatus } from "../../lib/orderStatus";

const CARRIERS = ["CityExpress", "Prompt Logistics", "Lanka Post", "DHL"];
const STATUSES = ["ALL", "PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 10;

const cardIconClass = "h-[18px] w-[18px]";

function carrierForOrder(orderId, status) {
  const s = normalizeOrderPipelineStatus(status);
  if (["PLACED", "CONFIRMED", "CANCELLED"].includes(s)) return "—";
  const n = String(orderId).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CARRIERS[n % CARRIERS.length];
}

function normalizeOrderRow(o) {
  const status = normalizeOrderPipelineStatus(o.orderStatus || o.status);
  return {
    id: o.id,
    orderNumber: o.orderNumber || o.order_number || `#${o.id}`,
    customer: o.customerName || o.customer_name || "—",
    status,
    carrier: carrierForOrder(o.id, status),
    updated: o.updatedAt || o.updated_at || o.createdAt || o.created_at,
  };
}

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [carrierFilter, setCarrierFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let on = true;
    setLoading(true);
    fetchAdminOrders()
      .then((data) => {
        if (!on) return;
        const arr = Array.isArray(data) ? data : (data?.items || data?.orders || []);
        setOrders((arr.length > 0 ? arr : mockOrders).map(normalizeOrderRow));
      })
      .catch(() => {
        if (on) setOrders(mockOrders.map(normalizeOrderRow));
      })
      .finally(() => {
        if (on) setLoading(false);
      });
    return () => {
      on = false;
    };
  }, []);

  const stats = useMemo(() => {
    const m = { inTransit: 0, delivered: 0, awaiting: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (o.status === "DELIVERED") m.delivered += 1;
      else if (o.status === "CANCELLED") m.cancelled += 1;
      else if (["PROCESSING", "PACKED", "SHIPPED"].includes(o.status)) m.inTransit += 1;
      else if (["PLACED", "CONFIRMED"].includes(o.status)) m.awaiting += 1;
    });
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (statusFilter !== "ALL") list = list.filter((o) => o.status === statusFilter);
    if (carrierFilter !== "ALL") {
      list = list.filter((o) => o.carrier === carrierFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.carrier.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
    return list;
  }, [orders, statusFilter, carrierFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, carrierFilter, search]);

  const setStatusQuick = useCallback((status) => {
    setStatusFilter((prev) => (prev === status ? "ALL" : status));
  }, []);

  const carrierOptions = useMemo(
    () => [
      { value: "ALL", label: "All carriers" },
      ...CARRIERS.map((c) => ({ value: c, label: c })),
      { value: "—", label: "Not assigned" },
    ],
    []
  );

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title="Order Tracking"
        subtitle="Shipment and status overview — open an order for the full timeline and notes."
        badge={
          <span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">
            {orders.length} orders
          </span>
        }
        actions={
          <Link
            to="/admin/orders"
            className="rounded-lg border border-[#263145] bg-[#121b2e] px-3 py-2 text-xs font-semibold text-[#8b95a7] transition hover:border-[#d8b84f]/40 hover:text-[#f8fafc]"
          >
            All orders
          </Link>
        }
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
            label="In transit"
            value={stats.inTransit}
            icon={<Truck className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("SHIPPED")}
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            variant="success"
            icon={<PackageCheck className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("DELIVERED")}
          />
          <StatCard
            label="Awaiting ship"
            value={stats.awaiting}
            variant="warning"
            icon={<Package className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusFilter("PLACED")}
          />
          <StatCard
            label="Active carriers"
            value={CARRIERS.length}
            icon={<MapPin className={cardIconClass} strokeWidth={2.2} />}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a7]" />
          <Input
            className="pl-9"
            placeholder="Search order, customer, or carrier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUSES.map((s) => ({
              value: s,
              label: s === "ALL" ? "All statuses" : s.charAt(0) + s.slice(1).toLowerCase(),
            }))}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Carrier"
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            options={carrierOptions}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
        {/* Mobile: order, status, view only */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </li>
            ))
          ) : paged.length === 0 ? (
            <li className="px-4 py-14 text-center">
              <p className="text-sm font-medium text-[#f8fafc]">No shipments match your filters</p>
              <p className="mt-1 text-xs text-[#8b95a7]">Try a different status or clear the search.</p>
            </li>
          ) : (
            paged.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#182238]/80">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/admin/orders/${r.id}`}
                    className="font-mono text-xs font-semibold text-[#d8b84f] hover:underline"
                  >
                    {r.orderNumber}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-[#8b95a7]">{r.customer}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={r.status} />
                  <Link
                    to={`/admin/orders/${r.id}`}
                    className="inline-flex items-center rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-1.5 text-xs font-semibold text-[#f8fafc] transition hover:border-[#d8b84f]/50 hover:text-[#d8b84f]"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Carrier</th>
                <th className="px-5 py-3 font-medium">Last update</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading ? (
                <SkeletonRows cols={6} rows={8} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No shipments match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try a different status or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="transition hover:bg-[#182238]/80">
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/orders/${r.id}`}
                        className="font-mono text-xs font-semibold text-[#d8b84f] hover:underline"
                      >
                        {r.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium text-[#f8fafc]">{r.customer}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-[#8b95a7]">{r.carrier}</td>
                    <td className="px-5 py-3 text-xs tabular-nums text-[#8b95a7]">
                      {r.updated ? fmtDateTime(r.updated) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/orders/${r.id}`}
                        className="inline-flex items-center rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-1.5 text-xs font-semibold text-[#f8fafc] transition hover:border-[#d8b84f]/50 hover:text-[#d8b84f]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="admin-table-pagination border-t border-[#263145]">
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
