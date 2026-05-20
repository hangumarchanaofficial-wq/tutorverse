import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PageHeader, StatusBadge, Tabs,
  Btn, Input, Skeleton, EmptyState, fmtDateTime, useToast,
} from "../../admin/components/ui";
import { fetchAdminStockMovements } from "../../services/adminApi";
import {
  filterMockMovements,
  getMockStockMovementTabCounts,
  loadMockStockMovements,
  normalizeMockStockMovements,
} from "../../admin/utils/stockMovements";
import { stockLogs as mockStockLogs } from "../../admin/data/mockData";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "in", label: "Added" },
  { id: "out", label: "Sold" },
  { id: "adjustment", label: "Adjusted" },
];

export default function StockLogs() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
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
    <div className="space-y-6">
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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
          className="!w-64"
        />
        <Btn variant="ghost" size="xs" onClick={() => setSortAsc((s) => !s)}>
          Date: {sortAsc ? "Oldest first" : "Newest first"}
        </Btn>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading && sorted.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, c) => (
                      <td key={c} className="px-4 py-3">
                        <Skeleton className="h-3.5 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    <EmptyState
                      title="No stock movements"
                      description="Movements appear here when orders are placed or you adjust stock manually."
                      actions={
                        <Btn variant="ghost" size="xs" onClick={() => toast?.("Manual adjustment dialog (coming soon)") }>
                          Adjust stock
                        </Btn>
                      }
                    />
                  </td>
                </tr>
              ) : (
                sorted.map((log) => (
                  <tr key={log.id} className="transition hover:bg-[#182238]/60">
                    <td className="px-4 py-3 text-xs text-[#8b95a7] whitespace-nowrap">{fmtDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-[#f8fafc]">{log.productName}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.type} /></td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold tabular-nums ${
                          log.quantity > 0 ? "text-[#34d399]" : log.quantity < 0 ? "text-[#f87171]" : "text-[#8b95a7]"
                        }`}
                      >
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b95a7] max-w-[260px] truncate">{log.reason || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
