import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminAnalytics } from "../../services/adminApi";

// --------------------------------------------------------------------------
// formatting helpers
// --------------------------------------------------------------------------

function formatLkr(n, { compact = false } = {}) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  if (compact && Math.abs(x) >= 1000) {
    if (Math.abs(x) >= 1_000_000) return `LKR ${(x / 1_000_000).toFixed(1)}M`;
    return `LKR ${(x / 1000).toFixed(1)}k`;
  }
  return `LKR ${x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatNum(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString();
}

function formatPct(n, digits = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x >= 0 ? "+" : ""}${x.toFixed(digits)}%`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
}

// --------------------------------------------------------------------------
// chart primitives — pure SVG, no external deps
// --------------------------------------------------------------------------

function Skeleton({ className = "h-7 w-24" }) {
  return <span className={`inline-block animate-pulse rounded-md bg-white/[0.06] ${className}`} />;
}

function Sparkline({ values = [], height = 36, stroke = "#C8A951", fill = "rgba(200,169,81,0.18)" }) {
  if (!values.length) return <div style={{ height }} />;
  const width = 120;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${(values.length - 1) * stepX},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height={height} className="block">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AreaChart({ points = [], yKey = "revenue", color = "#C8A951", height = 240, formatY = (v) => v }) {
  const data = useMemo(() => {
    if (!points.length) return null;
    const values = points.map((p) => Number(p[yKey] || 0));
    const max = Math.max(1, ...values);
    return { values, max };
  }, [points, yKey]);
  if (!data) return null;

  const width = 720;
  const padL = 44;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const stepX = data.values.length > 1 ? innerW / (data.values.length - 1) : 0;
  const pts = data.values.map((v, i) => [
    padL + i * stepX,
    padT + innerH - (v / data.max) * innerH,
  ]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${padL + (data.values.length - 1) * stepX},${padT + innerH} L${padL},${padT + innerH} Z`;

  const yTicks = [0, 0.5, 1].map((t) => ({ y: padT + innerH * (1 - t), v: data.max * t }));
  const xLabels = (() => {
    if (points.length <= 6) return points.map((p, i) => ({ i, label: formatDate(p.date) }));
    const idxs = [0, Math.floor(points.length / 4), Math.floor(points.length / 2), Math.floor((points.length * 3) / 4), points.length - 1];
    return idxs.map((i) => ({ i, label: formatDate(points[i].date) }));
  })();

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="block overflow-visible">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={width - padR} y1={t.y} y2={t.y} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="ui-sans-serif">
            {formatY(t.v)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (i === pts.length - 1 ? (
        <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#111827" strokeWidth="1.5" />
      ) : null))}
      {xLabels.map(({ i, label }) => (
        <text
          key={`xl-${i}`}
          x={padL + i * stepX}
          y={height - 8}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(255,255,255,0.4)"
          fontFamily="ui-sans-serif"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function Donut({ segments = [], size = 180, thickness = 18, centerLabel, centerValue }) {
  const total = segments.reduce((s, x) => s + Number(x.value || 0), 0);
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  if (!total) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="flex h-full w-full items-center justify-center rounded-full border-[18px] border-white/[0.06]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-white/40">{centerLabel}</p>
            <p className="font-display text-xl font-bold text-white/40">0</p>
          </div>
        </div>
      </div>
    );
  }

  let offset = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const frac = Number(seg.value || 0) / total;
          const len = circ * frac;
          const dasharray = `${len} ${circ - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={seg.label || i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{centerLabel}</p>
          <p className="font-display text-2xl font-bold text-white">{centerValue ?? formatNum(total)}</p>
        </div>
      </div>
    </div>
  );
}

function BarList({ items = [], formatValue = (v) => v, emptyLabel = "No data yet" }) {
  if (!items.length) {
    return <p className="py-6 text-center text-xs text-white/40">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((it) => Number(it.value || 0))) || 1;
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const w = Math.max(4, (Number(it.value || 0) / max) * 100);
        return (
          <li key={it.label + i} className="space-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="truncate font-medium text-white">{it.label}</span>
              <span className="font-mono text-xs tabular-nums text-white/60">{formatValue(it.value)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full"
                style={{ width: `${w}%`, background: it.color || "linear-gradient(90deg,#C8A951,#B8952E)" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// --------------------------------------------------------------------------
// status / payment color tokens (dark theme)
// --------------------------------------------------------------------------

const STATUS_COLORS = {
  pending: "#F59E0B",
  processing: "#6366F1",
  shipped: "#0EA5E9",
  completed: "#10B981",
  cancelled: "#F43F5E",
  refunded: "#94A3B8",
};

const STATUS_TEXT = {
  pending: "text-amber-400 bg-amber-500/15",
  processing: "text-indigo-400 bg-indigo-500/15",
  shipped: "text-sky-400 bg-sky-500/15",
  completed: "text-emerald-400 bg-emerald-500/15",
  cancelled: "text-rose-400 bg-rose-500/15",
  refunded: "text-slate-400 bg-slate-500/15",
  paid: "text-emerald-400 bg-emerald-500/15",
  unpaid: "text-rose-400 bg-rose-500/15",
  failed: "text-rose-400 bg-rose-500/15",
};

function Pill({ label, kind }) {
  const tone = STATUS_TEXT[String(label).toLowerCase()] || "text-slate-400 bg-slate-500/15";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${tone}`}>
      {kind && <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[String(label).toLowerCase()] || "#94A3B8" }} />}
      {label}
    </span>
  );
}

// --------------------------------------------------------------------------
// KPI card (dark)
// --------------------------------------------------------------------------

function Delta({ value }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        positive ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      <span aria-hidden>{positive ? "▲" : "▼"}</span>
      {formatPct(Math.abs(value))}
    </span>
  );
}

function KpiCard({ label, hint, value, delta, sparkValues, sparkColor = "#C8A951", loading }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] p-5 shadow-premium transition-shadow hover:shadow-premium-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</p>
        {!loading && <Delta value={delta} />}
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white tabular-nums">
        {loading ? <Skeleton className="h-8 w-32" /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
      {sparkValues && (
        <div className="mt-4 -mx-1">
          {loading ? <Skeleton className="h-9 w-full" /> : <Sparkline values={sparkValues} stroke={sparkColor} fill={`${sparkColor}25`} />}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// dashboard
// --------------------------------------------------------------------------

const RANGE_OPTIONS = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
];

const EMPTY_DATA = {
  range: "30d",
  rangeDays: 30,
  generatedAt: null,
  kpis: {
    revenue: { value: null, delta: null, spark: [] },
    orders: { value: null, delta: null, spark: [] },
    aov: { value: null, delta: null },
    newCustomers: { value: null, delta: null },
  },
  totals: {
    ordersAllTime: null,
    productsActive: null,
    usersTotal: null,
    pendingOrders: null,
    completedOrders: null,
    cancelledOrders: null,
    pendingReviews: null,
    lowStock: null,
  },
  salesByDay: [],
  statusBreakdown: [],
  paymentMix: [],
  topCategories: [],
  topProducts: [],
  recentOrders: [],
  recentReviews: [],
};

export default function AdminDashboard() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activityTab, setActivityTab] = useState("orders");
  const [copied, setCopied] = useState(false);

  const lastRefreshedAt = useRef(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const load = useCallback(
    (selectedRange, fresh = false) => {
      setError("");
      if (fresh) setRefreshing(true);
      else setLoading(true);
      return fetchAdminAnalytics({ range: selectedRange, fresh })
        .then((d) => {
          setData(d);
          lastRefreshedAt.current = Date.now();
          setSecondsAgo(0);
        })
        .catch((e) => setError(e.message || "Failed to load analytics"))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    []
  );

  useEffect(() => {
    load(range);
  }, [range, load]);

  const kpi = data.kpis || {};
  const totals = data.totals || {};

  const donutSegments = useMemo(() => {
    return (data.statusBreakdown || []).map((s) => ({
      label: s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] || "#94A3B8",
    }));
  }, [data.statusBreakdown]);

  const totalOrdersInRange = donutSegments.reduce((s, x) => s + Number(x.value || 0), 0);

  const exportKpiJson = () => {
    const payload = {
      range: data.range,
      rangeDays: data.rangeDays,
      generatedAt: data.generatedAt,
      kpis: data.kpis,
      totals: data.totals,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Operations · Overview
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-white">Store performance</h1>
          <p className="mt-1 text-sm text-white/50">
            Revenue, fulfilment and customer health — last refreshed{" "}
            <span className="font-mono text-white/70 tabular-nums">
              {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/[0.06] bg-[#111827] p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === opt.id
                    ? "bg-brand-gold text-navy-950 shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Last {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportKpiJson}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.1]"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Copied
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                Export KPI
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => load(range, true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.1] disabled:opacity-50"
          >
            <span className={refreshing ? "animate-spin" : ""} aria-hidden>↻</span>
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error} — showing last known data.
        </div>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Revenue · last ${data.rangeDays || 30}d`}
          value={formatLkr(kpi.revenue?.value)}
          delta={kpi.revenue?.delta}
          sparkValues={kpi.revenue?.spark}
          sparkColor="#C8A951"
          loading={loading}
          hint="Sum of order totals (paid + pending)"
        />
        <KpiCard
          label="Orders"
          value={formatNum(kpi.orders?.value)}
          delta={kpi.orders?.delta}
          sparkValues={kpi.orders?.spark}
          sparkColor="#6366F1"
          loading={loading}
          hint={`vs prior ${data.rangeDays || 30}d`}
        />
        <KpiCard
          label="Avg order value"
          value={formatLkr(kpi.aov?.value)}
          delta={kpi.aov?.delta}
          loading={loading}
          hint="Revenue ÷ orders"
        />
        <KpiCard
          label="New customers"
          value={formatNum(kpi.newCustomers?.value)}
          delta={kpi.newCustomers?.delta}
          loading={loading}
          hint="First-time signups"
        />
      </div>

      {/* Health strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <HealthChip to="/admin/orders?status=pending" label="Pending orders" value={totals.pendingOrders} tone="amber" loading={loading} />
        <HealthChip to="/admin/orders?status=cancelled" label="Cancelled" value={totals.cancelledOrders} tone="rose" loading={loading} />
        <HealthChip to="/admin/reviews?status=pending" label="Reviews to moderate" value={totals.pendingReviews} tone="indigo" loading={loading} />
        <HealthChip to="/admin/products" label="Low stock (≤ 5)" value={totals.lowStock} tone="rose" loading={loading} />
        <HealthChip to="/admin/products" label="Active products" value={totals.productsActive} tone="emerald" loading={loading} />
      </div>

      {/* Trend + Donut */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-premium xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Revenue trend</h2>
              <p className="text-xs text-white/40">
                Daily gross revenue across the last {data.rangeDays || 30} days
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Legend color="#C8A951" label="Revenue" />
              <Legend color="#6366F1" label="Orders" dashed />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <AreaChart
                points={data.salesByDay}
                yKey="revenue"
                color="#C8A951"
                height={260}
                formatY={(v) => formatLkr(v, { compact: true })}
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-premium">
          <h2 className="font-display text-lg font-bold text-white">Order status mix</h2>
          <p className="text-xs text-white/40">In the selected period</p>
          <div className="mt-6 flex flex-col items-center gap-6">
            {loading ? (
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            ) : (
              <Donut segments={donutSegments} centerLabel="Orders" centerValue={formatNum(totalOrdersInRange)} />
            )}
            <ul className="grid w-full grid-cols-2 gap-2">
              {(loading ? [{}, {}, {}, {}] : donutSegments).map((seg, i) => (
                <li key={seg.label || i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-2 capitalize text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: seg.color || "rgba(255,255,255,0.1)" }} />
                    {loading ? <Skeleton className="h-3 w-14" /> : seg.label || "—"}
                  </span>
                  <span className="font-mono tabular-nums text-white">
                    {loading ? <Skeleton className="h-3 w-6" /> : formatNum(seg.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Top categories + Top products */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-premium">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Top categories</h2>
              <p className="text-xs text-white/40">By revenue in the selected period</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-brand-gold hover:text-brand-gold-light">
              Manage →
            </Link>
          </div>
          <div className="mt-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <BarList
                items={(data.topCategories || []).map((c) => ({ label: c.name, value: c.revenue }))}
                formatValue={(v) => formatLkr(v, { compact: true })}
                emptyLabel="No category sales recorded yet."
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-premium">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Top products</h2>
              <p className="text-xs text-white/40">Best sellers by revenue</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-brand-gold hover:text-brand-gold-light">
              View all →
            </Link>
          </div>
          <div className="mt-5 divide-y divide-white/[0.06]">
            {loading ? (
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : (data.topProducts || []).length === 0 ? (
              <p className="py-6 text-center text-xs text-white/40">
                No product orders in this window yet.
              </p>
            ) : (
              data.topProducts.map((p, idx) => (
                <div key={p.id || p.title || idx} className="flex items-center gap-3 py-3">
                  <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-white/[0.06] text-xs font-bold text-white/40">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      `#${idx + 1}`
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{p.title || "Untitled"}</p>
                    <p className="text-[11px] text-white/40">{formatNum(p.qty)} sold</p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums text-white">
                    {formatLkr(p.revenue, { compact: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity + Quick actions */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
            <div className="flex items-center gap-1">
              {[
                { id: "orders", label: "Recent orders" },
                { id: "reviews", label: "New reviews" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivityTab(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activityTab === t.id
                      ? "bg-brand-gold text-navy-950"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-gold hover:text-brand-gold-light">
              View all →
            </Link>
          </div>
          {activityTab === "orders" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-6 py-2.5">Order</th>
                    <th className="px-6 py-2.5">Customer</th>
                    <th className="px-6 py-2.5">Total</th>
                    <th className="px-6 py-2.5">Status</th>
                    <th className="px-6 py-2.5">Payment</th>
                    <th className="px-6 py-2.5">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {loading ? (
                    [0, 1, 2, 3].map((i) => (
                      <tr key={i}>
                        {[0, 1, 2, 3, 4, 5].map((j) => (
                          <td key={j} className="px-6 py-3">
                            <Skeleton className="h-3 w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (data.recentOrders || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-white/50">
                        No orders yet — once customers check out they will appear here.
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((o) => (
                      <tr key={o.id} className="transition hover:bg-white/[0.03]">
                        <td className="px-6 py-3">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="font-mono text-xs font-semibold text-brand-gold hover:text-brand-gold-light"
                          >
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-white">{o.customer_name}</p>
                          <p className="text-[11px] text-white/40">{o.customer_email}</p>
                        </td>
                        <td className="px-6 py-3 font-mono text-sm font-semibold tabular-nums text-white">
                          {formatLkr(o.total_amount)}
                        </td>
                        <td className="px-6 py-3">
                          <Pill label={o.status} kind="status" />
                        </td>
                        <td className="px-6 py-3">
                          <Pill label={o.payment_status || "—"} />
                        </td>
                        <td className="px-6 py-3 text-xs text-white/40">{timeAgo(o.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="px-6 py-4">
                    <Skeleton className="mb-2 h-3 w-24" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))
              ) : (data.recentReviews || []).length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-white/50">
                  No reviews submitted yet.
                </p>
              ) : (
                data.recentReviews.map((r) => (
                  <div key={r.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white/40">Product #{r.product_id}</span>
                        <span className="text-amber-400" aria-label={`${r.rating} stars`}>
                          {"★".repeat(r.rating)}
                          <span className="text-white/10">{"★".repeat(5 - r.rating)}</span>
                        </span>
                      </div>
                      <Pill label={r.is_approved ? "approved" : "pending"} />
                    </div>
                    {r.comment && <p className="mt-1 line-clamp-2 text-sm text-white/70">{r.comment}</p>}
                    <p className="mt-1 text-[11px] text-white/30">{timeAgo(r.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-premium">
            <h2 className="font-display text-lg font-bold text-white">Payment mix</h2>
            <p className="text-xs text-white/40">By processed amount in window</p>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : (
                <BarList
                  items={(data.paymentMix || []).map((p) => ({
                    label: (p.method || "unknown").replace(/_/g, " "),
                    value: p.amount,
                  }))}
                  formatValue={(v) => formatLkr(v, { compact: true })}
                  emptyLabel="No payments yet."
                />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-[#111827] to-[#0B0F19] p-6 text-white shadow-premium">
            <h2 className="font-display text-lg font-bold">Quick actions</h2>
            <p className="mt-1 text-xs text-white/40">Jump to common operations</p>
            <div className="mt-4 grid gap-2">
              <QuickLink to="/admin/products">Manage products</QuickLink>
              <QuickLink to="/admin/categories">Manage categories</QuickLink>
              <QuickLink to="/admin/coupons">Manage coupons</QuickLink>
              <QuickLink to="/admin/reviews?status=pending">Moderate reviews</QuickLink>
              <QuickLink to="/admin/stock">Stock report</QuickLink>
            </div>
          </div>
        </div>
      </div>

      {/* footer meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-white/30">
        <span>
          All-time orders: <strong className="font-mono tabular-nums text-white/60">{formatNum(totals.ordersAllTime)}</strong>
          <span className="px-2">·</span>
          Customers: <strong className="font-mono tabular-nums text-white/60">{formatNum(totals.usersTotal)}</strong>
        </span>
        <span>
          Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}
        </span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// small inline helpers (dark theme)
// --------------------------------------------------------------------------

function HealthChip({ to, label, value, tone = "stone", loading }) {
  const tones = {
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    stone: "bg-white/[0.03] text-white/60 border-white/[0.06]",
  };
  const klass = tones[tone] || tones.stone;
  const inner = (
    <div className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-shadow hover:shadow-premium ${klass}`}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-bold tabular-nums text-white">
          {loading ? <Skeleton className="h-6 w-10" /> : formatNum(value)}
        </p>
      </div>
      <span className="text-xs font-semibold opacity-40 transition group-hover:opacity-100" aria-hidden>→</span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function Legend({ color, label, dashed }) {
  return (
    <span className="inline-flex items-center gap-2 text-white/60">
      <svg width="22" height="6" viewBox="0 0 22 6">
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "3 3" : ""} />
      </svg>
      {label}
    </span>
  );
}

function QuickLink({ to, children }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-brand-gold/30 hover:bg-white/[0.06] hover:text-white"
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}
