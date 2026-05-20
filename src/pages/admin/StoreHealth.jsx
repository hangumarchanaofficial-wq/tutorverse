import React, { useMemo } from "react";
import {
  Ban,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Package,
  ShieldAlert,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import {
  PageHeader, StatusBadge,
} from "../../admin/components/ui";
import {
  products, orders, payments, reviews, returns,
} from "../../admin/data/mockData";

const METRIC_ICONS = {
  "cancel-rate": Ban,
  "fail-rate": CreditCard,
  "return-rate": Undo2,
  "low-stock": Package,
  "review-backlog": ClipboardList,
  "avg-rating": BarChart3,
};

function HealthMetricIcon({ metricId, health, size = "md" }) {
  const Icon = METRIC_ICONS[metricId] || BarChart3;
  const tone =
    health === "critical"
      ? "border-[#f87171]/25 text-[#f87171] bg-[#f87171]/[0.07]"
      : health === "warning"
        ? "border-[#f59e0b]/25 text-[#f59e0b] bg-[#f59e0b]/[0.07]"
        : "border-[#34d399]/25 text-[#34d399] bg-[#34d399]/[0.07]";
  const box = size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl";
  const glyph = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className={`flex shrink-0 items-center justify-center border ${box} ${tone}`} aria-hidden>
      <Icon className={glyph} strokeWidth={1.65} />
    </div>
  );
}

function getHealthStatus(value, thresholds) {
  if (thresholds.type === "rate") {
    if (value < 5) return "healthy";
    if (value <= 15) return "warning";
    return "critical";
  }
  if (thresholds.type === "rating") {
    if (value > 4) return "healthy";
    if (value >= 3) return "warning";
    return "critical";
  }
  if (thresholds.type === "count") {
    if (value === 0) return "healthy";
    if (value <= thresholds.warnAt) return "warning";
    return "critical";
  }
  return "healthy";
}

export default function StoreHealth() {
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === "CANCELLED").length;
    const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    const totalPayments = payments.length;
    const failedPayments = payments.filter((p) => p.status === "FAILED").length;
    const failedRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0;

    const totalReturns = returns.length;
    const ordersWithReturns = new Set(returns.map((r) => String(r.orderId))).size;
    const returnRate =
      totalOrders > 0 ? Math.min(100, (ordersWithReturns / totalOrders) * 100) : 0;

    const activeProducts = products.filter((p) => p.isActive);
    const lowStockItems = activeProducts.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
    const lowStockRate = activeProducts.length > 0 ? (lowStockItems / activeProducts.length) * 100 : 0;

    const pendingReviews = reviews.filter((r) => r.status === "pending").length;

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return [
      {
        id: "cancel-rate",
        name: "Order Cancellation Rate",
        value: cancelRate,
        display: `${cancelRate.toFixed(1)}%`,
        detail: `${cancelledOrders} of ${totalOrders} orders`,
        health: getHealthStatus(cancelRate, { type: "rate" }),
      },
      {
        id: "fail-rate",
        name: "Failed Payment Rate",
        value: failedRate,
        display: `${failedRate.toFixed(1)}%`,
        detail: `${failedPayments} of ${totalPayments} payments`,
        health: getHealthStatus(failedRate, { type: "rate" }),
      },
      {
        id: "return-rate",
        name: "Return Rate",
        value: returnRate,
        display: `${returnRate.toFixed(1)}%`,
        detail: `${totalReturns} return${totalReturns === 1 ? "" : "s"} · ${ordersWithReturns} of ${totalOrders} orders`,
        health: getHealthStatus(returnRate, { type: "rate" }),
      },
      {
        id: "low-stock",
        name: "Low Stock Risk",
        value: lowStockRate,
        display: `${lowStockRate.toFixed(1)}%`,
        detail: `${lowStockItems} of ${activeProducts.length} active products`,
        health: getHealthStatus(lowStockRate, { type: "rate" }),
      },
      {
        id: "review-backlog",
        name: "Review Approval Backlog",
        value: pendingReviews,
        display: String(pendingReviews),
        detail: `${pendingReviews} reviews awaiting moderation`,
        health: getHealthStatus(pendingReviews, { type: "count", warnAt: 3 }),
      },
      {
        id: "avg-rating",
        name: "Average Rating",
        value: avgRating,
        display: `${avgRating.toFixed(1)} / 5.0`,
        detail: `Across ${reviews.length} reviews`,
        health: getHealthStatus(avgRating, { type: "rating" }),
      },
    ];
  }, []);

  const healthyCount = metrics.filter((m) => m.health === "healthy").length;
  const warningCount = metrics.filter((m) => m.health === "warning").length;
  const criticalCount = metrics.filter((m) => m.health === "critical").length;

  const overallHealth = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy";
  const overallLabel = overallHealth === "healthy" ? "All systems healthy" : overallHealth === "warning" ? "Some areas need attention" : "Critical issues detected";

  const recommendations = useMemo(() => {
    const recs = [];
    metrics.forEach((m) => {
      if (m.health === "critical") {
        if (m.id === "cancel-rate") recs.push({ priority: "critical", text: "High cancellation rate — review fulfillment SLAs and inventory accuracy." });
        if (m.id === "fail-rate") recs.push({ priority: "critical", text: "Payment failures are too high — check gateway configuration and retry policies." });
        if (m.id === "return-rate") recs.push({ priority: "critical", text: "Return rate is elevated — inspect product quality and listing accuracy." });
        if (m.id === "low-stock") recs.push({ priority: "critical", text: "Too many products at low stock — schedule a restock immediately." });
        if (m.id === "avg-rating") recs.push({ priority: "critical", text: "Average rating is very low — address product quality and customer service." });
      } else if (m.health === "warning") {
        if (m.id === "cancel-rate") recs.push({ priority: "warning", text: "Cancellation rate is moderate — monitor order confirmation workflow." });
        if (m.id === "fail-rate") recs.push({ priority: "warning", text: "Some payment failures detected — verify payment provider uptime." });
        if (m.id === "return-rate") recs.push({ priority: "warning", text: "Return rate is elevated — review recently returned products for patterns." });
        if (m.id === "low-stock") recs.push({ priority: "warning", text: "Several products approaching low stock — plan restocking soon." });
        if (m.id === "review-backlog") recs.push({ priority: "warning", text: "Pending reviews backlog growing — moderate reviews to maintain trust." });
        if (m.id === "avg-rating") recs.push({ priority: "warning", text: "Average rating is average — focus on product quality improvements." });
      }
    });
    if (recs.length === 0) recs.push({ priority: "healthy", text: "Store is performing well across all health metrics. Keep it up!" });
    return recs;
  }, [metrics]);

  return (
    <div className="admin-products-page admin-store-health space-y-6">
      <PageHeader
        title="Store Health"
        subtitle="Dashboard · Analytics · Store Health"
        badge={<StatusBadge status={overallHealth} />}
      />

      {/* Overall Summary */}
      <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4 ${
        overallHealth === "healthy" ? "border-[#34d399]/20 bg-[#34d399]/5" :
        overallHealth === "warning" ? "border-[#f59e0b]/20 bg-[#f59e0b]/5" :
        "border-[#f87171]/20 bg-[#f87171]/5"
      }`}>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            overallHealth === "healthy"
              ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
              : overallHealth === "warning"
                ? "border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]"
                : "border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]"
          }`}
          aria-hidden
        >
          {overallHealth === "healthy" ? (
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
          ) : overallHealth === "warning" ? (
            <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
          ) : (
            <ShieldAlert className="h-6 w-6" strokeWidth={1.75} />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-[#f8fafc]">{overallLabel}</p>
          <p className="text-xs text-[#8b95a7]">
            {healthyCount} healthy · {warningCount} warnings · {criticalCount} critical
          </p>
        </div>
      </div>

      {/* Health Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.id} className={`rounded-xl border bg-[#121b2e] p-5 transition hover:bg-[#182238] ${
            m.health === "critical" ? "border-[#f87171]/30" :
            m.health === "warning" ? "border-[#f59e0b]/30" :
            "border-[#34d399]/30"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{m.name}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-[#f8fafc]">{m.display}</p>
              </div>
              <HealthMetricIcon metricId={m.id} health={m.health} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#8b95a7]">{m.detail}</span>
              <StatusBadge status={m.health} />
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#263145]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:
                    m.id === "avg-rating"
                      ? `${(m.value / 5) * 100}%`
                      : m.id === "review-backlog"
                        ? `${Math.min(100, (m.value / 10) * 100)}%`
                        : `${Math.min(100, Math.max(0, m.value))}%`,
                  background:
                    m.health === "healthy" ? "#34d399" : m.health === "warning" ? "#f59e0b" : "#f87171",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-5">
        <h3 className="text-sm font-bold text-[#f8fafc]">Recommendations</h3>
        <p className="text-[11px] text-[#8b95a7]">Actionable insights based on current health metrics</p>
        <div className="mt-4 space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-[#0f1726] px-4 py-3">
              <span className={`mt-0.5 h-2 w-2 flex-none rounded-full ${
                rec.priority === "critical" ? "bg-[#f87171]" :
                rec.priority === "warning" ? "bg-[#f59e0b]" :
                "bg-[#34d399]"
              }`} />
              <p className="text-xs text-[#f8fafc]">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
        <div className="border-b border-[#263145] px-5 py-3">
          <h3 className="text-sm font-bold text-[#f8fafc]">Detailed Breakdown</h3>
        </div>

        {/* Mobile */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {metrics.map((m) => (
            <li key={m.id} className="flex gap-3 px-4 py-3 transition hover:bg-[#182238]/60">
              <HealthMetricIcon metricId={m.id} health={m.health} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#f8fafc]">{m.name}</p>
                  <StatusBadge status={m.health} />
                </div>
                <p className="mt-1 font-mono text-sm tabular-nums text-[#f8fafc]">{m.display}</p>
                <p className="mt-0.5 text-xs text-[#8b95a7]">{m.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 align-middle font-medium">Metric</th>
                <th className="px-4 py-3 align-middle text-right font-medium">Value</th>
                <th className="px-4 py-3 align-middle font-medium">Status</th>
                <th className="px-4 py-3 align-middle font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {metrics.map((m) => (
                <tr key={m.id} className="transition hover:bg-[#182238]/60">
                  <td className="align-middle px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <HealthMetricIcon metricId={m.id} health={m.health} size="sm" />
                      <span className="font-medium text-[#f8fafc]">{m.name}</span>
                    </div>
                  </td>
                  <td className="align-middle whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-[#f8fafc]">
                    {m.display}
                  </td>
                  <td className="align-middle whitespace-nowrap px-4 py-3">
                    <StatusBadge status={m.health} />
                  </td>
                  <td className="align-middle px-4 py-3 text-[#8b95a7]">{m.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
