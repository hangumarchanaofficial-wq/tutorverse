import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  BarChart3,
  Ban,
  CircleCheck,
  Clock,
  Gem,
  Package,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tag,
  TrendingDown,
  UserPlus,
  Users,
} from "lucide-react";
import {
  PageHeader, StatCard, StatusBadge, Tabs, ChartCard, Btn,
  MiniAreaChart, MiniBarChart, MiniDonut, DateRangeSelector,
  formatLkr, formatNum, timeAgo, useToast, StockBadge,
} from "../../admin/components/ui";
import {
  products, orders, customers, payments, returns,
  getRevenueChartData, getOrdersByStatus, getCategorySales, getPaymentMethodBreakdown,
} from "../../admin/data/mockData";

const TAB_DEFS = [
  { id: "sales", label: "Sales" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "inventory", label: "Inventory" },
  { id: "finance", label: "Finance" },
];

const DAY_MS = 864e5;

const ORDER_STATUS_ORDER = [
  "DELIVERED", "SHIPPED", "PROCESSING", "PACKED", "PLACED", "CONFIRMED", "CANCELLED", "RETURNED",
];

const STATUS_COLORS = {
  PLACED: "#38bdf8",
  CONFIRMED: "#c084fc",
  PROCESSING: "#3b82f6",
  PACKED: "#a855f7",
  SHIPPED: "#14b8a6",
  DELIVERED: "#22c55e",
  CANCELLED: "#fb7185",
  RETURNED: "#fb923c",
};

const CATEGORY_COLORS = {
  Electronics: "#d8b84f",
  Beauty: "#34d399",
  Fashion: "#a78bfa",
  Accessories: "#60a5fa",
  Home: "#f59e0b",
  Food: "#fb923c",
};

const PAYMENT_METHOD_COLORS = {
  PAYHERE: "#d8b84f",
  STRIPE: "#a78bfa",
  COD: "#60a5fa",
  BANK: "#34d399",
};

function categoryColor(name) {
  return CATEGORY_COLORS[name] || "#8b95a7";
}

function KpiGrid({ children, className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" }) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

function LegendRow({ color, label, value, index = 0 }) {
  return (
    <motion.div
      className="flex items-center justify-between text-xs"
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.3 }}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span className="truncate text-[#8b95a7]">{label}</span>
      </span>
      <span className="tabular-nums text-[#f8fafc]">{value}</span>
    </motion.div>
  );
}

function formatStatusLabel(status) {
  return String(status)
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function rangeCutoffMs(range) {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  switch (range) {
    case "today":
      return startOfToday.getTime();
    case "7d":
      return now - 7 * DAY_MS;
    case "30d":
      return now - 30 * DAY_MS;
    case "month":
      return now - 30 * DAY_MS;
    case "90d":
      return now - 90 * DAY_MS;
    default:
      return now - 30 * DAY_MS;
  }
}

function chartDaysForRange(range) {
  switch (range) {
    case "today":
      return 1;
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "month":
      return 30;
    case "90d":
      return 90;
    default:
      return 30;
  }
}

function chartSubtitleForRange(range) {
  switch (range) {
    case "today":
      return "Today";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "month":
      return "This month (rolling 30d)";
    case "90d":
      return "Last 90 days";
    default:
      return "Last 30 days";
  }
}

function ExportBtn({ label = "Export CSV" }) {
  const toast = useToast();
  return (
    <Btn variant="secondary" size="xs" onClick={() => toast?.("Exported — CSV download started")}>
      {label}
    </Btn>
  );
}

function TH({ children }) {
  return <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">{children}</th>;
}

function TD({ children, className = "" }) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>;
}

// ─── Sales Tab ───
function SalesTab({ range }) {
  const cutoff = useMemo(() => rangeCutoffMs(range), [range]);
  const ordersInRange = useMemo(
    () => orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff),
    [cutoff]
  );

  const ordersByStatus = useMemo(() => getOrdersByStatus(ordersInRange), [ordersInRange]);
  const categorySales = useMemo(() => getCategorySales(), []);

  const totalRevenue = ordersInRange.reduce((s, o) => s + o.totalAmount, 0);
  const totalDiscounts = ordersInRange.reduce((s, o) => s + o.discount, 0);
  const shippingCollected = ordersInRange.reduce((s, o) => s + o.shipping, 0);
  const netRevenue = totalRevenue - totalDiscounts + shippingCollected;

  const avgOrderValue = ordersInRange.length > 0 ? totalRevenue / ordersInRange.length : 0;
  const paidCount = ordersInRange.filter((o) => o.paymentStatus === "PAID").length;

  const chartData = useMemo(() => getRevenueChartData(chartDaysForRange(range)), [range]);

  const donutSegments = useMemo(
    () =>
      ORDER_STATUS_ORDER.filter((k) => ordersByStatus[k]).map((status) => ({
        key: status,
        label: formatStatusLabel(status),
        value: ordersByStatus[status],
        color: STATUS_COLORS[status] || "#8b95a7",
      })),
    [ordersByStatus]
  );

  const donutTotal = ordersInRange.length;

  const peakDay = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((best, d) => (d.revenue > best.revenue ? d : best), chartData[0]);
  }, [chartData]);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <StatCard label="Total Revenue" value={formatLkr(totalRevenue)} trend={12.4} animateValue icon={<Banknote className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Total Orders" value={formatNum(ordersInRange.length)} trend={5.3} animateValue icon={<Package className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Avg Order Value" value={formatLkr(avgOrderValue)} trend={3.2} animateValue icon={<BarChart3 className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Paid Orders" value={formatNum(paidCount)} variant="success" animateValue icon={<CircleCheck className="h-4 w-4" strokeWidth={2} />} />
      </KpiGrid>

      {peakDay && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="flex items-center gap-2 rounded-lg border border-[#d8b84f]/25 bg-[#d8b84f]/8 px-4 py-2.5 text-xs text-[#8b95a7]"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d8b84f]" strokeWidth={2} />
          <span>
            Peak day in range:{" "}
            <span className="font-semibold text-[#f8fafc]">{peakDay.date}</span>
            {" · "}
            <span className="font-semibold tabular-nums text-[#d8b84f]">{formatLkr(peakDay.revenue)}</span>
          </span>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue by Day" subtitle={chartSubtitleForRange(range)} actions={<ExportBtn />}>
          <MiniAreaChart key={range} data={chartData} yKey="revenue" color="#d8b84f" height={200} />
        </ChartCard>
        <ChartCard title="Revenue by Category" subtitle="Lifetime catalog roll-up" actions={<ExportBtn />}>
          <MiniBarChart
            items={categorySales.map((c) => ({
              label: c.name,
              value: c.revenue,
              formattedValue: formatLkr(c.revenue, true),
              color: categoryColor(c.name),
            }))}
          />
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Orders by Status" subtitle={`${donutTotal} in selected range`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <MiniDonut segments={donutSegments} size={140} thickness={16} centerLabel="Orders" centerValue={donutTotal} />
            <div className="min-w-0 flex-1 space-y-1.5">
              {donutSegments.map((s, i) => (
                <LegendRow key={s.key} color={s.color} label={s.label} value={s.value} index={i} />
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Revenue Summary" subtitle="Aligned with orders in the selected date range.">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b95a7]">Gross Revenue</span>
              <span className="font-mono tabular-nums text-[#f8fafc]">{formatLkr(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b95a7]">Total Discounts</span>
              <span className="font-mono tabular-nums text-[#f87171]">-{formatLkr(totalDiscounts)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b95a7]">Shipping Collected</span>
              <span className="font-mono tabular-nums text-[#f8fafc]">{formatLkr(shippingCollected)}</span>
            </div>
            <hr className="border-[#263145]" />
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#f8fafc]">Net Revenue</span>
              <span className="font-mono tabular-nums text-[#34d399]">{formatLkr(netRevenue)}</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

// ─── Products Tab ───
function ProductsTab() {
  const bestSellers = useMemo(() => [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 6), []);
  const slowMovers = useMemo(() => [...products].filter((p) => p.isActive).sort((a, b) => a.salesCount - b.salesCount).slice(0, 5), []);
  const noSales = products.filter((p) => p.salesCount === 0);
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.lowStockThreshold);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f8fafc]">Best Sellers</h3>
        <ExportBtn />
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr><TH>#</TH><TH>Product</TH><TH>Category</TH><TH>Sales</TH><TH>Revenue</TH><TH>Rating</TH><TH>Stock</TH></tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {bestSellers.map((p, i) => (
              <tr key={p.id} className="transition hover:bg-[#182238]">
                <TD className="font-bold text-[#d8b84f]">{i + 1}</TD>
                <TD className="font-medium text-[#f8fafc]">{p.name}</TD>
                <TD className="text-[#8b95a7]">{p.categoryName}</TD>
                <TD className="font-mono tabular-nums text-[#f8fafc]">{formatNum(p.salesCount)}</TD>
                <TD className="font-mono tabular-nums text-[#34d399]">{formatLkr(p.revenue, true)}</TD>
                <TD><span className="text-[#f59e0b]">★</span> {p.ratingAvg.toFixed(1)}</TD>
                <TD><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#263145] bg-[#121b2e]">
          <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3">
            <h3 className="text-sm font-bold text-[#f8fafc]">Slow Movers</h3>
            <ExportBtn />
          </div>
          <div className="divide-y divide-[#263145]/50">
            {slowMovers.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-medium text-[#f8fafc]">{p.name}</p>
                  <p className="text-[10px] text-[#8b95a7]">{p.categoryName} · {p.sku}</p>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#8b95a7]">{p.salesCount} sold</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#263145] bg-[#121b2e]">
          <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3">
            <h3 className="text-sm font-bold text-[#f8fafc]">Low Stock Products</h3>
            <span className="rounded-md bg-[#f87171]/15 px-2 py-0.5 text-[10px] font-semibold text-[#f87171]">{lowStock.length}</span>
          </div>
          <div className="divide-y divide-[#263145]/50">
            {lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-[#8b95a7]">All stock levels healthy</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-medium text-[#f8fafc]">{p.name}</p>
                    <p className="text-[10px] text-[#8b95a7]">{p.sku}</p>
                  </div>
                  <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {noSales.length > 0 && (
        <div className="rounded-xl border border-[#263145] bg-[#121b2e]">
          <div className="border-b border-[#263145] px-5 py-3">
            <h3 className="text-sm font-bold text-[#f8fafc]">No-Sales Products</h3>
          </div>
          <p className="px-5 py-6 text-center text-xs text-[#8b95a7]">All products have at least one sale</p>
        </div>
      )}
    </div>
  );
}

// ─── Customers Tab ───
function CustomersTab() {
  const repeatCustomers = customers.filter((c) => c.isRepeat);
  const newCustomers = customers.filter((c) => !c.isRepeat);
  const topBySpent = useMemo(() => [...customers].sort((a, b) => b.totalSpent - a.totalSpent), []);
  const totalLTV = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

  return (
    <div className="space-y-4">
      <KpiGrid>
        <StatCard label="Total Customers" value={formatNum(customers.length)} trend={15.6} animateValue icon={<Users className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Repeat Customers" value={formatNum(repeatCustomers.length)} helpText={`${((repeatCustomers.length / customers.length) * 100).toFixed(0)}% rate`} icon={<RefreshCw className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="New Customers" value={formatNum(newCustomers.length)} trend={22.1} animateValue icon={<UserPlus className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Avg Lifetime Value" value={formatLkr(avgLTV)} trend={8.4} animateValue icon={<Gem className="h-4 w-4" strokeWidth={2} />} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="New vs Repeat" subtitle="Customer distribution">
          <MiniDonut
            segments={[
              { label: "Repeat", value: repeatCustomers.length, color: "#d8b84f" },
              { label: "New", value: newCustomers.length, color: "#60a5fa" },
            ]}
            size={120}
            thickness={14}
            centerLabel="Total"
            centerValue={customers.length}
          />
          <div className="mt-3 flex justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d8b84f]" /> Repeat ({repeatCustomers.length})</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#60a5fa]" /> New ({newCustomers.length})</span>
          </div>
        </ChartCard>

        <ChartCard title="Customer Lifetime Value" subtitle="Aggregate spend across all customers">
          <div className="space-y-3">
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Total Revenue from Customers</span><span className="font-mono tabular-nums text-[#f8fafc]">{formatLkr(totalLTV)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Average LTV</span><span className="font-mono tabular-nums text-[#d8b84f]">{formatLkr(avgLTV)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Highest LTV</span><span className="font-mono tabular-nums text-[#34d399]">{formatLkr(topBySpent[0]?.totalSpent)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Avg Orders / Customer</span><span className="font-mono tabular-nums text-[#f8fafc]">{(customers.reduce((s, c) => s + c.ordersCount, 0) / customers.length).toFixed(1)}</span></div>
          </div>
        </ChartCard>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f8fafc]">Top Customers by Spend</h3>
        <ExportBtn />
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr><TH>Customer</TH><TH>Email</TH><TH>Orders</TH><TH>Total Spent</TH><TH>Avg Order</TH><TH>Status</TH><TH>Last Order</TH></tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {topBySpent.map((c) => (
              <tr key={c.id} className="transition hover:bg-[#182238]">
                <TD className="font-medium text-[#f8fafc]">{c.name}</TD>
                <TD className="text-[#8b95a7]">{c.email}</TD>
                <TD className="font-mono tabular-nums text-[#f8fafc]">{c.ordersCount}</TD>
                <TD className="font-mono tabular-nums text-[#34d399]">{formatLkr(c.totalSpent)}</TD>
                <TD className="font-mono tabular-nums text-[#8b95a7]">{formatLkr(c.avgOrderValue)}</TD>
                <TD><StatusBadge status={c.status} /></TD>
                <TD className="text-[#8b95a7]">{timeAgo(c.lastOrder)}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inventory Tab ───
function InventoryTab() {
  const activeProducts = products.filter((p) => p.isActive);
  const stockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const retailValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const outOfStock = products.filter((p) => p.isActive && p.stock === 0);
  const lowStock = products.filter((p) => p.isActive && p.stock > 0 && p.stock <= p.lowStockThreshold);
  const healthyStock = activeProducts.length - outOfStock.length - lowStock.length;

  const restockRecommendations = [...outOfStock, ...lowStock].sort((a, b) => b.salesCount - a.salesCount);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <StatCard label="Stock Value (Cost)" value={formatLkr(stockValue)} helpText="At cost price" animateValue icon={<Tag className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Stock Value (Retail)" value={formatLkr(retailValue)} helpText="At selling price" animateValue icon={<Banknote className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Out of Stock" value={formatNum(outOfStock.length)} variant="danger" animateValue icon={<Ban className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Low Stock" value={formatNum(lowStock.length)} variant="warning" animateValue icon={<TrendingDown className="h-4 w-4" strokeWidth={2} />} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Stock Health" subtitle="Active product stock levels">
          <div className="flex items-center gap-6">
            <MiniDonut
              segments={[
                { label: "Healthy", value: healthyStock, color: "#34d399" },
                { label: "Low", value: lowStock.length, color: "#f59e0b" },
                { label: "Out", value: outOfStock.length, color: "#f87171" },
              ]}
              size={120}
              thickness={14}
              centerLabel="Products"
              centerValue={activeProducts.length}
            />
            <div className="flex-1 space-y-2">
              <LegendRow color="#34d399" label="Healthy" value={healthyStock} index={0} />
              <LegendRow color="#f59e0b" label="Low Stock" value={lowStock.length} index={1} />
              <LegendRow color="#f87171" label="Out of Stock" value={outOfStock.length} index={2} />
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Stock Movement Summary" subtitle="Units across all SKUs">
          <div className="space-y-3">
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Total Units in Stock</span><span className="font-mono tabular-nums text-[#f8fafc]">{formatNum(products.reduce((s, p) => s + p.stock, 0))}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Reserved Stock</span><span className="font-mono tabular-nums text-[#f59e0b]">{formatNum(products.reduce((s, p) => s + p.reservedStock, 0))}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Available Stock</span><span className="font-mono tabular-nums text-[#34d399]">{formatNum(products.reduce((s, p) => s + p.stock - p.reservedStock, 0))}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Total SKUs</span><span className="font-mono tabular-nums text-[#f8fafc]">{products.length}</span></div>
          </div>
        </ChartCard>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f8fafc]">Restock Recommendations</h3>
        <ExportBtn />
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr><TH>Product</TH><TH>SKU</TH><TH>Current Stock</TH><TH>Threshold</TH><TH>Sales Velocity</TH><TH>Priority</TH></tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {restockRecommendations.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-[#8b95a7]">No restock needed</td></tr>
            ) : (
              restockRecommendations.map((p) => (
                <tr key={p.id} className="transition hover:bg-[#182238]">
                  <TD className="font-medium text-[#f8fafc]">{p.name}</TD>
                  <TD className="font-mono text-[#8b95a7]">{p.sku}</TD>
                  <TD><StockBadge stock={p.stock} threshold={p.lowStockThreshold} /></TD>
                  <TD className="tabular-nums text-[#8b95a7]">{p.lowStockThreshold}</TD>
                  <TD className="tabular-nums text-[#f8fafc]">{p.salesCount} sold</TD>
                  <TD><StatusBadge status={p.stock === 0 ? "critical" : "warning"} /></TD>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Finance Tab ───
function FinanceTab() {
  const paymentBreakdown = useMemo(() => getPaymentMethodBreakdown(), []);
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const failedPayments = payments.filter((p) => p.status === "FAILED");
  const paidPayments = payments.filter((p) => p.status === "PAID");
  const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0);
  const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);
  const totalRefunds = returns.filter((r) => r.status === "REFUNDED").reduce((s, r) => s + r.refundAmount, 0);
  const pendingRefunds = returns.filter((r) => r.status !== "REFUNDED" && r.status !== "REJECTED").reduce((s, r) => s + r.refundAmount, 0);

  return (
    <div className="space-y-4">
      <KpiGrid>
        <StatCard label="Total Collected" value={formatLkr(totalPaid)} variant="success" trend={9.8} animateValue icon={<CircleCheck className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Pending Collection" value={formatLkr(totalPending)} variant="warning" animateValue icon={<Clock className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Refunds Issued" value={formatLkr(totalRefunds)} variant="danger" animateValue icon={<RotateCcw className="h-4 w-4" strokeWidth={2} />} />
        <StatCard label="Pending Refunds" value={formatLkr(pendingRefunds)} animateValue icon={<RefreshCw className="h-4 w-4" strokeWidth={2} />} />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Payment Method Breakdown" subtitle="Revenue by gateway" actions={<ExportBtn />}>
          <MiniBarChart
            labelClassName="uppercase tracking-wide font-semibold"
            items={paymentBreakdown.map((p) => ({
              label: p.method,
              value: p.amount,
              formattedValue: formatLkr(p.amount, true),
              color: PAYMENT_METHOD_COLORS[p.method] || "#60a5fa",
            }))}
          />
          <div className="mt-3 space-y-1">
            {paymentBreakdown.map((p) => (
              <div key={p.method} className="flex items-center justify-between text-[11px]">
                <span className="text-[#8b95a7]">{p.method}</span>
                <span className="tabular-nums text-[#f8fafc]">{p.count} transactions</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Refund Summary" subtitle="Returns and liability">
          <div className="space-y-3">
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Total Returns</span><span className="tabular-nums text-[#f8fafc]">{returns.length}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Refunded</span><span className="font-mono tabular-nums text-[#f87171]">{formatLkr(totalRefunds)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Pending Refund Amount</span><span className="font-mono tabular-nums text-[#f59e0b]">{formatLkr(pendingRefunds)}</span></div>
            <hr className="border-[#263145]" />
            <div className="flex justify-between text-xs"><span className="text-[#8b95a7]">Total Refund Liability</span><span className="font-mono tabular-nums font-bold text-[#f8fafc]">{formatLkr(totalRefunds + pendingRefunds)}</span></div>
            {returns.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#0f1726] px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-[#f8fafc]">{r.productName}</p>
                  <p className="text-[10px] text-[#8b95a7]">{r.customerName} · {r.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs tabular-nums text-[#f8fafc]">{formatLkr(r.refundAmount)}</p>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f8fafc]">Pending Payments</h3>
        <ExportBtn />
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr><TH>Order</TH><TH>Customer</TH><TH>Method</TH><TH>Amount</TH><TH>Status</TH><TH>Date</TH></tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {pendingPayments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-[#8b95a7]">No pending payments</td></tr>
            ) : (
              pendingPayments.map((p) => (
                <tr key={p.id} className="transition hover:bg-[#182238]">
                  <TD className="font-mono font-semibold text-[#d8b84f]">{p.orderNumber}</TD>
                  <TD className="text-[#f8fafc]">{p.customerName}</TD>
                  <TD className="text-[#8b95a7]">{p.method}</TD>
                  <TD className="font-mono tabular-nums text-[#f8fafc]">{formatLkr(p.amount)}</TD>
                  <TD><StatusBadge status={p.status} /></TD>
                  <TD className="text-[#8b95a7]">{timeAgo(p.createdAt)}</TD>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {failedPayments.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-[#f8fafc]">Failed Payments</h3>
          <div className="overflow-x-auto rounded-xl border border-[#f87171]/20 bg-[#121b2e]">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-[#263145] bg-[#0f1726]">
                <tr><TH>Order</TH><TH>Customer</TH><TH>Gateway</TH><TH>Amount</TH><TH>Ref</TH><TH>Date</TH></tr>
              </thead>
              <tbody className="divide-y divide-[#263145]/50">
                {failedPayments.map((p) => (
                  <tr key={p.id} className="transition hover:bg-[#182238]">
                    <TD className="font-mono font-semibold text-[#f87171]">{p.orderNumber}</TD>
                    <TD className="text-[#f8fafc]">{p.customerName}</TD>
                    <TD className="text-[#8b95a7]">{p.gateway}</TD>
                    <TD className="font-mono tabular-nums text-[#f8fafc]">{formatLkr(p.amount)}</TD>
                    <TD className="font-mono text-[#8b95a7]">{p.transactionRef || "—"}</TD>
                    <TD className="text-[#8b95a7]">{timeAgo(p.createdAt)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───
export default function ReportsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");

  const activeTab = TAB_DEFS.some((t) => t.id === section) ? section : "sales";

  useEffect(() => {
    if (!TAB_DEFS.some((t) => t.id === section)) {
      navigate(`/admin/reports/${activeTab}`, { replace: true });
    }
  }, [section, activeTab, navigate]);

  return (
    <div className="admin-products-page admin-reports-page min-w-0 space-y-6">
      <PageHeader
        title="Reports"
        badge={
          <span className="rounded-md border border-[#d8b84f]/35 bg-[#d8b84f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d8b84f]">
            Advanced
          </span>
        }
        subtitle="Dashboard · Analytics · Reports"
        actions={<DateRangeSelector value={range} onChange={setRange} />}
      />

      <Tabs tabs={TAB_DEFS} activeTab={activeTab} onChange={(id) => navigate(`/admin/reports/${id}`)} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          className="min-w-0"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          {activeTab === "sales" && <SalesTab range={range} />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "customers" && <CustomersTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "finance" && <FinanceTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
