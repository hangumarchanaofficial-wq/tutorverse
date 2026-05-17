import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminAnalytics } from "../../services/adminApi";
import { formatLkr, formatNum, timeAgo } from "../../admin/components/ui";

/* ─── helpers ─────────────────────────────────────── */
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=80&h=80&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&h=80&fit=crop&auto=format",
];

function Thumb({ src, alt, idx, rounded = false }) {
  const [url, setUrl] = useState(src || FALLBACK_IMGS[idx % FALLBACK_IMGS.length]);
  useEffect(() => {
    setUrl(src || FALLBACK_IMGS[idx % FALLBACK_IMGS.length]);
  }, [src, idx]);
  return (
    <img
      src={url}
      alt={alt}
      className={`h-10 w-10 shrink-0 object-cover ${rounded ? "rounded-full" : "rounded-lg"}`}
      onError={() => setUrl(FALLBACK_IMGS[idx % FALLBACK_IMGS.length])}
    />
  );
}

const PALETTE = ["#fb923c", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

/* ─── Smooth animated area spark (interactive) ───── */
function AreaSpark({ color, points }) {
  const W = 300; const H = 90;
  const safe = (points || []).map((v) => Number(v) || 0);
  const n = safe.length;
  const max = n ? Math.max(...safe) : 1;
  const min = n ? Math.min(...safe) : 0;
  const rng = Math.max(max - min, 1);
  const pad = 8;
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  if (n < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    );
  }

  const pts = safe.map((v, i) => [
    (i / (n - 1)) * (W - pad * 2) + pad,
    H - pad - ((v - min) / rng) * (H - pad * 2.5),
  ]);

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * 0.45;
    const cp1y = pts[i - 1][1];
    const cp2x = pts[i][0] - (pts[i][0] - pts[i - 1][0]) * 0.45;
    const cp2y = pts[i][1];
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${pts[i][0]} ${pts[i][1]}`;
  }
  const area = `${d} L ${W - pad} ${H} L ${pad} ${H} Z`;

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const idx = Math.max(0, Math.min(n - 1, Math.round(pct * (n - 1))));
    setHoverIdx(idx);
  };

  const gid = `sg-${color.replace("#", "")}`;
  const hx = hoverIdx !== null ? pts[hoverIdx][0] : null;
  const hy = hoverIdx !== null ? pts[hoverIdx][1] : null;
  const tipX = hx !== null ? Math.max(4, Math.min(W - 52, hx - 24)) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-20 w-full cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={d} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 600, strokeDashoffset: 600, animation: "lineDraw 1s ease forwards" }}
      />
      {hoverIdx !== null && (
        <>
          <line x1={hx} y1={pad} x2={hx} y2={H - pad} stroke={color} strokeWidth="1" strokeDasharray="3 2" opacity="0.45" />
          <circle cx={hx} cy={hy} r="4.5" fill="white" stroke={color} strokeWidth="2" />
          <rect x={tipX} y={hy - 30} width="48" height="20" rx="5" fill="#1f2937" />
          <text x={tipX + 24} y={hy - 16} textAnchor="middle" fontSize="10" fontWeight="700" fill="white">
            {formatNum(safe[hoverIdx])}
          </text>
        </>
      )}
    </svg>
  );
}

/* ─── Animated donut (interactive) ───────────────── */
function AnimDonut({ segments, cx = 110, cy = 110, r = 78, sw = 28, onHover }) {
  const [drawn, setDrawn] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 100); return () => clearTimeout(t); }, []);
  const circ = 2 * Math.PI * r;

  const sectors = (() => {
    let cum = 0;
    return segments.map((seg) => {
      const a0 = (cum / 100) * 2 * Math.PI - Math.PI / 2;
      cum += seg.pct;
      const a1 = (cum / 100) * 2 * Math.PI - Math.PI / 2;
      const ro = r + sw / 2;
      const ri = r - sw / 2;
      const large = seg.pct > 50 ? 1 : 0;
      const d = [
        `M ${cx + ro * Math.cos(a0)} ${cy + ro * Math.sin(a0)}`,
        `A ${ro} ${ro} 0 ${large} 1 ${cx + ro * Math.cos(a1)} ${cy + ro * Math.sin(a1)}`,
        `L ${cx + ri * Math.cos(a1)} ${cy + ri * Math.sin(a1)}`,
        `A ${ri} ${ri} 0 ${large} 0 ${cx + ri * Math.cos(a0)} ${cy + ri * Math.sin(a0)}`,
        "Z",
      ].join(" ");
      return d;
    });
  })();

  let offset = 0;
  return (
    <svg viewBox="0 0 220 220" className="h-full w-full drop-shadow-sm">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      {segments.map((seg, i) => {
        const dash = drawn ? (seg.pct / 100) * circ : 0;
        const gap = circ - dash;
        const rot = -90 + (offset / 100) * 360;
        offset += seg.pct;
        const isActive = activeIdx === i;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={isActive ? sw + 5 : sw}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(${rot} ${cx} ${cy})`}
            style={{ transition: `stroke-dasharray 900ms ease ${i * 150}ms, stroke-width 200ms ease` }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill="white" />
      {sectors.map((d, i) => (
        <path
          key={i} d={d} fill="transparent"
          className="cursor-pointer"
          onMouseEnter={() => { setActiveIdx(i); onHover && onHover(i); }}
          onMouseLeave={() => { setActiveIdx(null); onHover && onHover(null); }}
        />
      ))}
    </svg>
  );
}

/* ─── Animated bar + line chart (interactive) ───── */
function BarLineChart({ bars, line, months }) {
  const [drawn, setDrawn] = useState(false);
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, []);

  const W = 580; const H = 190;
  const bw = 22; const gap = 26;
  const safeBars = bars.map((v) => Number(v) || 0);
  const safeLine = line.map((v) => Number(v) || 0);
  const maxV = Math.max(...safeBars, 1);
  const maxLine = Math.max(...safeLine, 1);

  const linePts = safeLine.map((v, i) => {
    const x = 20 + i * (bw + gap) + bw / 2;
    const y = H - 30 - (v / maxLine) * (H - 50);
    return [x, y];
  });
  let linePath = `M ${linePts[0]?.[0] || 0} ${linePts[0]?.[1] || 0}`;
  for (let i = 1; i < linePts.length; i++) {
    const cp1x = linePts[i - 1][0] + (linePts[i][0] - linePts[i - 1][0]) * 0.4;
    const cp2x = linePts[i][0] - (linePts[i][0] - linePts[i - 1][0]) * 0.4;
    linePath += ` C ${cp1x} ${linePts[i - 1][1]} ${cp2x} ${linePts[i][1]} ${linePts[i][0]} ${linePts[i][1]}`;
  }

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = -1; let minD = Infinity;
    safeBars.forEach((_, i) => {
      const cx = 20 + i * (bw + gap) + bw / 2;
      const d = Math.abs(svgX - cx);
      if (d < minD) { minD = d; closest = i; }
    });
    setHov(minD < (bw + gap) * 0.75 ? closest : null);
  };

  const tipW = 145; const tipH = 62;
  const tipX = hov !== null ? Math.max(4, Math.min(W - tipW - 4, 20 + hov * (bw + gap) + bw / 2 - tipW / 2)) : 0;
  const barTopY = hov !== null ? H - 30 - (safeBars[hov] / maxV) * (H - 50) : 0;
  const lineY = hov !== null ? linePts[hov][1] : 0;
  const tipY = hov !== null ? Math.max(4, Math.min(barTopY, lineY) - tipH - 8) : 0;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHov(null)}
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="10" y1={H - 30 - f * (H - 50)} x2={W - 10} y2={H - 30 - f * (H - 50)}
          stroke="#f3f4f6" strokeWidth="1" />
      ))}

      {hov !== null && (
        <line
          x1={20 + hov * (bw + gap) + bw / 2} y1={12}
          x2={20 + hov * (bw + gap) + bw / 2} y2={H - 30}
          stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3"
        />
      )}

      {safeBars.map((v, i) => {
        const x = 20 + i * (bw + gap);
        const fullH = (v / maxV) * (H - 50);
        const h = drawn ? fullH : 2;
        const y = H - 30 - h;
        return (
          <rect key={i} x={x} y={y} width={bw} height={h} rx="5"
            fill={hov === i ? "#f97316" : "#fb923c"}
            style={{ transition: `height 700ms ease ${i * 40}ms, y 700ms ease ${i * 40}ms, fill 150ms` }}
          />
        );
      })}

      {linePts.length > 1 && (
        <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 900, strokeDashoffset: drawn ? 0 : 900, transition: "stroke-dashoffset 1.2s ease 0.3s" }}
        />
      )}

      {hov !== null && linePts[hov] && (
        <circle cx={linePts[hov][0]} cy={linePts[hov][1]} r="5"
          fill="white" stroke="#a78bfa" strokeWidth="2.5" />
      )}

      {months.map((m, i) => (
        <text key={i} x={20 + i * (bw + gap) + bw / 2} y={H - 8}
          textAnchor="middle" fontSize="9"
          fill={hov === i ? "#374151" : "#9ca3af"}
          fontWeight={hov === i ? "700" : "400"}>
          {m}
        </text>
      ))}

      {hov !== null && (
        <g>
          <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="8"
            fill="white" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.13))" />
          <text x={tipX + 10} y={tipY + 17} fontSize="10" fontWeight="700" fill="#374151">
            {months[hov]}
          </text>
          <circle cx={tipX + 10} cy={tipY + 31} r="4" fill="#fb923c" />
          <text x={tipX + 20} y={tipY + 35} fontSize="10" fill="#6b7280">Revenue</text>
          <text x={tipX + tipW - 8} y={tipY + 35} fontSize="10" fontWeight="700" fill="#111827" textAnchor="end">
            {formatLkr(safeBars[hov], true)}
          </text>
          <circle cx={tipX + 10} cy={tipY + 49} r="4" fill="#a78bfa" />
          <text x={tipX + 20} y={tipY + 53} fontSize="10" fill="#6b7280">Orders</text>
          <text x={tipX + tipW - 8} y={tipY + 53} fontSize="10" fontWeight="700" fill="#111827" textAnchor="end">
            {formatNum(safeLine[hov])}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─── KPI card icon backgrounds ─────────────────── */
const KPI_ICONS = [
  { bg: "#dcfce7", stroke: "#16a34a", path: "M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H6" },
  { bg: "#ffedd5", stroke: "#ea580c", path: "M4 7h16M7 4v6m10-6v6M5 10h14v10H5z" },
  { bg: "#ede9fe", stroke: "#7c3aed", path: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { bg: "#dbeafe", stroke: "#1d4ed8", path: "M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

const RANGE_OPTIONS = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];

/* ─── Status badge mapping (mirrors backend statuses) ────── */
function statusLabel(o) {
  if (o.payment_status === "paid" && o.status === "completed") return "Completed";
  if (o.payment_status === "paid") return "Paid";
  if (o.status === "cancelled") return "Cancel";
  if (o.status === "completed") return "Completed";
  if (o.status === "processing") return "Processing";
  return "Pending";
}

const STATUS_STYLE = {
  Paid: "bg-emerald-50 text-emerald-600",
  Completed: "bg-violet-50 text-violet-600",
  Cancel: "bg-red-50 text-red-500",
  Processing: "bg-blue-50 text-blue-600",
  Pending: "bg-amber-50 text-amber-600",
};

/* ─── Skeleton blocks ────────────────────────────── */
function SkBlock({ h = "h-24", w = "w-full" }) {
  return <div className={`animate-pulse rounded-2xl bg-[#e5e7eb] ${h} ${w}`} />;
}

/* ─── Main component ────────────────────────────── */
export default function Dashboard() {
  const [hoverSegIdx, setHoverSegIdx] = useState(null);
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (opts = {}) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchAdminAnalytics({ range, fresh: opts.fresh });
        setData(payload);
      } catch (e) {
        setError(e?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    },
    [range]
  );

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Derived view models ───────────────────────────── */
  const kpis = data?.kpis;
  const totals = data?.totals;
  const salesByMonth = data?.salesByMonth || [];
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const provinces = data?.customerLocations?.provinces || [];
  const cities = data?.customerLocations?.cities || [];
  const totalSampledOrders = data?.customerLocations?.sampledOrders || 0;

  const metricCards = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        key: "earnings",
        label: "Total Earnings",
        value: formatLkr(kpis.revenue?.value || 0, true),
        delta: kpis.revenue?.delta || 0,
        accent: "#22c55e",
        pts: kpis.revenue?.spark || [],
      },
      {
        key: "orders",
        label: "Total Orders",
        value: formatNum(kpis.orders?.value || 0),
        delta: kpis.orders?.delta || 0,
        accent: "#f97316",
        pts: kpis.orders?.spark || [],
      },
      {
        key: "aov",
        label: "Avg. Order Value",
        value: formatLkr(kpis.aov?.value || 0, true),
        delta: kpis.aov?.delta || 0,
        accent: "#8b5cf6",
        pts: kpis.revenue?.spark || [],
      },
      {
        key: "newCustomers",
        label: "New Customers",
        value: formatNum(kpis.newCustomers?.value || 0),
        delta: kpis.newCustomers?.delta || 0,
        accent: "#3b82f6",
        pts: kpis.orders?.spark || [],
      },
    ];
  }, [kpis]);

  const monthLabels = salesByMonth.map((m) => m.label);
  const monthRevenue = salesByMonth.map((m) => m.revenue);
  const monthOrders = salesByMonth.map((m) => m.orders);
  const totalRangeRevenue = monthRevenue.reduce((s, v) => s + v, 0);
  const totalRangeOrders = monthOrders.reduce((s, v) => s + v, 0);

  const donutSegments = useMemo(() => {
    const mix = data?.paymentMix || [];
    if (!mix.length) return [];
    const total = mix.reduce((s, p) => s + p.amount, 0) || 1;
    return mix.slice(0, 5).map((p, i) => ({
      pct: (p.amount / total) * 100,
      color: PALETTE[i % PALETTE.length],
      label: String(p.method || "unknown").toUpperCase(),
      value: formatLkr(p.amount, true),
      count: p.count,
    }));
  }, [data?.paymentMix]);

  const topRegionMaxOrders = Math.max(1, ...provinces.map((p) => p.orders));

  /* ─── Render ───────────────────────────────────────── */
  return (
    <div className="bg-[#f4f5f7] p-4 lg:p-5">
      <style>{`
        @keyframes lineDraw { to { stroke-dashoffset: 0; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
      `}</style>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">Dashboard</h1>
          <p className="text-xs text-[#9ca3af]">
            Commerce performance overview
            {data?.generatedAt && (
              <span className="ml-2 text-[#9ca3af]">· updated {timeAgo(data.generatedAt)}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-[#e5e7eb] bg-white text-xs shadow-sm">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 font-medium transition ${
                  range === r.id ? "bg-[#fb923c] text-white" : "text-[#374151] hover:bg-gray-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => load({ fresh: true })}
            disabled={loading}
            className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <button onClick={() => load({ fresh: true })} className="ml-2 underline">
            Try again
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => <SkBlock key={i} h="h-44" />)
          : metricCards.map((m, ki) => (
              <div
                key={m.key}
                className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm"
                style={{ animation: `fadeUp 500ms ease ${ki * 80}ms both` }}
              >
                <div className="flex items-center justify-between px-4 pt-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: KPI_ICONS[ki].bg }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={KPI_ICONS[ki].stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d={KPI_ICONS[ki].path} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#9ca3af]">{m.label}</p>
                      <p
                        className={`flex items-center gap-1 text-[11px] font-semibold ${
                          m.delta >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className={`h-3 w-3 ${m.delta < 0 ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {Math.abs(m.delta).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md border border-[#e5e7eb] px-2 py-1 text-[10px] text-[#6b7280]">
                    {RANGE_OPTIONS.find((r) => r.id === range)?.label}
                  </span>
                </div>
                <p className="px-4 pt-2 text-[28px] font-bold leading-none text-[#111827]">{m.value}</p>
                <div className="px-0 pb-0 pt-1">
                  <AreaSpark color={m.accent} points={m.pts} />
                </div>
              </div>
            ))}
      </div>

      {/* Charts row */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
        {/* Revenue bar+line */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Revenue</h3>
              <div className="mt-1 flex flex-wrap items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#fb923c]" />
                  <span className="text-[#9ca3af]">Revenue</span>
                  <span className="font-semibold text-[#111827]">{formatLkr(totalRangeRevenue, true)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#a78bfa]" />
                  <span className="text-[#9ca3af]">Orders</span>
                  <span className="font-semibold text-[#111827]">{formatNum(totalRangeOrders)}</span>
                </span>
              </div>
            </div>
            <span className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] text-[#6b7280]">12 months</span>
          </div>
          <div className="h-52">
            {salesByMonth.length ? (
              <BarLineChart bars={monthRevenue} line={monthOrders} months={monthLabels} />
            ) : loading ? (
              <SkBlock h="h-full" />
            ) : (
              <p className="grid h-full place-items-center text-xs text-[#9ca3af]">No sales data yet.</p>
            )}
          </div>
        </div>

        {/* Channel mix donut (replaces "Promotional Sales") */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#111827]">Channel Mix</h3>
            <span className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] text-[#6b7280]">
              {RANGE_OPTIONS.find((r) => r.id === range)?.label}
            </span>
          </div>
          <p className="mb-3 text-xs text-[#6b7280]">
            Orders <span className="font-bold text-[#111827]">{formatNum(totalRangeOrders)}</span>
          </p>
          {donutSegments.length ? (
            <>
              <div className="relative mx-auto mb-3 h-44 w-44">
                <AnimDonut segments={donutSegments} onHover={setHoverSegIdx} />
                {(() => {
                  const seg = hoverSegIdx !== null ? donutSegments[hoverSegIdx] : donutSegments[0];
                  return (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-all duration-200">
                      <p className="text-[10px] text-[#9ca3af]">{seg.label}</p>
                      <p className="text-base font-bold text-[#111827]">{seg.value}</p>
                      <p className="text-[10px] text-[#9ca3af]">{formatNum(seg.count)} orders</p>
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-2">
                {donutSegments.map((s, i) => (
                  <div
                    key={s.label}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${hoverSegIdx === i ? "bg-[#f9fafb]" : ""}`}
                    onMouseEnter={() => setHoverSegIdx(i)}
                    onMouseLeave={() => setHoverSegIdx(null)}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium text-[#374151]">{s.label}</span>
                    <span className="ml-auto font-semibold text-[#1f2937]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : loading ? (
            <SkBlock h="h-44" />
          ) : (
            <p className="grid h-44 place-items-center text-xs text-[#9ca3af]">No payments captured yet.</p>
          )}
        </div>

        {/* Top sale */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#111827]">Top sale</h3>
            <Link to="/admin/products" className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] text-[#6b7280] hover:bg-gray-50">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {loading && !topProducts.length ? (
              <SkBlock h="h-40" />
            ) : topProducts.length ? (
              topProducts.map((p, i) => (
                <div key={p.id || p.title} className="flex items-center gap-3">
                  <Thumb src={p.image} alt={p.title} idx={i} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#111827]">{p.title}</p>
                    <p className="text-xs text-[#9ca3af]">{formatLkr(p.revenue, true)}</p>
                  </div>
                  <p className="shrink-0 text-xs font-medium text-[#374151]">{formatNum(p.qty)} sold</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-[#9ca3af]">No sales in this range.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Recent orders */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#111827]">Recent orders</h3>
            <Link to="/admin/orders" className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] text-[#6b7280] hover:bg-gray-50">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-[#f3f4f6] text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                  <th className="pb-2 pr-4">Order</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Placed</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {loading && !recentOrders.length ? (
                  <tr>
                    <td colSpan={5} className="py-4">
                      <SkBlock h="h-24" />
                    </td>
                  </tr>
                ) : recentOrders.length ? (
                  recentOrders.map((o, idx) => {
                    const status = statusLabel(o);
                    return (
                      <tr key={o.id} className="text-sm text-[#374151]">
                        <td className="py-3 pr-4">
                          <Link
                            to={`/admin/orders/${o.id}`}
                            className="flex items-center gap-2.5 font-medium text-[#111827] hover:text-[#fb923c]"
                          >
                            <Thumb idx={idx} alt={o.order_number} />
                            <span>{o.order_number}</span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-[#6b7280]">
                          {o.customer_name || "—"}
                          {o.customer_email && (
                            <p className="text-[11px] text-[#9ca3af]">{o.customer_email}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-[#6b7280]">{timeAgo(o.created_at)}</td>
                        <td className="py-3 pr-4 font-medium">{formatLkr(o.total_amount, true)}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#9ca3af]">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#f3f4f6] pt-3 text-[11px] text-[#9ca3af]">
            <span>
              Showing {recentOrders.length} of {formatNum(totals?.ordersAllTime || 0)} total
            </span>
            <div className="flex items-center gap-3">
              {totals?.lowStock > 0 && (
                <Link to="/admin/stock" className="text-[#ef4444] hover:underline">
                  {totals.lowStock} low-stock items
                </Link>
              )}
              {totals?.pendingReviews > 0 && (
                <Link to="/admin/reviews" className="text-[#fb923c] hover:underline">
                  {totals.pendingReviews} reviews to moderate
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Customer Locations (Sri Lanka) */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#111827]">Customer Locations</h3>
            <span className="rounded-lg border border-[#e5e7eb] px-2.5 py-1 text-[11px] text-[#6b7280]">Sri Lanka</span>
          </div>
          {loading && !provinces.length ? (
            <SkBlock h="h-44" />
          ) : provinces.length ? (
            <>
              <p className="mb-3 text-xs text-[#6b7280]">
                Based on <span className="font-bold text-[#111827]">{formatNum(totalSampledOrders)}</span> orders in this range
              </p>
              <ul className="space-y-3">
                {provinces.map((p, i) => {
                  const pct = (p.orders / topRegionMaxOrders) * 100;
                  return (
                    <li key={p.name} className="text-xs">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                          />
                          <span className="font-medium text-[#374151]">{p.name}</span>
                        </span>
                        <span className="font-semibold text-[#111827]">
                          {formatNum(p.orders)} <span className="text-[#9ca3af]">orders</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PALETTE[i % PALETTE.length],
                            transition: "width 800ms ease",
                          }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-[#9ca3af]">
                        <span>{(p.share * 100).toFixed(1)}% of orders</span>
                        <span>{formatLkr(p.revenue, true)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {cities.length > 0 && (
                <div className="mt-4 border-t border-[#f3f4f6] pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                    Top cities
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.slice(0, 6).map((c, i) => (
                      <span
                        key={c.name}
                        className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[10px] font-medium text-[#374151]"
                      >
                        {c.name}
                        <span className="ml-1 text-[#9ca3af]">{c.orders}</span>
                        {i === 0 && <span className="ml-1 text-[#fb923c]">★</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="grid h-44 place-items-center text-center text-xs text-[#9ca3af]">
              No shipping locations captured yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
