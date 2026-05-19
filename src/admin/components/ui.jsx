import React, { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from "react";
import {
  Archive,
  BadgeCheck,
  Banknote,
  CheckCircle,
  Inbox,
  PackageCheck,
  PackageOpen,
  RotateCw,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { normalizeOrderPipelineStatus, ORDER_PIPELINE } from "../../lib/orderStatus";
import { RETURN_TERMINAL_REJECTED } from "../../lib/returnStatus";

// ─── Color Tokens (used as Tailwind arbitrary values) ───
// bg-main: #070b14   bg-sidebar: #0f1726   bg-panel: #101827
// bg-card: #121b2e   bg-card-soft: #182238
// border-soft: #263145   border-strong: #334155
// text-main: #f8fafc   text-muted: #8b95a7
// gold: #d8b84f   gold-hover: #e5c866

// ─── PageHeader ───
export function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#f8fafc]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-sm text-[#8b95a7]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── StatCard ───
export function StatCard({ icon, label, value, trend, trendLabel, variant, helpText, onClick }) {
  const borderColors = { danger: "border-[#f87171]/30", warning: "border-[#f59e0b]/30", success: "border-[#34d399]/30" };
  const border = borderColors[variant] || "border-[#263145]";
  const iconTone = {
    danger: "border-[#f87171]/20 bg-[#f87171]/10 text-[#f87171] shadow-[0_8px_22px_rgba(248,113,113,0.12)]",
    warning: "border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#f59e0b] shadow-[0_8px_22px_rgba(245,158,11,0.12)]",
    success: "border-[#34d399]/20 bg-[#34d399]/10 text-[#34d399] shadow-[0_8px_22px_rgba(52,211,153,0.12)]",
  }[variant] || "border-[#d8b84f]/20 bg-[#d8b84f]/10 text-[#d8b84f] shadow-[0_8px_22px_rgba(216,184,79,0.12)]";
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border ${border} bg-[#121b2e] p-4 transition-all hover:bg-[#182238] ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{label}</p>
        {icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur ${iconTone}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#f8fafc]">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {trend !== undefined && (
          <span className={`text-xs font-semibold tabular-nums ${trend >= 0 ? "text-[#34d399]" : "text-[#f87171]"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {(trendLabel || helpText) && (
          <span className="text-[11px] text-[#8b95a7]">{trendLabel || helpText}</span>
        )}
      </div>
    </div>
  );
}

// ─── StatusBadge ───
const badgeStyles = {
  PLACED: "bg-[#60a5fa]/15 text-[#60a5fa]", CONFIRMED: "bg-[#a78bfa]/15 text-[#a78bfa]",
  PROCESSING: "bg-[#a78bfa]/15 text-[#a78bfa]", PACKED: "bg-[#60a5fa]/15 text-[#60a5fa]",
  SHIPPED: "bg-[#38bdf8]/15 text-[#38bdf8]", DELIVERED: "bg-[#34d399]/15 text-[#34d399]",
  CANCELLED: "bg-[#f87171]/15 text-[#f87171]", RETURNED: "bg-[#fb923c]/15 text-[#fb923c]",
  REFUNDED: "bg-[#34d399]/15 text-[#34d399]", INSPECTED: "bg-[#38bdf8]/15 text-[#38bdf8]",
  PAID: "bg-[#34d399]/15 text-[#34d399]",
  PENDING: "bg-[#f59e0b]/15 text-[#f59e0b]", FAILED: "bg-[#f87171]/15 text-[#f87171]",
  REQUESTED: "bg-[#f59e0b]/15 text-[#f59e0b]", APPROVED: "bg-[#60a5fa]/15 text-[#60a5fa]",
  RETURN_RECEIVED: "bg-[#a78bfa]/15 text-[#a78bfa]", RETURN_APPROVED: "bg-[#60a5fa]/15 text-[#60a5fa]",
  REJECTED: "bg-[#f87171]/15 text-[#f87171]",
  active: "bg-[#34d399]/15 text-[#34d399]", inactive: "bg-[#8b95a7]/15 text-[#8b95a7]",
  approved: "bg-[#34d399]/15 text-[#34d399]", pending: "bg-[#f59e0b]/15 text-[#f59e0b]",
  hidden: "bg-[#8b95a7]/15 text-[#8b95a7]",
  critical: "bg-[#f87171]/15 text-[#f87171]", high: "bg-[#fb923c]/15 text-[#fb923c]",
  normal: "bg-[#60a5fa]/15 text-[#60a5fa]", low: "bg-[#8b95a7]/15 text-[#8b95a7]",
  healthy: "bg-[#34d399]/15 text-[#34d399]", warning: "bg-[#f59e0b]/15 text-[#f59e0b]",
  generated: "bg-[#34d399]/15 text-[#34d399]",
  sent: "bg-[#60a5fa]/15 text-[#60a5fa]",
  paid: "bg-[#34d399]/15 text-[#34d399]",
  overdue: "bg-[#f59e0b]/15 text-[#f59e0b]",
  cancelled: "bg-[#f87171]/15 text-[#f87171]",
  ADDED: "bg-[#34d399]/15 text-[#34d399]", SOLD: "bg-[#60a5fa]/15 text-[#60a5fa]",
  ADJUSTED: "bg-[#f59e0b]/15 text-[#f59e0b]", DAMAGED: "bg-[#f87171]/15 text-[#f87171]",
  REMOVED: "bg-[#f87171]/15 text-[#f87171]",
  success: "bg-[#34d399]/15 text-[#34d399]", danger: "bg-[#f87171]/15 text-[#f87171]",
  info: "bg-[#60a5fa]/15 text-[#60a5fa]", medium: "bg-[#f59e0b]/15 text-[#f59e0b]",
  purple: "bg-[#a78bfa]/15 text-[#a78bfa]",
};

export function StatusBadge({ status, className = "" }) {
  const style = badgeStyles[status] || "bg-[#8b95a7]/15 text-[#8b95a7]";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${style} ${className}`}>
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

// ─── AlertStrip ───
export function AlertStrip({ alerts = [] }) {
  if (!alerts.length) return null;
  const colors = { critical: "#f87171", high: "#fb923c", warning: "#f59e0b", normal: "#60a5fa", low: "#8b95a7" };
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-[#263145] bg-[#0f1726] px-4 py-3">
      {alerts.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          className="flex items-center gap-2 rounded-md bg-[#182238] px-3 py-1.5 text-xs font-medium text-[#f8fafc] transition hover:bg-[#263145]"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors[a.priority] || colors.normal }} />
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── EmptyState ───
export function EmptyState({ icon, title, description, actions }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#263145] bg-[#0f1726]/50 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-[#8b95a7]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#f8fafc]">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-[#8b95a7]">{description}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// ─── Skeleton ───
export function Skeleton({ className = "h-4 w-24" }) {
  return <span className={`inline-block animate-pulse rounded bg-[#263145] ${className}`} />;
}

export function SkeletonRows({ rows = 5, cols = 6 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }, (__, c) => (
        <td key={c} className="px-4 py-3"><Skeleton className="h-3.5 w-full max-w-[120px]" /></td>
      ))}
    </tr>
  ));
}

// ─── Tabs ───
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 rounded-lg border border-[#263145] bg-[#0f1726] p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === t.id ? "bg-[#d8b84f] text-[#070b14]" : "text-[#8b95a7] hover:text-[#f8fafc] hover:bg-[#182238]"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === t.id ? "bg-[#070b14]/20" : "bg-[#263145]"}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── ConfirmDialog ───
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", confirmVariant = "danger", onConfirm, onCancel, busy = false }) {
  if (!open) return null;
  const btnColor = confirmVariant === "danger"
    ? "bg-[#f87171] hover:bg-[#ef4444] text-white"
    : "bg-[#d8b84f] hover:bg-[#e5c866] text-[#070b14]";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-[#f8fafc]">{title}</h3>
        <p className="mt-2 text-sm text-[#8b95a7]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[#263145] px-4 py-2 text-sm font-semibold text-[#8b95a7] hover:bg-[#182238] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${btnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast System ───
const ToastCtx = createContext(null);
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2">
        {toasts.map((t) => {
          const bg = t.type === "error" ? "bg-[#f87171]" : t.type === "warning" ? "bg-[#f59e0b]" : "bg-[#34d399]";
          return (
            <div key={t.id} className={`${bg} animate-slide-up rounded-lg px-4 py-2.5 text-sm font-semibold text-[#070b14] shadow-xl`}>
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── DateRangeSelector ───
export function DateRangeSelector({ value, onChange }) {
  const options = [
    { id: "today", label: "Today" }, { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" }, { id: "month", label: "This Month" }, { id: "90d", label: "90 Days" },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-[#263145] bg-[#0f1726] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
            value === o.id ? "bg-[#d8b84f] text-[#070b14]" : "text-[#8b95a7] hover:text-[#f8fafc]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── ActionMenu ───
export function ActionMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="rounded-md border border-[#263145] px-2 py-1 text-xs text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-lg border border-[#263145] bg-[#121b2e] py-1 shadow-xl">
          {items.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-1 border-[#263145]" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => { setOpen(false); item.onClick?.(); }}
                disabled={item.disabled}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition disabled:opacity-40 ${
                  item.danger ? "text-[#f87171] hover:bg-[#f87171]/10" : "text-[#f8fafc] hover:bg-[#182238]"
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── BulkActionBar ───
export function BulkActionBar({ count, onClear, children }) {
  if (!count) return null;
  return (
    <div className="sticky bottom-4 z-20 flex items-center gap-4 rounded-xl border border-[#d8b84f]/30 bg-[#121b2e] px-5 py-3 shadow-xl">
      <span className="text-sm font-semibold text-[#d8b84f]">{count} selected</span>
      <div className="flex flex-wrap gap-2">{children}</div>
      <button onClick={onClear} className="ml-auto text-xs text-[#8b95a7] hover:text-[#f8fafc]">Clear</button>
    </div>
  );
}

// ─── ProductThumbnail ───
const PRODUCT_THUMB_FALLBACK =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format";

export function ProductThumbnail({ src, alt = "", size = 40 }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [src]);
  const displaySrc = src && !failed ? src : PRODUCT_THUMB_FALLBACK;

  return (
    <div
      className="flex-none overflow-hidden rounded-lg bg-[#182238]"
      style={{ width: size, height: size }}
    >
      <img
        src={displaySrc}
        alt={alt}
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ─── OrderTimeline ───
const ORDER_PIPELINE_STEPS = [
  { key: "PLACED", label: "Placed", Icon: ShoppingBag },
  { key: "CONFIRMED", label: "Confirmed", Icon: BadgeCheck },
  { key: "PROCESSING", label: "Processing", Icon: RotateCw },
  { key: "PACKED", label: "Packed", Icon: Archive },
  { key: "SHIPPED", label: "Shipped", Icon: Truck },
  { key: "DELIVERED", label: "Delivered", Icon: PackageCheck },
];

export function OrderTimeline({ currentStatus }) {
  const pipelineStatus = normalizeOrderPipelineStatus(currentStatus);
  const idx = ORDER_PIPELINE.indexOf(pipelineStatus);
  const isCancelled = pipelineStatus === "CANCELLED" || pipelineStatus === "RETURNED";
  const hasStatus = idx >= 0;
  const activeIdx = hasStatus ? idx : -1;
  const stepCount = ORDER_PIPELINE.length;
  const segmentCount = Math.max(stepCount - 1, 0);

  return (
    <div className="order-timeline relative rounded-2xl border px-4 py-5">
      <style>{`
        @keyframes twowayTimelineShimmer {
          0% { transform: translateX(-120%); opacity: 0; }
          18% { opacity: .7; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        @keyframes twowayTimelinePulse {
          0%, 100% { opacity: .35; transform: scale(.96); }
          50% { opacity: .9; transform: scale(1.08); }
        }
      `}</style>

      <div className="order-timeline__glow pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" />

      <div className="relative">
        <div
          className="order-timeline__track pointer-events-none absolute z-0 hidden h-2 lg:flex"
          style={{
            top: "1.5rem",
            left: `calc(100% / ${stepCount * 2})`,
            right: `calc(100% / ${stepCount * 2})`,
          }}
        >
          {Array.from({ length: segmentCount }, (_, segIdx) => {
            const filled = isCancelled ? segIdx < segmentCount : hasStatus && segIdx < activeIdx;
            return (
              <div
                key={segIdx}
                className={`order-timeline__segment relative h-full flex-1 overflow-hidden ${segIdx === 0 ? "rounded-l-full" : ""} ${segIdx === segmentCount - 1 ? "rounded-r-full" : ""}`}
              >
                <div
                  className={`order-timeline__fill absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${isCancelled ? "is-cancelled" : ""}`}
                  style={{ width: filled ? "100%" : "0%" }}
                />
              </div>
            );
          })}
        </div>

        <div className="relative z-10 hidden lg:flex lg:justify-between lg:gap-4">
          {ORDER_PIPELINE_STEPS.map(({ key, label, Icon }, i) => {
            const active = !isCancelled && hasStatus && i === activeIdx;
            const muted = !active && !isCancelled;

            return (
              <div key={key} className="flex min-w-0 flex-1 flex-col items-center text-center">
                <div
                  className={[
                    "order-timeline__step relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500",
                    isCancelled && "is-cancelled",
                    active && "is-active",
                    muted && "is-muted",
                  ].filter(Boolean).join(" ")}
                >
                  {active && (
                    <>
                      <span
                        className="order-timeline__pulse absolute inset-[-6px] rounded-[1.35rem] border"
                        style={{ animation: "twowayTimelinePulse 1.9s ease-in-out infinite" }}
                      />
                      <span className="order-timeline__ring absolute inset-[-3px] rounded-[1.2rem] border" />
                    </>
                  )}
                  <Icon className="relative z-10 h-5 w-5" strokeWidth={2.25} />
                  {active && (
                    <span className="order-timeline__badge absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p
                  className={[
                    "order-timeline__label mt-2 text-[10px] font-semibold tracking-wide",
                    active && "is-active",
                    muted && "is-muted",
                    isCancelled && "is-cancelled",
                  ].filter(Boolean).join(" ")}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 overflow-visible sm:grid-cols-3 lg:hidden">
          {ORDER_PIPELINE_STEPS.map(({ key, label, Icon }, i) => {
            const active = !isCancelled && hasStatus && i === activeIdx;
            const muted = !active && !isCancelled;

            return (
              <div key={`${key}-m`} className="flex flex-col items-center text-center">
                <div
                  className={[
                    "order-timeline__step relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500",
                    isCancelled && "is-cancelled",
                    active && "is-active",
                    muted && "is-muted",
                  ].filter(Boolean).join(" ")}
                >
                  {active && (
                    <>
                      <span
                        className="order-timeline__pulse absolute inset-[-6px] rounded-[1.35rem] border"
                        style={{ animation: "twowayTimelinePulse 1.9s ease-in-out infinite" }}
                      />
                      <span className="order-timeline__ring absolute inset-[-3px] rounded-[1.2rem] border" />
                    </>
                  )}
                  <Icon className="relative z-10 h-5 w-5" strokeWidth={2.25} />
                  {active && (
                    <span className="order-timeline__badge absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p
                  className={[
                    "order-timeline__label mt-2 text-[10px] font-semibold tracking-wide",
                    active && "is-active",
                    muted && "is-muted",
                    isCancelled && "is-cancelled",
                  ].filter(Boolean).join(" ")}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const RETURN_PIPELINE_STEPS = [
  { key: "REQUESTED", label: "Requested", Icon: Inbox },
  { key: "APPROVED", label: "Approved", Icon: CheckCircle },
  { key: "RETURN_RECEIVED", label: "Received", Icon: PackageOpen },
  { key: "INSPECTED", label: "Inspected", Icon: Search },
  { key: "REFUNDED", label: "Refunded", Icon: Banknote },
];

/** Aggregate return counts by status — list page filter shortcuts. */
export function ReturnPipelineSummary({ counts = {}, activeFilter = "ALL", onFilter }) {
  const rejectedCount = counts[RETURN_TERMINAL_REJECTED] || 0;

  return (
    <div className="return-pipeline overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e] p-4">
      <div className="flex min-w-[640px] items-stretch gap-4">
        <div className="flex flex-1 items-center gap-0">
          {RETURN_PIPELINE_STEPS.map(({ key, label, Icon }, i) => {
            const count = counts[key] || 0;
            const active = activeFilter === key;
            return (
              <React.Fragment key={key}>
                <button
                  type="button"
                  onClick={() => onFilter?.(activeFilter === key ? "ALL" : key)}
                  className={`return-pipeline__step flex min-w-[88px] flex-1 flex-col items-center rounded-lg px-2 py-2 transition ${
                    active ? "is-active bg-[#d8b84f]/15" : "hover:bg-[#182238]"
                  }`}
                >
                  <div
                    className={`return-pipeline__icon flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                      count > 0
                        ? "border-[#d8b84f]/30 bg-[#d8b84f]/10 text-[#d8b84f]"
                        : "border-[#263145] bg-[#0f1726] text-[#8b95a7]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-bold tabular-nums ${
                      count > 0 ? "text-[#f8fafc]" : "text-[#8b95a7]"
                    }`}
                  >
                    {count}
                  </span>
                  <span
                    className={`mt-0.5 text-center text-[9px] font-semibold uppercase leading-tight tracking-wide ${
                      key === "REFUNDED"
                        ? "text-[#34d399]"
                        : active
                          ? "text-[#d8b84f]"
                          : "text-[#8b95a7]"
                    }`}
                  >
                    {label}
                  </span>
                </button>
                {i < RETURN_PIPELINE_STEPS.length - 1 && (
                  <div className="return-pipeline__connector h-0.5 min-w-[12px] flex-1 bg-[#263145]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="return-pipeline__rejected w-px shrink-0 bg-[#263145]" aria-hidden />
        <button
          type="button"
          onClick={() => onFilter?.(activeFilter === RETURN_TERMINAL_REJECTED ? "ALL" : RETURN_TERMINAL_REJECTED)}
          className={`return-pipeline__rejected-btn flex min-w-[88px] flex-col items-center justify-center rounded-lg px-3 py-2 transition ${
            activeFilter === RETURN_TERMINAL_REJECTED ? "bg-[#f87171]/15" : "hover:bg-[#182238]"
          }`}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              rejectedCount > 0
                ? "border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]"
                : "border-[#263145] bg-[#0f1726] text-[#8b95a7]"
            }`}
          >
            <XCircle className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span
            className={`mt-1.5 text-[10px] font-bold tabular-nums ${
              rejectedCount > 0 ? "text-[#f87171]" : "text-[#8b95a7]"
            }`}
          >
            {rejectedCount}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#f87171]">
            Rejected
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── ChartCard ───
export function ChartCard({ title, subtitle, actions, children }) {
  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#f8fafc]">{title}</h3>
          {subtitle && <p className="text-[11px] text-[#8b95a7]">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Smooth cubic path through points (Catmull-Rom style control points). */
function smoothLinePathThroughPoints(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// ─── MiniDonut (SVG) ───
export function MiniDonut({ segments = [], size = 120, thickness = 14, centerLabel, centerValue }) {
  const uid = React.useId().replace(/:/g, "");
  const total = segments.reduce((s, x) => s + Number(x.value || 0), 0) || 1;
  const r = size / 2 - thickness / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)]" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="overflow-visible" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={`${uid}-track`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#323d52" />
            <stop offset="100%" stopColor="#1a2332" />
          </linearGradient>
          <filter id={`${uid}-donut-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" floodColor="#000" />
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${uid}-track)`}
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        {segments.map((seg, i) => {
          const frac = Number(seg.value || 0) / total;
          const len = circ * frac;
          const dash = `${len} ${circ - len}`;
          const o = -offset;
          offset += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={o}
              strokeLinecap="round"
              filter={`url(#${uid}-donut-shadow)`}
              opacity={0.96}
            />
          );
        })}
      </svg>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium tracking-wide text-[#8b95a7]">{centerLabel}</span>
          <span className="text-lg font-bold tabular-nums tracking-tight text-[#f8fafc] drop-shadow-sm">{centerValue}</span>
        </div>
      )}
    </div>
  );
}

// ─── MiniAreaChart (SVG) — smooth curve, glow line, hover tooltip ───
export function MiniAreaChart({ data = [], yKey = "revenue", color = "#d8b84f", height = 200 }) {
  const baseId = React.useId().replace(/:/g, "");
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null);

  const layout = useMemo(() => {
    const width = 700;
    const padL = 52;
    const padR = 12;
    const padT = 10;
    const padB = 26;
    const iW = width - padL - padR;
    const iH = height - padT - padB;
    if (!data.length) {
      return { width, padL, padR, padT, padB, iW, iH, pts: [], smoothLine: "", areaD: "", max: 1, gridY: [], values: [] };
    }
    const values = data.map((d) => Number(d[yKey] || 0));
    const max = Math.max(1, ...values);
    const step = data.length > 1 ? iW / (data.length - 1) : 0;
    const pts = values.map((v, i) => [padL + i * step, padT + iH - (v / max) * iH]);
    const smoothLine = smoothLinePathThroughPoints(pts);
    const baseY = padT + iH;
    const last = pts[pts.length - 1];
    const first = pts[0];
    const areaD = `${smoothLine} L${last[0]},${baseY} L${first[0]},${baseY} Z`;
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: padT + iH * (1 - t), v: max * t }));
    return { width, padL, padR, padT, padB, iW, iH, pts, smoothLine, areaD, max, gridY, values };
  }, [data, yKey, height]);

  const fmtAxis = (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v)));

  const onChartPointer = useCallback(
    (clientX) => {
      if (!wrapRef.current || !data.length) return;
      const { width, padL, padR, iW } = layout;
      const rect = wrapRef.current.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * width;
      if (sx < padL - 4 || sx > width - padR + 4) {
        setHover(null);
        return;
      }
      const t = data.length > 1 ? (sx - padL) / iW : 0;
      const idx = data.length > 1 ? Math.min(data.length - 1, Math.max(0, Math.round(t * (data.length - 1)))) : 0;
      setHover(idx);
    },
    [data.length, layout]
  );

  if (!data.length) {
    return <div style={{ height }} className="flex items-center justify-center text-xs text-[#8b95a7]">No data</div>;
  }

  const { width, padL, padR, padT, iH, pts, smoothLine, areaD, gridY, values } = layout;
  const hi = hover != null ? hover : data.length - 1;
  const hx = pts[hi][0];
  const hy = pts[hi][1];
  const hVal = values[hi];
  const hDate = data[hi]?.date ? String(data[hi].date) : `Day ${hi + 1}`;
  const tipLeftPct = (hx / width) * 100;

  return (
    <div
      ref={wrapRef}
      className="relative select-none"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => onChartPointer(e.clientX)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) onChartPointer(t.clientX);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) onChartPointer(t.clientX);
      }}
    >
      {hover != null && (
        <div
          className="pointer-events-none absolute z-20 min-w-[120px] rounded-lg border border-[#3d4a5f]/80 bg-[#0c1018]/95 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
          style={{
            left: `${tipLeftPct}%`,
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b95a7]">{hDate}</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-[#f8fafc]">
            LKR {Math.round(hVal).toLocaleString()}
          </p>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="max-w-full overflow-visible">
        <defs>
          <linearGradient id={`${baseId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.42" />
            <stop offset="45%" stopColor={color} stopOpacity="0.14" />
            <stop offset="85%" stopColor={color} stopOpacity="0.03" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${baseId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f5e6b8" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${baseId}-shine`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${baseId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x={padL} y={padT} width={width - padL - padR} height={iH} fill={`url(#${baseId}-shine)`} opacity={0.4} />
        {gridY.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={width - padR} y1={g.y} y2={g.y} stroke="#2a3548" strokeWidth="1" strokeDasharray="4 6" opacity={0.85} />
            <text x={padL - 8} y={g.y + 3} textAnchor="end" fontSize="9" fill="#6b7280" fontWeight="500">
              {fmtAxis(g.v)}
            </text>
          </g>
        ))}
        <path d={areaD} fill={`url(#${baseId}-area)`} className="transition-opacity duration-300" />
        <path
          d={smoothLine}
          fill="none"
          stroke={`url(#${baseId}-line)`}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter={`url(#${baseId}-glow)`}
        />
        {hover != null && (
          <line
            x1={hx}
            x2={hx}
            y1={padT}
            y2={padT + iH}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.5}
          />
        )}
        <circle cx={hx} cy={hy} r="5" fill="#121b2e" stroke={color} strokeWidth="2.5" className="transition-all duration-150" />
        <circle cx={hx} cy={hy} r="2" fill="#fffcef" opacity={0.95} />
      </svg>
    </div>
  );
}

// ─── MiniBarChart — gradient fills, motion, hover glow ───
export function MiniBarChart({ items = [], color = "#d8b84f" }) {
  const max = Math.max(1, ...items.map((it) => Number(it.value || 0)));
  const [mounted, setMounted] = useState(false);
  const [hoverRow, setHoverRow] = useState(null);

  useEffect(() => {
    setMounted(false);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [items.length, max]);

  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const pct = Math.max(2.5, (Number(it.value) / max) * 100);
        const barColor = it.color || color;
        const isHover = hoverRow === i;
        return (
          <div
            key={i}
            className="rounded-lg px-0.5 py-1 transition-colors duration-200"
            style={{ background: isHover ? "rgba(216,184,79,0.06)" : "transparent" }}
            onMouseEnter={() => setHoverRow(i)}
            onMouseLeave={() => setHoverRow(null)}
          >
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className={`truncate font-medium transition-colors ${isHover ? "text-[#f8fafc]" : "text-[#e5e7eb]"}`}>
                {it.label}
              </span>
              <span className={`shrink-0 tabular-nums transition-colors ${isHover ? "text-[#d8b84f]" : "text-[#8b95a7]"}`}>
                {it.formattedValue || it.value}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full border border-[#2a3548]/80 bg-[#0f141d] p-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
              <div
                className="relative h-full overflow-hidden rounded-full"
                style={{
                  width: mounted ? `${pct}%` : "0%",
                  transition: "width 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
                  background: `linear-gradient(90deg, ${barColor}99 0%, ${barColor} 42%, rgba(255,255,255,0.22) 100%)`,
                  boxShadow: isHover
                    ? `0 0 16px ${barColor}66, inset 0 1px 0 rgba(255,255,255,0.25)`
                    : `0 0 10px ${barColor}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 55%)",
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Button variants ───
export function Btn({ variant = "secondary", size = "sm", children, className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:opacity-40";
  const sizes = { xs: "px-2 py-1 text-[11px]", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[#d8b84f] text-[#070b14] hover:bg-[#e5c866]",
    secondary: "border border-[#263145] bg-[#182238] text-[#f8fafc] hover:bg-[#263145]",
    danger: "border border-[#f87171]/20 bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20",
    ghost: "text-[#8b95a7] hover:text-[#f8fafc] hover:bg-[#182238]",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ─── Input ───
export function Input({ label, className = "", ...props }) {
  return (
    <div>
      {label && <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{label}</label>}
      <input
        className={`w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none focus:ring-1 focus:ring-[#d8b84f]/30 ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Select ───
export function Select({ label, options = [], className = "", ...props }) {
  return (
    <div>
      {label && <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{label}</label>}
      <select
        className={`w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#f8fafc] transition focus:border-[#d8b84f]/60 focus:outline-none ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── formatLkr ───
export function formatLkr(n, compact) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  if (compact) {
    if (Math.abs(x) >= 1e6) return `LKR ${(x / 1e6).toFixed(1)}M`;
    if (Math.abs(x) >= 1e3) return `LKR ${(x / 1e3).toFixed(1)}k`;
  }
  return `LKR ${x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toLocaleString() : "—";
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// ─── StockBadge ───
export function StockBadge({ stock, threshold = 5 }) {
  if (stock <= 0) return <StatusBadge status="critical" className="!text-[10px]" />;
  if (stock <= threshold) return <span className="rounded-md bg-[#f59e0b]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#f59e0b]">Low ({stock})</span>;
  return <span className="text-xs tabular-nums text-[#34d399]">{stock}</span>;
}

// ─── ListingQuality ───
export function ListingQuality({ score }) {
  const color = score >= 80 ? "#34d399" : score >= 50 ? "#f59e0b" : "#f87171";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#263145]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── PlaceholderPage ───
export function PlaceholderPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-4 rounded-full bg-[#182238] p-4">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#8b95a7" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#f8fafc]">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#8b95a7]">{description || "This section is planned for a future release."}</p>
      <span className="mt-4 rounded-full bg-[#d8b84f]/15 px-3 py-1 text-xs font-semibold text-[#d8b84f]">Coming Soon</span>
    </div>
  );
}
