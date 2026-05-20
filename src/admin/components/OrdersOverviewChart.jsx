import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNum } from "./ui";

function shortDayLabel(iso, totalDays) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (totalDays <= 7) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function longDayLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function OrdersTooltip({ active, payload, dark, averageOrders }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const delta = row.orders - averageOrders;
  const deltaText = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} vs avg`;

  return (
    <div
      className="min-w-[170px] rounded-2xl border px-3 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-md"
      style={{
        background: dark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.94)",
        borderColor: dark ? "rgba(148,163,184,0.2)" : "rgba(226,232,240,0.95)",
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#94a3b8]">{row.fullLabel}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight" style={{ color: dark ? "#f8fafc" : "#0f172a" }}>
        {formatNum(row.orders)}
      </p>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span style={{ color: dark ? "#cbd5e1" : "#475569" }}>Orders</span>
        <span style={{ color: delta >= 0 ? "#f97316" : dark ? "#cbd5e1" : "#334155" }}>{deltaText}</span>
      </div>
    </div>
  );
}

function rangeText(min, max) {
  if (min === max) return `${formatNum(max)} orders`;
  return `${formatNum(min)}-${formatNum(max)} orders`;
}

function AccentDot({ cx, cy, payload, dark }) {
  if (typeof cx !== "number" || typeof cy !== "number" || !payload) return null;
  const isPeak = payload.isPeak;

  return (
    <g>
      {isPeak && (
        <circle
          cx={cx}
          cy={cy}
          r={14}
          fill={dark ? "rgba(249,115,22,0.18)" : "rgba(249,115,22,0.16)"}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isPeak ? 6.5 : 5}
        fill={dark ? "#020617" : "#ffffff"}
        stroke="#0f172a"
        strokeWidth={isPeak ? 2.5 : 2}
      />
      <circle
        cx={cx}
        cy={cy}
        r={isPeak ? 2.75 : 2}
        fill="#f97316"
      />
    </g>
  );
}

export default function OrdersOverviewChart({ days = [], dark = false }) {
  const chartId = useId().replace(/:/g, "");
  const chartData = useMemo(() => {
    const list = (days || []).map((d) => ({
      date: d.date,
      orders: Number(d.orders) || 0,
    }));
    const n = list.length;

    return list.map((d, index) => {
      const prev = index > 0 ? list[index - 1].orders : d.orders;
      const direction = d.orders >= prev ? "up" : "down";

      return {
        ...d,
        label: shortDayLabel(d.date, n),
        fullLabel: longDayLabel(d.date),
        direction,
        isPeak: false,
      };
    });
  }, [days]);

  const stats = useMemo(() => {
    const count = chartData.length;
    const totalOrders = chartData.reduce((sum, row) => sum + row.orders, 0);
    const averageOrders = count ? totalOrders / count : 0;

    let peak = null;
    let min = count ? chartData[0].orders : 0;
    let momentum = 0;

    for (let i = 0; i < chartData.length; i += 1) {
      const row = chartData[i];
      if (!peak || row.orders > peak.orders) peak = row;
      if (row.orders < min) min = row.orders;
      if (i > 0 && row.orders > chartData[i - 1].orders) momentum += 1;
    }

    return {
      totalOrders,
      averageOrders,
      peak,
      min,
      momentum,
    };
  }, [chartData]);

  const n = chartData.length;
  const peakIndex = stats.peak ? chartData.findIndex((row) => row.date === stats.peak.date) : -1;
  const displayData = chartData.map((row, index) => ({
    ...row,
    isPeak: index === peakIndex,
    spotlight: index === peakIndex ? row.orders : 0,
  }));
  const spotlightStart = peakIndex > 0 ? displayData[peakIndex - 1]?.label : displayData[peakIndex]?.label;
  const spotlightEnd = peakIndex >= 0
    ? displayData[Math.min(peakIndex + 1, displayData.length - 1)]?.label
    : undefined;
  const tickStep = n <= 7 ? 1 : n <= 14 ? 2 : Math.max(1, Math.ceil(n / 6));
  const tickFormatter = (value, index) => {
    if (index % tickStep !== 0 && index !== n - 1) return "";
    return value;
  };

  const theme = {
    axis: dark ? "#94a3b8" : "#64748b",
    grid: dark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.11)",
    trend: dark ? "#e2e8f0" : "#0f172a",
    glow: "#f97316",
    fillTop: dark ? "rgba(249,115,22,0.24)" : "rgba(249,115,22,0.18)",
    fillBottom: dark ? "rgba(249,115,22,0.01)" : "rgba(249,115,22,0)",
    beamTop: dark ? "rgba(249,115,22,0.5)" : "rgba(249,115,22,0.78)",
    beamBottom: dark ? "rgba(249,115,22,0.04)" : "rgba(249,115,22,0.02)",
    shell: dark ? "#020617" : "#fffaf5",
    shellBorder: dark ? "rgba(148,163,184,0.18)" : "rgba(251,191,36,0.18)",
    statBg: dark ? "rgba(15,23,42,0.88)" : "rgba(255,255,255,0.78)",
    statBorder: dark ? "rgba(148,163,184,0.16)" : "rgba(255,255,255,0.9)",
    text: dark ? "#f8fafc" : "#0f172a",
    muted: dark ? "#cbd5e1" : "#475569",
  };

  const scrollMinW = Math.max(n * 42, 340);

  if (!n) {
    return (
      <div
        className="grid h-[20rem] place-items-center rounded-[28px] border"
        style={{ background: theme.shell, borderColor: theme.shellBorder }}
      >
        <p className="text-xs" style={{ color: theme.axis }}>No data yet.</p>
      </div>
    );
  }

  const headerStats = [
    {
      label: "Peak day",
      value: stats.peak ? formatNum(stats.peak.orders) : "0",
      meta: stats.peak?.fullLabel || "No peak yet",
    },
    {
      label: "Daily average",
      value: stats.averageOrders.toFixed(1),
      meta: rangeText(stats.min, stats.peak?.orders || 0),
    },
    {
      label: "Up days",
      value: `${stats.momentum}/${n}`,
      meta: "Positive daily movement",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border p-4 sm:p-5"
      style={{
        background: `radial-gradient(circle at top left, ${dark ? "rgba(249,115,22,0.16)" : "rgba(255,237,213,0.92)"} 0%, ${theme.shell} 45%, ${dark ? "#020617" : "#ffffff"} 100%)`,
        borderColor: theme.shellBorder,
        boxShadow: dark
          ? "0 24px 60px rgba(2, 6, 23, 0.45)"
          : "0 24px 48px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-[#f97316]/10 blur-3xl" />

      <div className="relative z-10 mb-5 grid gap-3 lg:grid-cols-3">
        {headerStats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * index }}
            className="rounded-2xl border px-4 py-3"
            style={{
              background: theme.statBg,
              borderColor: theme.statBorder,
              backdropFilter: "blur(12px)",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.axis }}>
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: theme.text }}>
              {item.value}
            </p>
            <p className="mt-1 text-xs" style={{ color: theme.muted }}>
              {item.meta}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          <span className="flex items-center gap-2" style={{ color: theme.muted }}>
            <span className="h-3 w-3 rounded-full bg-[#f97316] shadow-[0_0_18px_rgba(249,115,22,0.55)]" />
            Highlight
          </span>
          <span className="flex items-center gap-2" style={{ color: theme.muted }}>
            <span className="h-[2px] w-5 rounded-full" style={{ background: theme.trend }} />
            Orders curve
          </span>
          <span className="flex items-center gap-2" style={{ color: theme.muted }}>
            <span className="h-[2px] w-4 rounded-full border-t border-dashed" style={{ borderColor: theme.axis }} />
            Average {stats.averageOrders.toFixed(1)}
          </span>
        </div>

        <div className="admin-chart-scroll w-full min-w-0">
          <div className="h-[16.5rem] w-full sm:h-[18rem]" style={{ minWidth: scrollMinW }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 14, right: 12, left: -10, bottom: 4 }}>
                <defs>
                  <linearGradient id={`ordersOverviewArea-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.fillTop} />
                    <stop offset="100%" stopColor={theme.fillBottom} />
                  </linearGradient>
                  <linearGradient id={`ordersOverviewBeam-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.beamTop} />
                    <stop offset="100%" stopColor={theme.beamBottom} />
                  </linearGradient>
                  <filter id={`ordersOverviewGlow-${chartId}`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="2 7" vertical={false} stroke={theme.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: theme.axis }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tickFormatter={tickFormatter}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: theme.axis }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  content={<OrdersTooltip dark={dark} averageOrders={stats.averageOrders} />}
                  cursor={{ stroke: "#f97316", strokeOpacity: 0.2, strokeDasharray: "4 6" }}
                />
                {peakIndex >= 0 && (
                  <ReferenceArea
                    x1={spotlightStart}
                    x2={spotlightEnd}
                    y1={0}
                    y2={stats.peak.orders}
                    ifOverflow="extendDomain"
                    fill={`url(#ordersOverviewBeam-${chartId})`}
                    fillOpacity={1}
                    strokeOpacity={0}
                  />
                )}
                <ReferenceLine
                  y={Number(stats.averageOrders.toFixed(1))}
                  stroke={theme.axis}
                  strokeDasharray="5 5"
                  ifOverflow="extendDomain"
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  fill={`url(#ordersOverviewArea-${chartId})`}
                  stroke="none"
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#f97316"
                  strokeWidth={7}
                  dot={false}
                  activeDot={false}
                  strokeOpacity={0.18}
                  filter={`url(#ordersOverviewGlow-${chartId})`}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke={theme.trend}
                  strokeWidth={3}
                  dot={(props) => <AccentDot {...props} dark={dark} />}
                  activeDot={{
                    r: 7,
                    strokeWidth: 3,
                    fill: dark ? "#020617" : "#ffffff",
                    stroke: theme.glow,
                  }}
                  animationDuration={1200}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
