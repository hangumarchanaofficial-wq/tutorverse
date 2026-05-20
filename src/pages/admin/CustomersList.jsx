import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  Crown,
  UserRoundPlus,
  Users,
  UserX,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Input,
  Select,
  Btn,
  ActionMenu,
  EmptyState,
  Skeleton,
  SkeletonRows,
  formatLkr,
  formatNum,
  timeAgo,
  fmtDate,
  useToast,
} from "../../admin/components/ui";
import { fetchAdminSeller, fetchAdminSellers } from "../../services/adminApi";
import { getMockSellerDetail, loadMockSellers } from "../../admin/utils/sellers";

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "totalSpent", label: "Total sales" },
  { value: "ordersCount", label: "Sales count" },
  { value: "lastOrder", label: "Last sale" },
  { value: "joinedAt", label: "Joined" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "repeat", label: "Established" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const TABLE_COLUMNS = [
  { key: "name", label: "Seller", align: "left" },
  { key: null, label: "Email", align: "left" },
  { key: null, label: "Phone", align: "left" },
  { key: "ordersCount", label: "Sales", align: "right" },
  { key: "totalSpent", label: "Total sales", align: "right" },
  { key: null, label: "Avg sale", align: "right" },
  { key: "lastOrder", label: "Last sale", align: "left" },
  { key: null, label: "Status", align: "left" },
  { key: "joinedAt", label: "Joined", align: "left" },
  { key: null, label: "", align: "right" },
];

/** Fallback initials — used if a portrait URL fails to load */
const AVATAR_PALETTE = [
  "#1e3a8a",
  "#1d4ed8",
  "#0369a1",
  "#0e7490",
  "#0f766e",
  "#15803d",
  "#4d7c0f",
  "#065f46",
  "#312e81",
];

/** Curated Unsplash portraits (face crop, sharp, editorial feel) — stable per seller via hash */
const PREMIUM_AVATAR_URLS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=face&auto=format&q=85",
];

function paletteIndex(seed) {
  let h = 0;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function firstInitial(name) {
  const part = (name || "?").trim().split(/\s+/)[0] || "?";
  return part[0].toUpperCase();
}

function dummyAvatarUrl(sellerId, name) {
  const i = paletteIndex(sellerId || name) % PREMIUM_AVATAR_URLS.length;
  return PREMIUM_AVATAR_URLS[i];
}

/** Portrait inside soft dark rounded frame; optional `photoUrl` overrides dummy; initials on error */
function SellerAvatar({ name, sellerId, photoUrl, size = "md" }) {
  const initial = firstInitial(name);
  const bg = AVATAR_PALETTE[paletteIndex(sellerId || name) % AVATAR_PALETTE.length];
  const src = photoUrl || dummyAvatarUrl(sellerId, name);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [sellerId, photoUrl, src]);

  const outer = size === "lg" ? "h-14 w-14 rounded-2xl p-1.5" : "h-11 w-11 rounded-xl p-1";
  const inner = size === "lg" ? "h-11 w-11 text-base" : "h-9 w-9 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#141820] ring-1 ring-[#2a3038] ${outer}`}
    >
      {!imgFailed ? (
        <img
          src={src}
          alt=""
          className={`${inner} rounded-full object-cover shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full font-bold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${inner}`}
          style={{ backgroundColor: bg }}
          aria-hidden
        >
          {initial}
        </div>
      )}
    </div>
  );
}

export default function CustomersList({ pageTitle = "All Sellers", pageSubtitle } = {}) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("totalSpent");
  const [sortDir, setSortDir] = useState("desc");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const [details, setDetails] = useState({}); // sellerId -> { orders, reviews, loading, error }
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { limit: 200 };
    if (search.trim()) params.q = search.trim();
    if (filter !== "all") params.filter = filter;

    try {
      const res = await fetchAdminSellers(params);
      setSellers(res?.items || []);
      setUsingMock(false);
    } catch {
      const mock = loadMockSellers(params);
      setSellers(mock.items);
      setUsingMock(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const loadDetail = useCallback(
    async (sellerId) => {
      if (details[sellerId]?.orders) return; // already cached
      setDetails((p) => ({ ...p, [sellerId]: { loading: true } }));
      try {
        const res = await fetchAdminSeller(sellerId);
        setDetails((p) => ({
          ...p,
          [sellerId]: { orders: res?.orders || [], reviews: res?.reviews || [], loading: false },
        }));
      } catch {
        const mock = getMockSellerDetail(sellerId);
        setDetails((p) => ({
          ...p,
          [sellerId]: {
            orders: mock.orders,
            reviews: mock.reviews,
            loading: false,
            mock: true,
          },
        }));
      }
    },
    [details]
  );

  const handleExpand = useCallback(
    (sellerId) => {
      setExpanded((prev) => {
        const next = prev === sellerId ? null : sellerId;
        if (next) loadDetail(next);
        return next;
      });
    },
    [loadDetail]
  );

  const kpis = useMemo(() => {
    const n = Date.now();
    const window30d = 30 * 864e5;
    const all = sellers;
    const newSellers = all.filter((c) => c.joinedAt && n - new Date(c.joinedAt).getTime() < window30d);
    const established = all.filter((c) => c.isRepeat);
    const topEarners = all.filter((c) => c.totalSpent > 100000);
    const active = all.filter((c) => c.status === "active");
    const inactive = all.filter((c) => c.status === "inactive");
    return [
      {
        label: "Total sellers",
        value: formatNum(all.length),
        icon: <Users className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "New (30d)",
        value: formatNum(newSellers.length),
        variant: "success",
        icon: <UserRoundPlus className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Established",
        value: formatNum(established.length),
        icon: <Award className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Top earners",
        value: formatNum(topEarners.length),
        icon: <Crown className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Active",
        value: formatNum(active.length),
        variant: "success",
        icon: <CircleCheck className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Inactive",
        value: formatNum(inactive.length),
        variant: "warning",
        icon: <UserX className="h-4 w-4" strokeWidth={2} />,
      },
    ];
  }, [sellers]);

  const filtered = useMemo(() => {
    const list = [...sellers];
    list.sort((a, b) => {
      let av, bv;
      switch (sort) {
        case "name": av = (a.name || "").toLowerCase(); bv = (b.name || "").toLowerCase(); break;
        case "totalSpent": av = a.totalSpent; bv = b.totalSpent; break;
        case "ordersCount": av = a.ordersCount; bv = b.ordersCount; break;
        case "lastOrder":
          av = a.lastOrder ? new Date(a.lastOrder).getTime() : 0;
          bv = b.lastOrder ? new Date(b.lastOrder).getTime() : 0;
          break;
        case "joinedAt":
          av = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          bv = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          break;
        default: av = 0; bv = 0;
      }
      if (sort === "name") return sortDir === "asc" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [sellers, sort, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, filter, sort, sortDir, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSort = (field) => {
    if (sort === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setSortDir("desc"); }
  };

  const toggleBlock = (id) => {
    setBlockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast("Seller unblocked"); }
      else { next.add(id); toast("Seller blocked", "warning"); }
      return next;
    });
  };

  const sellerMenuItems = (c) => {
    const isBlocked = blockedIds.has(c.id);
    return [
      { label: "View Details", onClick: () => handleExpand(c.id) },
      { divider: true },
      {
        label: isBlocked ? "Unblock" : "Block",
        danger: !isBlocked,
        onClick: () => toggleBlock(c.id),
      },
    ];
  };

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle ?? `${formatNum(sellers.length)} marketplace seller${sellers.length === 1 ? "" : "s"}`}
        actions={
          <Btn variant="ghost" size="sm" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Btn>
        }
      />

      {usingMock && (
        <div className="rounded-lg border border-[#d8b84f]/30 bg-[#d8b84f]/10 px-4 py-3 text-sm text-[#8b95a7]">
          Showing demo sellers — connect the API to load live marketplace data.{" "}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Search / Filter / Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 w-full flex-1 sm:max-w-xs">
          <Input
            placeholder="Search seller or shop name, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={FILTER_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={SORT_OPTIONS}
          />
        </div>
        <Btn
          variant="ghost"
          size="xs"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
        </Btn>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        {/* Mobile: seller, totals, status, actions; expand for detail */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading && filtered.length === 0 ? (
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </li>
            ))
          ) : filtered.length === 0 ? (
            <li className="px-4 py-14">
              <EmptyState title="No sellers found" description="Try adjusting your search or filter." />
            </li>
          ) : (
            paged.map((c) => {
              const isBlocked = blockedIds.has(c.id);
              const isOpen = expanded === c.id;
              return (
                <React.Fragment key={c.id}>
                  <li
                    className={`flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-[#182238]/60 ${isOpen ? "bg-[#182238]/80" : ""}`}
                    onClick={() => handleExpand(c.id)}
                  >
                    <SellerAvatar name={c.name} sellerId={c.id} photoUrl={c.photoUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#f8fafc]" title={c.name}>
                            {c.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#8b95a7]" title={c.storeName}>
                            {c.storeName || c.role || "Marketplace user"}
                          </p>
                        </div>
                        <StatusBadge status={isBlocked ? "inactive" : c.status} />
                      </div>
                      <p className="mt-1.5 text-xs text-[#8b95a7]">
                        {c.ordersCount} sales
                        {c.lastOrder ? ` · ${timeAgo(c.lastOrder)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={sellerMenuItems(c)} />
                    </div>
                  </li>
                  {isOpen && (
                    <li className="border-t border-[#263145]/60 bg-[#0f1726] px-4 py-4">
                      <SellerDetail seller={c} detail={details[c.id]} />
                    </li>
                  )}
                </React.Fragment>
              );
            })
          )}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-[960px] w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                {TABLE_COLUMNS.map((col, i) => (
                  <th
                    key={i}
                    onClick={col.key ? () => toggleSort(col.key) : undefined}
                    className={`align-middle whitespace-nowrap px-4 py-3 font-medium ${
                      col.align === "right" ? "text-right" : "text-left"
                    } ${col.key ? "cursor-pointer select-none hover:text-[#f8fafc]" : ""}`}
                  >
                    {col.label}
                    {col.key && sort === col.key && (
                      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading && filtered.length === 0 ? (
                <SkeletonRows rows={8} cols={10} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-14">
                    <EmptyState title="No sellers found" description="Try adjusting your search or filter." />
                  </td>
                </tr>
              ) : (
                paged.map((c) => {
                  const isBlocked = blockedIds.has(c.id);
                  const isOpen = expanded === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        onClick={() => handleExpand(c.id)}
                        className={`cursor-pointer transition hover:bg-[#182238]/60 ${isOpen ? "bg-[#182238]/80" : ""}`}
                      >
                        <td className="align-middle px-4 py-3">
                          <div className="flex min-w-0 max-w-[240px] items-center gap-3">
                            <SellerAvatar name={c.name} sellerId={c.id} photoUrl={c.photoUrl} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#f8fafc]" title={c.name}>
                                {c.name}
                              </p>
                              <p className="truncate text-xs text-[#8b95a7]" title={c.storeName}>
                                {c.storeName || c.role || "Marketplace user"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle max-w-[180px] px-4 py-3">
                          <span className="block truncate text-[#8b95a7]" title={c.email}>
                            {c.email || "—"}
                          </span>
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-[#8b95a7]">
                          {c.phone || "—"}
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#f8fafc]">
                          {c.ordersCount}
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#f8fafc]">
                          {formatLkr(c.totalSpent)}
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#8b95a7]">
                          {formatLkr(c.avgOrderValue)}
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-[#8b95a7]">
                          {c.lastOrder ? timeAgo(c.lastOrder) : "—"}
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3">
                          <StatusBadge status={isBlocked ? "inactive" : c.status} />
                        </td>
                        <td className="align-middle whitespace-nowrap px-4 py-3 text-[#8b95a7]">
                          {fmtDate(c.joinedAt)}
                        </td>
                        <td className="align-middle px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <ActionMenu items={sellerMenuItems(c)} />
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0f1726]">
                          <td colSpan={10} className="px-6 py-5">
                            <SellerDetail seller={c} detail={details[c.id]} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > pageSize && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-medium text-[#8b95a7]">
                Show data{" "}
                <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                of {filtered.length}
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

function SellerDetail({ seller, detail }) {
  const detailLoading = detail?.loading;
  const detailError = detail?.error;
  const linkedOrders = detail?.orders || [];
  const linkedReviews = detail?.reviews || [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Profile */}
      <div className="space-y-3 rounded-lg border border-[#263145] bg-[#121b2e] p-4">
        <div className="flex items-center gap-3">
          <SellerAvatar name={seller.name} sellerId={seller.id} photoUrl={seller.photoUrl} size="lg" />
          <h4 className="text-sm font-bold text-[#f8fafc]">Seller profile</h4>
        </div>
        <div className="space-y-2 text-xs">
          <Row label="Name" value={seller.name} />
          <Row label="Shop" value={seller.storeName || "—"} />
          <Row label="Email" value={seller.email || "—"} />
          <Row label="Phone" value={seller.phone || "—"} />
          <Row label="Joined" value={fmtDate(seller.joinedAt)} />
          <Row label="Status" value={<StatusBadge status={seller.status} />} />
          <Row label="Established" value={seller.isRepeat ? "Yes" : "No"} />
        </div>
      </div>

      {/* Linked orders */}
      <div className="space-y-3 rounded-lg border border-[#263145] bg-[#121b2e] p-4">
        <h4 className="text-sm font-bold text-[#f8fafc]">
          Linked orders
          <span className="ml-2 text-[11px] font-normal text-[#8b95a7]">({linkedOrders.length})</span>
        </h4>
        {detailLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : detailError ? (
          <p className="text-xs text-red-300">{detailError}</p>
        ) : linkedOrders.length === 0 ? (
          <p className="text-xs text-[#8b95a7]">No orders for this seller yet.</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {linkedOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md bg-[#182238] px-3 py-2">
                <div>
                  <span className="text-xs font-medium text-[#f8fafc]">{o.orderNumber}</span>
                  <span className="ml-2 text-[11px] text-[#8b95a7]">{timeAgo(o.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-[#f8fafc]">{formatLkr(o.totalAmount)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-[#263145] pt-2 text-xs text-[#8b95a7]">
          Total sales (roll-up): <span className="font-semibold text-[#f8fafc]">{formatLkr(seller.totalSpent)}</span>
        </div>
      </div>

      {/* Reviews on their listings */}
      <div className="space-y-3 rounded-lg border border-[#263145] bg-[#121b2e] p-4">
        <h4 className="text-sm font-bold text-[#f8fafc]">
          Listing reviews
          <span className="ml-2 text-[11px] font-normal text-[#8b95a7]">({linkedReviews.length})</span>
        </h4>
        {detailLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : linkedReviews.length === 0 ? (
          <p className="text-xs text-[#8b95a7]">No reviews yet.</p>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {linkedReviews.map((r) => (
              <div key={r.id} className="rounded-md bg-[#182238] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#f8fafc]">{r.productName}</span>
                  <MiniStars rating={r.rating} />
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-[#8b95a7]">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8b95a7]">{label}</span>
      <span className="text-[#f8fafc]">{value}</span>
    </div>
  );
}

function MiniStars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 20 20" fill={i <= rating ? "#d8b84f" : "#263145"}>
          <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78z" />
        </svg>
      ))}
    </div>
  );
}
