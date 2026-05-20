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
  RefreshCw,
} from "lucide-react";
import { fetchAdminAnalytics, fetchAdminStockReport } from "../../services/adminApi";
import {
  buildDashboardAnalytics,
  buildDashboardStockReport,
  mergeDashboardAnalytics,
  mergeDashboardStockReport,
  fillSalesByDay,
} from "../../admin/data/dashboardDemo";
import { formatLkr, formatNum, timeAgo } from "../../admin/components/ui";
import OrdersOverviewChart from "../../admin/components/OrdersOverviewChart";

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

/* ─── Interactive area spark (KPI cards) ───────────── */
function AreaSpark({ color, points, labels = [], formatValue, dark = false }) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  const gradId = useRef(`sg-${Math.random().toString(36).slice(2, 9)}`).current;

  const W = 300;
  const H = 56;
  const pad = 4;
  const safe = (points || []).map((v) => Number(v) || 0);
  const n = safe.length;
  const max = n ? Math.max(...safe) : 1;
  const min = n ? Math.min(...safe) : 0;
  const rng = Math.max(max - min, 1);
  const fmt = formatValue || ((v) => formatNum(v));

  const coords = (i) => {
    const x = n <= 1 ? W / 2 : (i / (n - 1)) * (W - pad * 2) + pad;
    const y = H - pad - ((safe[i] - min) / rng) * (H - pad * 2);
    return [x, y];
  };

  const pts = safe.map((_, i) => coords(i));
  const slotW = n <= 1 ? W : (W - pad * 2) / Math.max(n - 1, 1);

  const pickIndex = (clientX) => {
    if (!svgRef.current || !n) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let minD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(svgX - pts[i][0]);
      if (d < minD) { minD = d; closest = i; }
    }
    return minD < slotW * 0.6 ? closest : null;
  };

  const handlePointer = (clientX) => setHov(pickIndex(clientX));
  const handleMove = (e) => handlePointer(e.clientX);
  const handleTouch = (e) => {
    if (e.touches[0]) handlePointer(e.touches[0].clientX);
  };

  if (n < 2) {
    const y = H - pad;
    const x = W / 2;
    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full cursor-crosshair"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHov(null)}
        onTouchMove={handleTouch}
        onTouchEnd={() => setHov(null)}
      >
        <line x1={pad} y1={y} x2={W - pad} y2={y} stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        {n === 1 && (
          <>
            <circle cx={x} cy={y} r="4" fill={color} opacity={hov === 0 ? 1 : 0.6} />
            {hov === 0 && (
              <SparkTooltip
                x={x} y={y - 10} label={labels[0]} value={fmt(safe[0])} color={color} dark={dark} W={W}
              />
            )}
          </>
        )}
      </svg>
    );
  }

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * 0.45;
    const cp2x = pts[i][0] - (pts[i][0] - pts[i - 1][0]) * 0.45;
    d += ` C ${cp1x} ${pts[i - 1][1]} ${cp2x} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
  }
  const area = `${d} L ${W - pad} ${H} L ${pad} ${H} Z`;
  const active = hov !== null ? hov : null;
  const dimOpacity = active !== null ? 0.35 : 1;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={handleMove}
      onMouseLeave={() => setHov(null)}
      onTouchMove={handleTouch}
      onTouchEnd={() => setHov(null)}
      role="img"
      aria-label="Trend chart"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} opacity={dimOpacity} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={active !== null ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={dimOpacity}
        style={{ strokeDasharray: 600, strokeDashoffset: 600, animation: "lineDraw 1s ease forwards" }}
      />
      {active !== null && (
        <line
          x1={pts[active][0]}
          y1={pad}
          x2={pts[active][0]}
          y2={H - pad}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.55"
        />
      )}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={active === i ? 5 : 0}
            fill={dark ? "#0d0d0d" : "#ffffff"}
            stroke={color}
            strokeWidth="2"
            style={{ transition: "r 120ms ease" }}
          />
          {active === i && (
            <circle cx={x} cy={y} r="2.5" fill={color} />
          )}
        </g>
      ))}
      {active !== null && (
        <SparkTooltip
          x={pts[active][0]}
          y={pts[active][1]}
          label={labels[active]}
          value={fmt(safe[active])}
          color={color}
          dark={dark}
          W={W}
        />
      )}
    </svg>
  );
}

function SparkTooltip({ x, y, label, value, color, dark, W }) {
  const tipW = 88;
  const tipH = label ? 36 : 24;
  const tipX = Math.max(4, Math.min(W - tipW - 4, x - tipW / 2));
  const tipY = Math.max(4, y - tipH - 10);
  const bg = dark ? "#1a1a1a" : "#ffffff";
  const border = dark ? "#333" : "#e5e7eb";
  const textMain = dark ? "#f1f5f9" : "#111827";
  const textMuted = dark ? "#9ca3af" : "#6b7280";

  return (
    <g pointerEvents="none">
      <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="6" fill={bg} stroke={border} strokeWidth="1" />
      {label ? (
        <text x={tipX + tipW / 2} y={tipY + 12} textAnchor="middle" fontSize="8" fill={textMuted}>
          {label}
        </text>
      ) : null}
      <text
        x={tipX + tipW / 2}
        y={tipY + (label ? 26 : 16)}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={textMain}
      >
        {value}
      </text>
    </g>
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

/* ─── Animated bar + line chart (12-month revenue hero) ── */
function BarLineChart({ bars = [], line = [], months = [], dark = false }) {
  const [drawn, setDrawn] = useState(false);
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);

  const n = Math.max(months.length, bars.length, line.length, 1);
  const dataKey = `${n}-${bars.join(",")}-${line.join(",")}`;

  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(t);
  }, [dataKey]);

  const W = 600;
  const H = 190;
  const padL = 32;
  const padR = 16;
  const padT = 14;
  const padB = 28;
  const chartH = H - padT - padB;
  const innerW = W - padL - padR;
  const slotW = innerW / n;
  const barW = Math.min(32, Math.max(10, slotW * 0.55));

  const safeBars = Array.from({ length: n }, (_, i) => Number(bars[i]) || 0);
  const safeLine = Array.from({ length: n }, (_, i) => Number(line[i]) || 0);
  const maxV = Math.max(...safeBars, 1);
  const maxLine = Math.max(...safeLine, 1);

  const centerX = (i) => padL + slotW * i + slotW / 2;
  const barX = (i) => centerX(i) - barW / 2;
  const barH = (v, max) => (Number(v) / max) * chartH;
  const barY = (v, max) => padT + chartH - (drawn ? barH(v, max) : 0);
  const lineY = (v, max) => padT + chartH - (Number(v) / max) * chartH;

  const linePts = safeLine.map((v, i) => [centerX(i), lineY(v, maxLine)]);

  let linePath = "";
  if (linePts.length === 1) {
    linePath = `M ${linePts[0][0]} ${linePts[0][1]}`;
  } else if (linePts.length > 1) {
    linePath = `M ${linePts[0][0]} ${linePts[0][1]}`;
    for (let i = 1; i < linePts.length; i++) {
      const cp1x = linePts[i - 1][0] + (linePts[i][0] - linePts[i - 1][0]) * 0.4;
      const cp2x = linePts[i][0] - (linePts[i][0] - linePts[i - 1][0]) * 0.4;
      linePath += ` C ${cp1x} ${linePts[i - 1][1]} ${cp2x} ${linePts[i][1]} ${linePts[i][0]} ${linePts[i][1]}`;
    }
  }

  const handleMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let minD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(svgX - centerX(i));
      if (d < minD) {
        minD = d;
        closest = i;
      }
    }
    setHov(minD < slotW * 0.55 ? closest : null);
  };

  const tipW = 145;
  const tipH = 62;
  const tipX =
    hov !== null ? Math.max(4, Math.min(W - tipW - 4, centerX(hov) - tipW / 2)) : 0;
  const tipY =
    hov !== null
      ? Math.max(4, Math.min(barY(safeBars[hov], maxV), lineY(safeLine[hov], maxLine)) - tipH - 8)
      : 0;

  const scrollMinW = Math.max(n * 44, 320);

  return (
    <div className="admin-chart-scroll w-full min-w-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block h-48 w-full max-w-none cursor-crosshair sm:h-56"
        style={{ minWidth: scrollMinW }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMove}
        onMouseLeave={() => setHov(null)}
      >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padL}
          y1={padT + chartH * (1 - f)}
          x2={W - padR}
          y2={padT + chartH * (1 - f)}
          stroke={dark ? "#222222" : "#f3f4f6"}
          strokeWidth="1"
        />
      ))}
      <line
        x1={padL}
        y1={padT + chartH}
        x2={W - padR}
        y2={padT + chartH}
        stroke={dark ? "#444" : "#0f172a"}
        strokeWidth="1"
      />
      {hov !== null && (
        <line
          x1={centerX(hov)}
          y1={padT}
          x2={centerX(hov)}
          y2={padT + chartH}
          stroke={dark ? "#555" : "#94a3b8"}
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      )}
      {safeBars.map((v, i) => {
        const h = drawn ? barH(v, maxV) : 0;
        if (h < 0.5) return null;
        return (
          <rect
            key={`bar-${i}`}
            x={barX(i)}
            y={barY(v, maxV)}
            width={barW}
            height={h}
            rx="4"
            fill={hov === i ? "#ea580c" : "#f97316"}
          />
        );
      })}
      {linePts.length > 1 && drawn && (
        <path
          d={linePath}
          fill="none"
          stroke={dark ? "#d1d5db" : "#0f172a"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {drawn &&
        linePts.map(([x, y], i) => (
          <circle
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={hov === i ? 5 : 3}
            fill={dark ? "#0d0d0d" : "#ffffff"}
            stroke={dark ? "#d1d5db" : "#0f172a"}
            strokeWidth="2"
          />
        ))}
      {months.map((m, i) => (
        <text
          key={`lbl-${i}`}
          x={centerX(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="9"
          fill={hov === i ? (dark ? "#e5e7eb" : "#374151") : "#9ca3af"}
          fontWeight={hov === i ? "700" : "400"}
        >
          {m}
        </text>
      ))}
      {hov !== null && months[hov] != null && (
        <g>
          <rect
            x={tipX}
            y={tipY}
            width={tipW}
            height={tipH}
            rx="8"
            fill={dark ? "#1a1a1a" : "#ffffff"}
            stroke={dark ? "#333" : "#e5e7eb"}
            strokeWidth="1"
          />
          <text x={tipX + 10} y={tipY + 17} fontSize="10" fontWeight="700" fill={dark ? "#f1f5f9" : "#374151"}>
            {months[hov]}
          </text>
          <circle cx={tipX + 10} cy={tipY + 31} r="4" fill="#f97316" />
          <text x={tipX + 20} y={tipY + 35} fontSize="10" fill={dark ? "#9ca3af" : "#6b7280"}>
            Revenue
          </text>
          <text
            x={tipX + tipW - 8}
            y={tipY + 35}
            fontSize="10"
            fontWeight="700"
            fill={dark ? "#f1f5f9" : "#111827"}
            textAnchor="end"
          >
            {formatLkr(safeBars[hov], true)}
          </text>
          <circle cx={tipX + 10} cy={tipY + 49} r="4" fill={dark ? "#d1d5db" : "#0f172a"} />
          <text x={tipX + 20} y={tipY + 53} fontSize="10" fill={dark ? "#9ca3af" : "#6b7280"}>
            Orders
          </text>
          <text
            x={tipX + tipW - 8}
            y={tipY + 53}
            fontSize="10"
            fontWeight="700"
            fill={dark ? "#f1f5f9" : "#111827"}
            textAnchor="end"
          >
            {formatNum(safeLine[hov])}
          </text>
        </g>
      )}
    </svg>
    </div>
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
    const demo = buildDashboardAnalytics(range);
    try {
      const payload = await fetchAdminAnalytics({ range, fresh: opts.fresh });
      setData(mergeDashboardAnalytics(payload, demo));
    } catch (e) {
      setData(demo);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  /* ─── Stock report (separate lightweight fetch) ── */
  useEffect(() => {
    const demo = buildDashboardStockReport();
    fetchAdminStockReport()
      .then((r) => setStockReport(mergeDashboardStockReport(r, demo)))
      .catch(() => setStockReport(demo));
  }, []);

  /* ─── Derived view models ── */
  const kpis               = data?.kpis;
  const totals             = data?.totals;
  const salesByMonth       = data?.salesByMonth       || [];
  const salesByDay         = useMemo(
    () => fillSalesByDay(data?.salesByDay || [], data?.rangeDays ?? 30),
    [data?.salesByDay, data?.rangeDays]
  );
  const topProducts        = data?.topProducts        || [];
  const topCategories      = data?.topCategories      || [];
  const recentOrders       = data?.recentOrders       || [];
  const recentReviews      = data?.recentReviews      || [];
  const statusBreakdown    = data?.statusBreakdown    || [];
  const provinces          = data?.customerLocations?.provinces || [];
  const cities             = data?.customerLocations?.cities    || [];
  const totalSampledOrders = data?.customerLocations?.sampledOrders || 0;

  const sparkDayLabels = useMemo(() => {
    const days = salesByDay || [];
    const len = days.length;
    return days.map((d) => {
      if (!d?.date) return "";
      const dt = new Date(d.date);
      if (Number.isNaN(dt.getTime())) return "";
      if (len <= 7) return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()];
      return `${dt.getDate()}/${dt.getMonth() + 1}`;
    });
  }, [salesByDay]);

  const metricCards = useMemo(() => {
    if (!kpis) return [];
    return [
      { key: "earnings",     label: "Total Earnings",    value: formatLkr(kpis.revenue?.value || 0, true),    delta: kpis.revenue?.delta     || 0, accent: "#f97316", pts: kpis.revenue?.spark  || [], valueKind: "currency" },
      { key: "orders",       label: "Total Orders",      value: formatNum(kpis.orders?.value  || 0),           delta: kpis.orders?.delta      || 0, accent: "#0f172a", pts: kpis.orders?.spark   || [], valueKind: "number" },
      { key: "aov",          label: "Avg. Order Value",  value: formatLkr(kpis.aov?.value     || 0, true),    delta: kpis.aov?.delta         || 0, accent: "#7c3aed", pts: kpis.revenue?.spark  || [], valueKind: "currency" },
      { key: "newCustomers", label: "New Customers",     value: formatNum(kpis.newCustomers?.value || 0),     delta: kpis.newCustomers?.delta || 0, accent: "#2563eb", pts: kpis.orders?.spark   || [], valueKind: "number" },
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
  const currentRangeLabel = RANGE_OPTIONS.find((r) => r.id === range)?.label;
  const greetingName = (typeof window !== "undefined" && window.__adminName) || "Orlando";

  /* Stock health */
  const outOfStock = stockReport?.outOfStock || [];
  const lowStock   = stockReport?.lowStock   || [];

  /* ════════════════════════════════════════════════════ */
  return (
    <div className="admin-dashboard-page min-w-0 bg-[#fafbfc]">
      <style>{`
        @keyframes lineDraw { to { stroke-dashoffset: 0; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      <header className="admin-dashboard-cover">
        <div className="admin-dashboard-cover__inner">
          <div className="admin-dashboard-cover__text">
            <h1 className="admin-dashboard-cover__title">Dashboard</h1>
            <p className="admin-dashboard-cover__sub">
              Hello <span className="admin-dashboard-cover__name">{greetingName}</span>
            </p>
          </div>

          <div className="admin-dashboard-cover__actions">
            <div
              className="admin-dashboard-cover__range"
              role="group"
              aria-label="Date range"
            >
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  aria-pressed={range === r.id}
                  className={`admin-dashboard-cover__range-btn${range === r.id ? " is-active" : ""}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => load({ fresh: true })}
              disabled={loading}
              className="admin-dashboard-cover__refresh"
              aria-label={loading ? "Refreshing" : "Refresh data"}
              title="Refresh"
            >
              <RefreshCw
                className={`admin-dashboard-cover__refresh-icon${loading ? " is-spinning" : ""}`}
                strokeWidth={2.2}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </header>

      <div className="admin-dashboard-page__body px-4 pb-6 pt-5 sm:px-6 sm:pb-7 lg:px-10 lg:pb-10">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <button onClick={() => load({ fresh: true })} className="ml-2 underline">Try again</button>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="mb-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => <SkBlock key={i} h="h-[140px]" />)
          : metricCards.map((m, ki) => {
              const sparkColor =
                isDark && m.key === "orders" ? "#94a3b8" : m.accent;
              return (
              <div
                key={m.key}
                className="admin-kpi-card flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceff3] transition hover:ring-[#e2e6ee]"
                style={{ animation: `fadeUp 500ms ease ${ki * 70}ms both` }}
              >
                <div className="flex items-start justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
                  <KpiIconTile idx={ki} palette={KPI_PALETTE[isDark ? "dark" : "light"][ki]} />
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    m.delta >= 0 ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#fef2f2] text-[#dc2626]"
                  }`}>
                    <svg viewBox="0 0 24 24" className={`h-2.5 w-2.5 ${m.delta < 0 ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {Math.abs(m.delta).toFixed(2)}%
                  </span>
                </div>
                <div className="min-w-0 flex-1 px-4 pb-1 pt-3 sm:px-5">
                  <p className="text-[11px] font-medium text-[#6b7280]">{m.label}</p>
                  <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-[#0b1220] sm:text-2xl">
                    {m.value}
                  </p>
                </div>
                <div className="admin-kpi-spark mt-auto h-16 w-full min-w-0 touch-pan-x sm:h-14">
                  <AreaSpark
                    color={sparkColor}
                    points={m.pts}
                    labels={sparkDayLabels}
                    dark={isDark}
                    formatValue={
                      m.valueKind === "number"
                        ? (v) => formatNum(v)
                        : (v) => formatLkr(v, true)
                    }
                  />
                </div>
              </div>
            );
          })}
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
      <div className="mb-8 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">

        {/* Revenue hero */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-[#eceff3] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[#6b7280]">Total Revenue</p>
              <p className="mt-1 text-xl font-semibold leading-none tracking-tight text-[#0b1220] sm:text-[28px]">
                {formatLkr(totalRangeRevenue, true)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f97316]" />
                  <span className="text-[#6b7280]">Revenue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0f172a]" />
                  <span className="text-[#6b7280]">Orders</span>
                  <span className="font-semibold text-[#0b1220]">{formatNum(totalRangeOrders)}</span>
                </span>
              </div>
            </div>
            <span className="shrink-0 self-start rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#eceff3]">
              Last 12 months
            </span>
          </div>
          <div className="min-h-[12rem] min-w-0 w-full">
            {salesByMonth.length
              ? (
                <BarLineChart
                  key={`rev-${range}-${salesByMonth.map((m) => m.key).join("-")}`}
                  bars={monthRevenue}
                  line={monthOrders}
                  months={monthLabels}
                  dark={isDark}
                />
              )
              : loading ? <SkBlock h="h-48 sm:h-56" />
              : <p className="grid h-48 place-items-center text-xs text-[#9ca3af] sm:h-56">No sales data yet.</p>}
          </div>
        </div>

        {/* Order Status / Payment Channel tabbed donut */}
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-[#eceff3]">
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
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-[#eceff3]">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold text-[#0b1220]">Top sale</h3>
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
      <div className="mb-8 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]">

        {/* Daily orders bar chart */}
        <div className="min-w-0 overflow-hidden rounded-[28px] bg-white p-4 ring-1 ring-[#eceff3] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-[#0b1220]">Orders Overview</h3>
              <p className="mt-1 text-xs text-[#6b7280]">{currentRangeLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="shrink-0 rounded-full bg-[#fff7ed] px-3 py-1 text-[11px] font-semibold text-[#f97316] ring-1 ring-[#fed7aa]">
                {formatNum(salesByDay.reduce((s, d) => s + (Number(d.orders) || 0), 0))} orders
              </span>
              <span className="shrink-0 rounded-full bg-[#f8fafc] px-3 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#e2e8f0]">
                Live trend
              </span>
            </div>
          </div>
          {loading && !salesByDay.length
            ? <SkBlock h="h-52 sm:h-56" />
            : <OrdersOverviewChart days={salesByDay} dark={isDark} />}
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
      <div className="grid w-full min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">

        {/* Tabbed: Recent orders / Recent reviews */}
        <div className="flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceff3]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#f3f4f6] px-5 pt-4 pb-0 sm:px-6">
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
              <div className="min-w-0 flex-1 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-[#f3f4f6] text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                      {["Order","Customer","Placed","Total","Status"].map((h) => (
                        <th key={h} className="px-5 py-3 sm:px-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f9fafb]">
                    {loading && !recentOrders.length ? (
                      <tr><td colSpan={5} className="px-5 py-4 sm:px-6"><SkBlock h="h-24" /></td></tr>
                    ) : recentOrders.length ? (
                      recentOrders.map((o, idx) => {
                        const st = statusLabel(o);
                        return (
                          <tr key={o.id} className="text-sm text-[#374151] transition hover:bg-[#fafbfc]">
                            <td className="px-5 py-3 sm:px-6">
                              <Link to={`/admin/orders/${o.id}`}
                                className="flex items-center gap-2.5 font-medium text-[#111827] hover:text-[#f97316]">
                                <Thumb idx={idx} alt={o.order_number} />
                                <span>{o.order_number}</span>
                              </Link>
                            </td>
                            <td className="px-5 py-3 sm:px-6 text-[#6b7280]">
                              {o.customer_name || "—"}
                              {o.customer_email && <p className="text-[11px] text-[#9ca3af]">{o.customer_email}</p>}
                            </td>
                            <td className="px-5 py-3 sm:px-6 text-[#6b7280]">{timeAgo(o.created_at)}</td>
                            <td className="px-5 py-3 sm:px-6 font-medium">{formatLkr(o.total_amount, true)}</td>
                            <td className="px-5 py-3 sm:px-6">
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[st] || "bg-gray-100 text-gray-600"}`}>
                                {st}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-[#9ca3af] sm:px-6">No orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex shrink-0 items-center justify-between border-t border-[#f3f4f6] px-5 py-3 text-[11px] text-[#9ca3af] sm:px-6">
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
                  <div key={rv.id} className="flex items-start gap-4 px-5 py-4 transition hover:bg-[#fafbfc] sm:px-6">
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
                <p className="px-5 py-10 text-center text-xs text-[#9ca3af] sm:px-6">No reviews yet.</p>
              )}
              <div className="border-t border-[#f3f4f6] px-5 py-3 text-[11px] text-[#9ca3af] sm:px-6">
                Showing {recentReviews.length} latest reviews ·{" "}
                {totals?.pendingReviews > 0
                  ? <Link to="/admin/reviews?status=pending" className="text-[#f97316] hover:underline">{totals.pendingReviews} pending approval</Link>
                  : "all up to date"}
              </div>
            </div>
          )}
        </div>

        {/* Customer Locations */}
        <div className="flex min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceff3]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#f3f4f6] px-5 py-4 sm:px-6">
            <h3 className="text-sm font-semibold text-[#0b1220]">Customer Locations</h3>
            <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#475467] ring-1 ring-[#eceff3]">Sri Lanka</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6 sm:py-5">
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
            <p className="grid min-h-[11rem] flex-1 place-items-center text-center text-xs text-[#9ca3af]">No shipping locations captured yet.</p>
          )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
