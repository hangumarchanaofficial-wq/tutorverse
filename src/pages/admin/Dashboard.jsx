import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ShoppingBag,
  UserRoundPlus,
  PackageX,
  ClockArrowUp,
  XCircle,
  Star,
  Package,
  Users,
} from "lucide-react";
import { fetchAdminAnalytics, fetchAdminStockReport } from "../../services/adminApi";
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

const PALETTE = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

/* ─── Smooth animated area spark ───────────────────── */
function AreaSpark({ color, points }) {
  const W = 300; const H = 56;
  const safe = (points || []).map((v) => Number(v) || 0);
  const n = safe.length;
  const max = n ? Math.max(...safe) : 1;
  const min = n ? Math.min(...safe) : 0;
  const rng = Math.max(max - min, 1);
  const pad = 4;

  if (n < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-full">
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    );
  }

  const pts = safe.map((v, i) => [
    (i / (n - 1)) * (W - pad * 2) + pad,
    H - pad - ((v - min) / rng) * (H - pad * 2),
  ]);

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * 0.45;
    const cp2x = pts[i][0] - (pts[i][0] - pts[i - 1][0]) * 0.45;
    d += ` C ${cp1x} ${pts[i - 1][1]} ${cp2x} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
  }
  const area = `${d} L ${W - pad} ${H} L ${pad} ${H} Z`;
  const gid = `sg-${color.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-12 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={d} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 600, strokeDashoffset: 600, animation: "lineDraw 1s ease forwards" }}
      />
    </svg>
  );
}

/* ─── Animated donut ────────────────────────────────── */
function AnimDonut({ segments, cx = 110, cy = 110, r = 78, sw = 28, onHover, centerFill = "white" }) {
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
      const ro = r + sw / 2; const ri = r - sw / 2;
      const large = seg.pct > 50 ? 1 : 0;
      const d = [
        `M ${cx + ro * Math.cos(a0)} ${cy + ro * Math.sin(a0)}`,
        `A ${ro} ${ro} 0 ${large} 1 ${cx + ro * Math.cos(a1)} ${cy + ro * Math.sin(a1)}`,
        `L ${cx + ri * Math.cos(a1)} ${cy + ri * Math.sin(a1)}`,
        `A ${ri} ${ri} 0 ${large} 0 ${cx + ri * Math.cos(a0)} ${cy + ri * Math.sin(a0)}`, "Z",
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
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
            strokeWidth={isActive ? sw + 5 : sw}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(${rot} ${cx} ${cy})`}
            style={{ transition: `stroke-dasharray 900ms ease ${i * 150}ms, stroke-width 200ms ease` }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r - sw / 2 - 4} fill={centerFill} />
      {sectors.map((d, i) => (
        <path key={i} d={d} fill="transparent" className="cursor-pointer"
          onMouseEnter={() => { setActiveIdx(i); onHover && onHover(i); }}
          onMouseLeave={() => { setActiveIdx(null); onHover && onHover(null); }}
        />
      ))}
    </svg>
  );
}

/* ─── Animated bar + line chart ─────────────────────── */
function BarLineChart({ bars, line, months, dark = false }) {
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
  const lineY = hov !== null ? linePts[hov]?.[1] || 0 : 0;
  const tipY = hov !== null ? Math.max(4, Math.min(barTopY, lineY) - tipH - 8) : 0;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-full w-full cursor-crosshair"
      onMouseMove={handleMove} onMouseLeave={() => setHov(null)}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1="10" y1={H - 30 - f * (H - 50)} x2={W - 10} y2={H - 30 - f * (H - 50)}
          stroke={dark ? "#222222" : "#f3f4f6"} strokeWidth="1" />
      ))}
      {hov !== null && (
        <line x1={20 + hov * (bw + gap) + bw / 2} y1={12}
          x2={20 + hov * (bw + gap) + bw / 2} y2={H - 30}
          stroke={dark ? "#555" : "#94a3b8"} strokeWidth="1" strokeDasharray="4 3" />
      )}
      {safeBars.map((v, i) => {
        const x = 20 + i * (bw + gap);
        const fullH = (v / maxV) * (H - 50);
        const h = drawn ? fullH : 2;
        const y = H - 30 - h;
        return (
          <rect key={i} x={x} y={y} width={bw} height={h} rx="5"
            fill={hov === i ? "#ea580c" : "#f97316"}
            style={{ transition: `height 700ms ease ${i * 40}ms, y 700ms ease ${i * 40}ms, fill 150ms` }} />
        );
      })}
      {linePts.length > 1 && (
        <path d={linePath} fill="none" stroke={dark ? "#d1d5db" : "#0f172a"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 900, strokeDashoffset: drawn ? 0 : 900, transition: "stroke-dashoffset 1.2s ease 0.3s" }} />
      )}
      {hov !== null && linePts[hov] && (
        <circle cx={linePts[hov][0]} cy={linePts[hov][1]} r="5"
          fill={dark ? "#0d0d0d" : "white"} stroke={dark ? "#d1d5db" : "#0f172a"} strokeWidth="2" />
      )}
      {months.map((m, i) => (
        <text key={i} x={20 + i * (bw + gap) + bw / 2} y={H - 8}
          textAnchor="middle" fontSize="9"
          fill={hov === i ? (dark ? "#e5e7eb" : "#374151") : "#9ca3af"}
          fontWeight={hov === i ? "700" : "400"}>{m}</text>
      ))}
      {hov !== null && (
        <g>
          <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="8"
            fill={dark ? "#1a1a1a" : "white"}
            filter={dark ? "drop-shadow(0 2px 12px rgba(0,0,0,0.5))" : "drop-shadow(0 2px 8px rgba(0,0,0,0.12))"} />
          <text x={tipX + 10} y={tipY + 17} fontSize="10" fontWeight="700" fill={dark ? "#f1f5f9" : "#374151"}>{months[hov]}</text>
          <circle cx={tipX + 10} cy={tipY + 31} r="4" fill="#f97316" />
          <text x={tipX + 20} y={tipY + 35} fontSize="10" fill={dark ? "#9ca3af" : "#6b7280"}>Revenue</text>
          <text x={tipX + tipW - 8} y={tipY + 35} fontSize="10" fontWeight="700" fill={dark ? "#f1f5f9" : "#111827"} textAnchor="end">
            {formatLkr(safeBars[hov], true)}
          </text>
          <circle cx={tipX + 10} cy={tipY + 49} r="4" fill={dark ? "#d1d5db" : "#0f172a"} />
          <text x={tipX + 20} y={tipY + 53} fontSize="10" fill={dark ? "#9ca3af" : "#6b7280"}>Orders</text>
          <text x={tipX + tipW - 8} y={tipY + 53} fontSize="10" fontWeight="700" fill={dark ? "#f1f5f9" : "#111827"} textAnchor="end">
            {formatNum(safeLine[hov])}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─── Daily orders bar chart (compact, no line) ─────── */
function DailyBarsChart({ days, dark = false }) {
  const [drawn, setDrawn] = useState(false);
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 120); return () => clearTimeout(t); }, []);

  const safe = (days || []).map((d) => ({ ...d, orders: Number(d.orders) || 0 }));
  const n = safe.length;
  if (!n) return <p className="grid h-32 place-items-center text-xs text-[#9ca3af]">No data yet.</p>;

  const W = 480; const H = 130;
  const maxV = Math.max(...safe.map((d) => d.orders), 1);
  const bw = Math.max(4, Math.floor((W - 20) / n) - 4);
  const step = Math.floor((W - 20) / n);

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = -1; let minD = Infinity;
    safe.forEach((_, i) => {
      const cx = 10 + i * step + bw / 2;
      const d = Math.abs(svgX - cx);
      if (d < minD) { minD = d; closest = i; }
    });
    setHov(minD < step * 0.75 ? closest : null);
  };

  const dayLabel = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (n <= 7) return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const showEvery = n <= 7 ? 1 : n <= 14 ? 2 : 5;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-32 w-full cursor-crosshair"
      onMouseMove={handleMove} onMouseLeave={() => setHov(null)}>
      {[0.5, 1].map((f) => (
        <line key={f} x1="8" y1={H - 22 - f * (H - 36)} x2={W - 8} y2={H - 22 - f * (H - 36)}
          stroke={dark ? "#222222" : "#f3f4f6"} strokeWidth="1" />
      ))}
      {safe.map((d, i) => {
        const x = 10 + i * step;
        const fullH = (d.orders / maxV) * (H - 36);
        const h = drawn ? Math.max(fullH, d.orders > 0 ? 3 : 0) : 0;
        const y = H - 22 - h;
        return (
          <rect key={i} x={x} y={y} width={bw} height={h} rx="3"
            fill={hov === i ? "#ea580c" : "#f97316"}
            style={{ transition: `height 600ms ease ${i * 20}ms, y 600ms ease ${i * 20}ms, fill 150ms` }} />
        );
      })}
      {safe.map((d, i) => i % showEvery === 0 && (
        <text key={i} x={10 + i * step + bw / 2} y={H - 4}
          textAnchor="middle" fontSize="8" fill={hov === i ? (dark ? "#e5e7eb" : "#374151") : "#9ca3af"}
          fontWeight={hov === i ? "700" : "400"}>{dayLabel(d.date)}</text>
      ))}
      {hov !== null && (
        <g>
          <rect x={Math.max(2, Math.min(W - 80, 10 + hov * step - 10))} y={H - 22 - (safe[hov].orders / maxV) * (H - 36) - 28}
            width="72" height="22" rx="5" fill={dark ? "#2a2a2a" : "#0f172a"} />
          <text x={Math.max(2, Math.min(W - 80, 10 + hov * step - 10)) + 36}
            y={H - 22 - (safe[hov].orders / maxV) * (H - 36) - 12}
            textAnchor="middle" fontSize="10" fontWeight="700" fill={dark ? "#f1f5f9" : "white"}>
            {formatNum(safe[hov].orders)} orders
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─── KPI card icon treatment ───────────────────────── */
const KPI_ICON_COMPONENTS = [BadgeDollarSign, ShoppingBag, ChartNoAxesCombined, UserRoundPlus];

function KpiIconTile({ idx, palette }) {
  const Icon = KPI_ICON_COMPONENTS[idx];
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: palette.bg }}>
      <Icon className="h-5 w-5" style={{ color: palette.color }} strokeWidth={2} />
    </div>
  );
}

const RANGE_OPTIONS = [
  { id: "7d",  label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];

/* ─── Status badge mapping ──────────────────────────── */
function statusLabel(o) {
  if (o.payment_status === "paid" && o.status === "completed") return "Completed";
  if (o.payment_status === "paid") return "Paid";
  if (o.status === "cancelled") return "Cancel";
  if (o.status === "completed") return "Completed";
  if (o.status === "processing") return "Processing";
  return "Pending";
}

const STATUS_STYLE = {
  Paid:       "bg-emerald-50 text-emerald-600",
  Completed:  "bg-violet-50 text-violet-600",
  Cancel:     "bg-red-50 text-red-500",
  Processing: "bg-blue-50 text-blue-600",
  Pending:    "bg-amber-50 text-amber-600",
};

/* ─── Star rating ───────────────────────────────────── */
function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`h-3 w-3 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-[#e5e7eb] text-[#e5e7eb]"}`} />
      ))}
    </span>
  );
}

/* ─── Skeleton block ────────────────────────────────── */
function SkBlock({ h = "h-24", w = "w-full" }) {
  return <div className={`animate-pulse rounded-2xl bg-[#e5e7eb] ${h} ${w}`} />;
}

/* ─── Theme detection hook ──────────────────────────── */
function useAdminTheme() {
  const [theme, setTheme] = useState(
    () => (typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-admin-theme") || "light"
      : "light")
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setTheme(el.getAttribute("data-admin-theme") || "light");
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-admin-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/* ─── Theme-aware palette helpers ──────────────────── */
const HEALTH_PALETTE = {
  light: {
    amber:   { bg: "#fffbeb", icon: "#d97706", text: "#92400e" },
    red:     { bg: "#fef2f2", icon: "#dc2626", text: "#991b1b" },
    indigo:  { bg: "#eef2ff", icon: "#4f46e5", text: "#3730a3" },
    rose:    { bg: "#fff1f2", icon: "#e11d48", text: "#9f1239" },
    emerald: { bg: "#ecfdf5", icon: "#059669", text: "#065f46" },
    blue:    { bg: "#eff6ff", icon: "#2563eb", text: "#1e40af" },
  },
  dark: {
    amber:   { bg: "rgba(245,158,11,0.12)",  icon: "#fbbf24", text: "#fcd34d" },
    red:     { bg: "rgba(239,68,68,0.12)",   icon: "#f87171", text: "#fca5a5" },
    indigo:  { bg: "rgba(99,102,241,0.12)",  icon: "#818cf8", text: "#a5b4fc" },
    rose:    { bg: "rgba(244,63,94,0.12)",   icon: "#fb7185", text: "#fda4af" },
    emerald: { bg: "rgba(16,185,129,0.12)",  icon: "#34d399", text: "#6ee7b7" },
    blue:    { bg: "rgba(59,130,246,0.12)",  icon: "#60a5fa", text: "#93c5fd" },
  },
};

const KPI_PALETTE = {
  light: [
    { bg: "#fff1e6", color: "#f97316" },
    { bg: "#fff7ed", color: "#ea580c" },
    { bg: "#f3eefe", color: "#7c3aed" },
    { bg: "#eef4ff", color: "#2563eb" },
  ],
  dark: [
    { bg: "rgba(249,115,22,0.14)",  color: "#fb923c" },
    { bg: "rgba(234,88,12,0.14)",   color: "#f97316" },
    { bg: "rgba(124,58,237,0.14)",  color: "#a78bfa" },
    { bg: "rgba(37,99,235,0.14)",   color: "#60a5fa" },
  ],
};

/* ════════════════════════════════════════════════════
   Main Dashboard component
   ════════════════════════════════════════════════════ */
export default function Dashboard() {
  const theme = useAdminTheme();
  const isDark = theme === "dark";

  const [hoverSegIdx, setHoverSegIdx] = useState(null);
  const [statusTab, setStatusTab]     = useState("status"); // "status" | "payment"
  const [activityTab, setActivityTab] = useState("orders"); // "orders" | "reviews"
  const [range, setRange]             = useState("30d");
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [stockReport, setStockReport] = useState(null);

  /* ─── Analytics load ── */
  const load = useCallback(async (opts = {}) => {
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
  }, [range]);

  useEffect(() => { load(); }, [load]);

  /* ─── Stock report (separate lightweight fetch) ── */
  useEffect(() => {
    fetchAdminStockReport()
      .then((r) => setStockReport(r))
      .catch(() => setStockReport(null));
  }, []);

  /* ─── Derived view models ── */
  const kpis               = data?.kpis;
  const totals             = data?.totals;
  const salesByMonth       = data?.salesByMonth       || [];
  const salesByDay         = data?.salesByDay         || [];
  const topProducts        = data?.topProducts        || [];
  const topCategories      = data?.topCategories      || [];
  const recentOrders       = data?.recentOrders       || [];
  const recentReviews      = data?.recentReviews      || [];
  const statusBreakdown    = data?.statusBreakdown    || [];
  const provinces          = data?.customerLocations?.provinces || [];
  const cities             = data?.customerLocations?.cities    || [];
  const totalSampledOrders = data?.customerLocations?.sampledOrders || 0;

  const metricCards = useMemo(() => {
    if (!kpis) return [];
    return [
      { key: "earnings",     label: "Total Earnings",    value: formatLkr(kpis.revenue?.value || 0, true),    delta: kpis.revenue?.delta     || 0, accent: "#f97316", pts: kpis.revenue?.spark  || [] },
      { key: "orders",       label: "Total Orders",      value: formatNum(kpis.orders?.value  || 0),           delta: kpis.orders?.delta      || 0, accent: "#0f172a", pts: kpis.orders?.spark   || [] },
      { key: "aov",          label: "Avg. Order Value",  value: formatLkr(kpis.aov?.value     || 0, true),    delta: kpis.aov?.delta         || 0, accent: "#7c3aed", pts: kpis.revenue?.spark  || [] },
      { key: "newCustomers", label: "New Customers",     value: formatNum(kpis.newCustomers?.value || 0),     delta: kpis.newCustomers?.delta || 0, accent: "#2563eb", pts: kpis.orders?.spark   || [] },
    ];
  }, [kpis]);

  const monthLabels      = salesByMonth.map((m) => m.label);
  const monthRevenue     = salesByMonth.map((m) => m.revenue);
  const monthOrders      = salesByMonth.map((m) => m.orders);
  const totalRangeRevenue = monthRevenue.reduce((s, v) => s + v, 0);
  const totalRangeOrders  = monthOrders.reduce((s, v) => s + v, 0);

  /* Payment mix donut */
  const paymentDonutSegs = useMemo(() => {
    const mix = data?.paymentMix || [];
    if (!mix.length) return [];
    const total = mix.reduce((s, p) => s + p.amount, 0) || 1;
    return mix.slice(0, 5).map((p, i) => ({
      pct:   (p.amount / total) * 100,
      color: PALETTE[i % PALETTE.length],
      label: String(p.method || "unknown").toUpperCase(),
      value: formatLkr(p.amount, true),
      count: p.count,
    }));
  }, [data?.paymentMix]);

  /* Order status donut */
  const statusDonutSegs = useMemo(() => {
    if (!statusBreakdown.length) return [];
    const total = statusBreakdown.reduce((s, x) => s + Number(x.count), 0) || 1;
    const colors = { pending: "#f97316", processing: "#3b82f6", completed: "#10b981", cancelled: "#ef4444" };
    return statusBreakdown.map((x) => ({
      pct:   (Number(x.count) / total) * 100,
      color: colors[x.status] || "#94a3b8",
      label: x.status,
      value: formatNum(x.count),
      count: Number(x.count),
    }));
  }, [statusBreakdown]);

  const activeDonutSegs  = statusTab === "status" ? statusDonutSegs : paymentDonutSegs;
  const topRegionMaxOrders = Math.max(1, ...provinces.map((p) => p.orders));
  const currentRangeLabel  = RANGE_OPTIONS.find((r) => r.id === range)?.label;
  const greetingName = (typeof window !== "undefined" && window.__adminName) || "Orlando";

  /* Stock health */
  const outOfStock = stockReport?.outOfStock || [];
  const lowStock   = stockReport?.lowStock   || [];

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="bg-[#fafbfc] px-6 py-7 lg:px-10 lg:py-10">
      <style>{`
        @keyframes lineDraw { to { stroke-dashoffset: 0; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#0b1220]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            Hello {greetingName}, welcome back!
            {data?.generatedAt && <span className="ml-2 text-[#9ca3af]">· updated {timeAgo(data.generatedAt)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-full bg-white p-1 text-xs ring-1 ring-[#eceff3]">
            {RANGE_OPTIONS.map((r) => (
              <button key={r.id} type="button" onClick={() => setRange(r.id)}
                className={`rounded-full px-3 py-1.5 font-medium transition ${
                  range === r.id ? "bg-[#f97316] text-white shadow-sm" : "text-[#475467] hover:text-[#0b1220]"
                }`}>{r.label}</button>
            ))}
          </div>
          <button type="button" onClick={() => load({ fresh: true })} disabled={loading}
            className="rounded-full bg-white px-3.5 py-2 text-xs font-medium text-[#475467] ring-1 ring-[#eceff3] transition hover:text-[#0b1220] disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <button onClick={() => load({ fresh: true })} className="ml-2 underline">Try again</button>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="mb-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => <SkBlock key={i} h="h-[140px]" />)
          : metricCards.map((m, ki) => (
              <div key={m.key}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceff3] transition hover:ring-[#e2e6ee]"
                style={{ animation: `fadeUp 500ms ease ${ki * 70}ms both` }}>
                <div className="flex items-center justify-between px-5 pt-5">
                  <KpiIconTile idx={ki} palette={KPI_PALETTE[isDark ? "dark" : "light"][ki]} />
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    m.delta >= 0 ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#fef2f2] text-[#dc2626]"
                  }`}>
                    <svg viewBox="0 0 24 24" className={`h-2.5 w-2.5 ${m.delta < 0 ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {Math.abs(m.delta).toFixed(2)}%
                  </span>
                </div>
                <div className="px-5 pt-3">
                  <p className="text-[11px] font-medium text-[#6b7280]">{m.label}</p>
                  <p className="mt-0.5 text-[24px] font-semibold leading-none tracking-tight text-[#0b1220]">{m.value}</p>
                </div>
                {/* spark */}
                <div className="mt-2 px-0 pb-0">
                  <AreaSpark color={m.accent} points={m.pts} />
                </div>
              </div>
            ))}
      </div>

      {/* ── Health strip ── */}
      {(() => {
        const hp = HEALTH_PALETTE[isDark ? "dark" : "light"];
        const chips = [
          { Icon: ClockArrowUp, label: "Pending Orders",  value: totals?.pendingOrders   ?? "—", tone: "amber",   to: "/admin/orders?status=pending" },
          { Icon: XCircle,      label: "Cancelled",       value: totals?.cancelledOrders ?? "—", tone: "red",     to: "/admin/orders?status=cancelled" },
          { Icon: Star,         label: "Reviews Pending", value: totals?.pendingReviews  ?? "—", tone: "indigo",  to: "/admin/reviews?status=pending" },
          { Icon: Package,      label: "Low Stock",       value: totals?.lowStock        ?? "—", tone: "rose",    to: "/admin/stock" },
          { Icon: ShoppingBag,  label: "Active Products", value: totals?.productsActive  ?? "—", tone: "emerald", to: "/admin/products" },
          { Icon: Users,        label: "Total Customers", value: totals?.usersTotal      ?? "—", tone: "blue",    to: "/admin/users" },
        ];
        const loadingBg   = isDark ? "#111111" : "#f3f4f6";
        const loadingText = isDark ? "#374151"  : "#9ca3af";
        const loadingNum  = isDark ? "#4b5563"  : "#d1d5db";
        return (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {chips.map(({ Icon, label, value, tone, to }) => {
              const t = hp[tone];
              return (
                <Link key={label} to={to}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-[#eceff3] transition hover:ring-[#e2e6ee]"
                  style={{ backgroundColor: loading ? loadingBg : t.bg }}>
                  {loading
                    ? <div className="h-7 w-7 animate-pulse rounded-lg" style={{ backgroundColor: isDark ? "#1e1e1e" : "#e5e7eb" }} />
                    : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: t.bg }}>
                        <Icon className="h-4 w-4" style={{ color: t.icon }} strokeWidth={2} />
                      </div>}
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium" style={{ color: loading ? loadingText : t.text }}>{label}</p>
                    <p className="text-base font-semibold leading-none" style={{ color: loading ? loadingNum : t.text }}>
                      {loading ? "—" : formatNum(value)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })()}

      {/* ── Charts row: Revenue hero + Status/Payment donut + Top sale ── */}
      <div className="mb-8 grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">

        {/* Revenue hero */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium text-[#6b7280]">Total Revenue</p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#0b1220]">
                {formatLkr(totalRangeRevenue, true)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                  <span className="text-[#6b7280]">Revenue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />
                  <span className="text-[#6b7280]">Orders</span>
                  <span className="font-semibold text-[#0b1220]">{formatNum(totalRangeOrders)}</span>
                </span>
              </div>
            </div>
            <span className="whitespace-nowrap rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#eceff3]">
              Last 12 months
            </span>
          </div>
          <div className="h-56">
            {salesByMonth.length
              ? <BarLineChart bars={monthRevenue} line={monthOrders} months={monthLabels} dark={isDark} />
              : loading ? <SkBlock h="h-full" />
              : <p className="grid h-full place-items-center text-xs text-[#9ca3af]">No sales data yet.</p>}
          </div>
        </div>

        {/* Order Status / Payment Channel tabbed donut */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-[#eceff3]">
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-[#f8fafc] p-1">
            {[["status","Order Types"],["payment","Payment"]].map(([id, lbl]) => (
              <button key={id} type="button" onClick={() => setStatusTab(id)}
                className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition ${
                  statusTab === id ? "bg-white text-[#0b1220] shadow-sm" : "text-[#6b7280]"
                }`}>{lbl}</button>
            ))}
          </div>
          {activeDonutSegs.length ? (
            <>
              <div className="relative mx-auto mb-3 h-40 w-40">
                <AnimDonut segments={activeDonutSegs} onHover={setHoverSegIdx}
                  centerFill={isDark ? "#0d0d0d" : "white"} />
                {(() => {
                  const seg = hoverSegIdx !== null ? activeDonutSegs[hoverSegIdx] : activeDonutSegs[0];
                  return (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] capitalize text-[#9ca3af]">{seg?.label}</p>
                      <p className="text-base font-bold text-[#0b1220]">{seg?.value}</p>
                      <p className="text-[10px] text-[#9ca3af]">{formatNum(seg?.count)} orders</p>
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-1.5">
                {activeDonutSegs.map((s, i) => (
                  <div key={s.label}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${hoverSegIdx === i ? "bg-[#f9fafb]" : ""}`}
                    onMouseEnter={() => setHoverSegIdx(i)} onMouseLeave={() => setHoverSegIdx(null)}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="flex-1 truncate capitalize font-medium text-[#374151]">{s.label}</span>
                    <span className="font-semibold text-[#1f2937]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : loading ? <SkBlock h="h-44" />
            : <p className="grid h-44 place-items-center text-xs text-[#9ca3af]">No data yet.</p>}
        </div>

        {/* Top sale */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0b1220]">Top sale</h3>
            <Link to="/admin/products" className="text-[11px] font-semibold text-[#f97316] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {loading && !topProducts.length ? <SkBlock h="h-40" />
              : topProducts.length ? topProducts.map((p, i) => (
                  <div key={p.id || p.title} className="flex items-center gap-3">
                    <Thumb src={p.image} alt={p.title} idx={i} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#111827]">{p.title}</p>
                      <p className="text-xs text-[#9ca3af]">{formatLkr(p.revenue, true)}</p>
                    </div>
                    <p className="shrink-0 text-xs font-medium text-[#374151]">{formatNum(p.qty)} sold</p>
                  </div>
                ))
              : <p className="py-8 text-center text-xs text-[#9ca3af]">No sales in this range.</p>}
          </div>
        </div>
      </div>

      {/* ── Second row: Daily orders chart + Top categories + Stock health ── */}
      <div className="mb-8 grid gap-5 lg:grid-cols-[2fr_1.2fr_0.8fr]">

        {/* Daily orders bar chart */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0b1220]">Orders Overview</h3>
              <p className="text-xs text-[#6b7280]">{currentRangeLabel}</p>
            </div>
            <span className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-[11px] font-semibold text-[#f97316]">
              {formatNum(salesByDay.reduce((s, d) => s + (Number(d.orders) || 0), 0))} orders
            </span>
          </div>
          {loading && !salesByDay.length
            ? <SkBlock h="h-32" />
            : <DailyBarsChart days={salesByDay} dark={isDark} />}
        </div>

        {/* Top categories */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0b1220]">Top Categories</h3>
            <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#eceff3]">
              {currentRangeLabel}
            </span>
          </div>
          {loading && !topCategories.length ? (
            <div className="space-y-3">{[0,1,2,3].map((i) => <SkBlock key={i} h="h-7" />)}</div>
          ) : topCategories.length ? (
            <div className="space-y-3">
              {topCategories.map((c, i) => {
                const pct = Math.round((c.share || 0) * 100);
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-[#374151]">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        {c.name}
                      </span>
                      <span className="font-semibold text-[#0b1220]">{formatLkr(c.revenue, true)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                      <div className="h-full rounded-full" style={{
                        width: `${pct}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                        transition: "width 800ms ease",
                      }} />
                    </div>
                    <p className="mt-0.5 text-right text-[10px] text-[#9ca3af]">{pct}% of sales</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="grid h-32 place-items-center text-xs text-[#9ca3af]">No category data yet.</p>
          )}
        </div>

        {/* Stock health */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0b1220]">Stock Health</h3>
            <Link to="/admin/stock" className="text-[11px] font-semibold text-[#f97316] hover:underline">Manage</Link>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fef2f2] px-3 py-2.5 text-center">
              <p className="text-[18px] font-bold text-[#dc2626]">{outOfStock.length}</p>
              <p className="text-[10px] font-medium text-[#991b1b]">Out of stock</p>
            </div>
            <div className="rounded-xl bg-[#fffbeb] px-3 py-2.5 text-center">
              <p className="text-[18px] font-bold text-[#d97706]">{lowStock.length}</p>
              <p className="text-[10px] font-medium text-[#92400e]">Low stock</p>
            </div>
          </div>
          <div className="space-y-2">
            {[...outOfStock.slice(0, 2), ...lowStock.slice(0, 3)].slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-[#374151]">{p.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${
                  Number(p.stock_qty) <= 0
                    ? "bg-[#fef2f2] text-[#dc2626]"
                    : "bg-[#fffbeb] text-[#d97706]"
                }`}>{Number(p.stock_qty) <= 0 ? "0" : p.stock_qty}</span>
              </div>
            ))}
            {!outOfStock.length && !lowStock.length && (
              <div className="flex items-center gap-2 rounded-xl bg-[#ecfdf5] px-3 py-2.5">
                <PackageX className="h-4 w-4 text-[#059669]" />
                <p className="text-xs font-medium text-[#065f46]">All products stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Recent orders (tabbed w/ reviews) + Customer locations ── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">

        {/* Tabbed: Recent orders / Recent reviews */}
        <div className="rounded-2xl bg-white ring-1 ring-[#eceff3]">
          <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 pt-4 pb-0">
            <div className="flex items-center gap-1">
              {[["orders","Recent orders"],["reviews","New reviews"]].map(([id, lbl]) => (
                <button key={id} type="button" onClick={() => setActivityTab(id)}
                  className={`relative px-2 pb-3 pt-1 text-xs font-semibold transition ${
                    activityTab === id
                      ? "text-[#0b1220] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#f97316]"
                      : "text-[#6b7280] hover:text-[#0b1220]"
                  }`}>{lbl}</button>
              ))}
            </div>
            <Link to={activityTab === "orders" ? "/admin/orders" : "/admin/reviews"}
              className="pb-3 text-[11px] font-semibold text-[#f97316] hover:underline">
              {activityTab === "orders" ? "See all orders" : "See all reviews"}
            </Link>
          </div>

          {activityTab === "orders" ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f3f4f6] text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                      {["Order","Customer","Placed","Total","Status"].map((h) => (
                        <th key={h} className="px-6 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9fafb]">
                    {loading && !recentOrders.length ? (
                      <tr><td colSpan={5} className="px-6 py-4"><SkBlock h="h-24" /></td></tr>
                    ) : recentOrders.length ? (
                      recentOrders.map((o, idx) => {
                        const st = statusLabel(o);
                        return (
                          <tr key={o.id} className="text-sm text-[#374151] transition hover:bg-[#fafbfc]">
                            <td className="px-6 py-3">
                              <Link to={`/admin/orders/${o.id}`}
                                className="flex items-center gap-2.5 font-medium text-[#111827] hover:text-[#f97316]">
                                <Thumb idx={idx} alt={o.order_number} />
                                <span>{o.order_number}</span>
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-[#6b7280]">
                              {o.customer_name || "—"}
                              {o.customer_email && <p className="text-[11px] text-[#9ca3af]">{o.customer_email}</p>}
                            </td>
                            <td className="px-6 py-3 text-[#6b7280]">{timeAgo(o.created_at)}</td>
                            <td className="px-6 py-3 font-medium">{formatLkr(o.total_amount, true)}</td>
                            <td className="px-6 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[st] || "bg-gray-100 text-gray-600"}`}>
                                {st}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-xs text-[#9ca3af]">No orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#f3f4f6] px-6 py-3 text-[11px] text-[#9ca3af]">
                <span>Showing {recentOrders.length} of {formatNum(totals?.ordersAllTime || 0)} total</span>
                <div className="flex items-center gap-3">
                  {totals?.lowStock > 0 && (
                    <Link to="/admin/stock" className="text-[#ef4444] hover:underline">{totals.lowStock} low-stock items</Link>
                  )}
                  {totals?.pendingReviews > 0 && (
                    <Link to="/admin/reviews" className="text-[#f97316] hover:underline">{totals.pendingReviews} reviews to moderate</Link>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Recent reviews tab */
            <div className="divide-y divide-[#f9fafb]">
              {loading && !recentReviews.length ? (
                <div className="p-6"><SkBlock h="h-32" /></div>
              ) : recentReviews.length ? (
                recentReviews.map((rv) => (
                  <div key={rv.id} className="flex items-start gap-4 px-6 py-4 transition hover:bg-[#fafbfc]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-xs font-bold text-[#6b7280]">
                      {rv.product_id ? String(rv.product_id).slice(-2) : "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Stars rating={rv.rating} />
                        <span className="text-[10px] text-[#9ca3af]">{timeAgo(rv.created_at)}</span>
                        {!rv.is_approved && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Pending</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-[#374151]">{rv.comment || "—"}</p>
                    </div>
                    <Link to={`/admin/reviews`}
                      className="shrink-0 rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10px] font-semibold text-[#475467] hover:bg-[#e5e7eb]">
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <p className="px-6 py-10 text-center text-xs text-[#9ca3af]">No reviews yet.</p>
              )}
              <div className="border-t border-[#f3f4f6] px-6 py-3 text-[11px] text-[#9ca3af]">
                Showing {recentReviews.length} latest reviews ·{" "}
                {totals?.pendingReviews > 0
                  ? <Link to="/admin/reviews?status=pending" className="text-[#f97316] hover:underline">{totals.pendingReviews} pending approval</Link>
                  : "all up to date"}
              </div>
            </div>
          )}
        </div>

        {/* Customer Locations */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0b1220]">Customer Locations</h3>
            <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#eceff3]">Sri Lanka</span>
          </div>
          {loading && !provinces.length ? <SkBlock h="h-44" />
          : provinces.length ? (
            <>
              <p className="mb-3 text-xs text-[#6b7280]">
                Based on <span className="font-bold text-[#0b1220]">{formatNum(totalSampledOrders)}</span> orders in this range
              </p>
              <ul className="space-y-3">
                {provinces.map((p, i) => {
                  const pct = (p.orders / topRegionMaxOrders) * 100;
                  return (
                    <li key={p.name} className="text-xs">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          <span className="font-medium text-[#374151]">{p.name}</span>
                        </span>
                        <span className="font-semibold text-[#0b1220]">{formatNum(p.orders)} <span className="text-[#9ca3af]">orders</span></span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div className="h-full rounded-full" style={{
                          width: `${pct}%`,
                          backgroundColor: PALETTE[i % PALETTE.length],
                          transition: "width 800ms ease",
                        }} />
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
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">Top cities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.slice(0, 6).map((c, i) => (
                      <span key={c.name}
                        className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2 py-0.5 text-[10px] font-medium text-[#374151]">
                        {c.name}
                        <span className="ml-1 text-[#9ca3af]">{c.orders}</span>
                        {i === 0 && <span className="ml-1 text-[#f97316]">★</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="grid h-44 place-items-center text-center text-xs text-[#9ca3af]">No shipping locations captured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
