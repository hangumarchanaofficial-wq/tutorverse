import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  Tabs,
  Btn,
  Input,
  Skeleton,
  SkeletonRows,
  EmptyState,
  ProductThumbnail,
  fmtDate,
  fmtDateTime,
  useToast,
} from "../../admin/components/ui";
import { fetchAdminStockMovements } from "../../services/adminApi";
import {
  filterMockMovements,
  getMockStockMovementTabCounts,
  loadMockStockMovements,
  normalizeMockStockMovements,
} from "../../admin/utils/stockMovements";
import { stockLogs as mockStockLogs } from "../../admin/data/mockData";
import { resolveLineItemProductImage } from "../../lib/productImage";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "in", label: "Added" },
  { id: "out", label: "Sold" },
  { id: "adjustment", label: "Adjusted" },
];

const PAGE_SIZE = 10;

function QtyValue({ quantity }) {
  const cls =
    quantity > 0 ? "text-[#34d399]" : quantity < 0 ? "text-[#f87171]" : "text-[#8b95a7]";
  const text = quantity > 0 ? `+${quantity}` : String(quantity);
  return <span className={`font-semibold tabular-nums ${cls}`}>{text}</span>;
}

function productImageFor(log) {
  return resolveLineItemProductImage({
    productId: log.productId,
    productTitle: log.productName,
    image: log.productImage ?? log.image,
  });
}

export default function StockLogs() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { limit: 200 };
    if (typeFilter !== "all") params.type = typeFilter;
    if (search.trim()) params.q = search.trim();

    try {
      const res = await fetchAdminStockMovements(params);
      setItems(res?.items || []);
      setTotal(res?.total ?? 0);
      setUsingMock(false);
    } catch {
      const mock = loadMockStockMovements(params);
      setItems(mock.items);
      setTotal(mock.total);
      setUsingMock(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortAsc ? da - db : db - da;
    });
    return arr;
  }, [items, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, search, sortAsc]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const mockTabCounts = useMemo(() => {
    const searchOnly = filterMockMovements(normalizeMockStockMovements(mockStockLogs), {
      q: search.trim() || undefined,
    });
    return getMockStockMovementTabCounts(searchOnly);
  }, [search]);

  const typeCounts = useMemo(() => {
    const map = {};
    items.forEach((l) => {
      map[l.movementType] = (map[l.movementType] || 0) + 1;
    });
    return map;
  }, [items]);

  const tabCounts = usingMock ? mockTabCounts : { all: total, ...typeCounts };

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title="Stock Logs"
        subtitle={`${total} stock movement${total === 1 ? "" : "s"} recorded`}
        actions={
          <Btn variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Btn>
        }
      />

      {usingMock && (
        <div className="rounded-lg border border-[#d8b84f]/30 bg-[#d8b84f]/10 px-4 py-3 text-sm text-[#8b95a7]">
          Showing demo stock logs — connect the API to load live movements.{" "}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Tabs
          tabs={TYPE_TABS.map((t) => ({
            ...t,
            count: tabCounts[t.id] ?? 0,
          }))}
          activeTab={typeFilter}
          onChange={setTypeFilter}
        />
        <Input
          placeholder="Search reason (e.g. Order ORD-…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 w-full sm:!w-64"
        />
        <Btn variant="ghost" size="xs" onClick={() => setSortAsc((s) => !s)}>
          Date: {sortAsc ? "Oldest first" : "Newest first"}
        </Btn>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        {/* Mobile: product, type, qty, reason; date on second line */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading && sorted.length === 0 ? (
            Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-full max-w-[160px]" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full max-w-[200px]" />
                </div>
              </li>
            ))
          ) : paged.length === 0 ? (
            <li className="px-4 py-12">
              <EmptyState
                title="No stock movements"
                description="Movements appear here when orders are placed or you adjust stock manually."
                actions={
                  <Btn variant="ghost" size="xs" onClick={() => toast?.("Manual adjustment dialog (coming soon)")}>
                    Adjust stock
                  </Btn>
                }
              />
            </li>
          ) : (
            paged.map((log) => (
              <li key={log.id} className="flex gap-3 px-4 py-3 transition hover:bg-[#182238]/60">
                <ProductThumbnail src={productImageFor(log)} alt={log.productName} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium text-[#f8fafc]" title={log.productName}>
                      {log.productName}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={log.type} />
                      <QtyValue quantity={log.quantity} />
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8b95a7]">{fmtDate(log.createdAt)}</p>
                  <p className="mt-1 truncate text-xs text-[#8b95a7]" title={log.reason || undefined}>
                    {log.reason || "—"}
                  </p>
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
                <th className="whitespace-nowrap px-4 py-3 align-middle font-medium">Date</th>
                <th className="min-w-[220px] px-4 py-3 align-middle font-medium">Product</th>
                <th className="px-4 py-3 align-middle font-medium">Type</th>
                <th className="px-4 py-3 align-middle text-right font-medium">Qty</th>
                <th className="px-4 py-3 align-middle font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading && sorted.length === 0 ? (
                <SkeletonRows rows={6} cols={5} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <EmptyState
                      title="No stock movements"
                      description="Movements appear here when orders are placed or you adjust stock manually."
                      actions={
                        <Btn variant="ghost" size="xs" onClick={() => toast?.("Manual adjustment dialog (coming soon)")}>
                          Adjust stock
                        </Btn>
                      }
                    />
                  </td>
                </tr>
              ) : (
                paged.map((log) => (
                  <tr key={log.id} className="transition hover:bg-[#182238]/60">
                    <td className="align-middle whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                      {fmtDateTime(log.createdAt)}
                    </td>
                    <td className="align-middle px-4 py-3">
                      <div className="flex min-w-0 max-w-[280px] items-center gap-3">
                        <ProductThumbnail src={productImageFor(log)} alt={log.productName} size={40} />
                        <span className="truncate font-medium text-[#f8fafc]" title={log.productName}>
                          {log.productName}
                        </span>
                      </div>
                    </td>
                    <td className="align-middle whitespace-nowrap px-4 py-3">
                      <StatusBadge status={log.type} />
                    </td>
                    <td className="align-middle whitespace-nowrap px-4 py-3 text-right">
                      <QtyValue quantity={log.quantity} />
                    </td>
                    <td className="align-middle px-4 py-3">
                      <span
                        className="block max-w-[320px] truncate text-xs text-[#8b95a7]"
                        title={log.reason || undefined}
                      >
                        {log.reason || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && sorted.length > PAGE_SIZE && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <span className="text-xs font-medium text-[#8b95a7]">
              Show data{" "}
              <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
              of {sorted.length}
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
