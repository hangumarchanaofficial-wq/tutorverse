/**
 * Rich dashboard analytics derived from admin mockData.
 * Merged with live /admin/analytics when the API returns sparse or empty data.
 */
import { orders, products, reviews, customers } from "./mockData";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

const PROVINCE_FROM_ADDRESS = [
  { match: /colombo/i, province: "Western" },
  { match: /kandy/i, province: "Central" },
  { match: /galle|matara/i, province: "Southern" },
  { match: /negombo/i, province: "Western" },
  { match: /jaffna/i, province: "Northern" },
  { match: /anuradhapura/i, province: "North Central" },
  { match: /nuwara eliya/i, province: "Central" },
];

function pctDelta(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function parseProvince(address) {
  const hit = PROVINCE_FROM_ADDRESS.find((r) => r.match.test(address || ""));
  return hit?.province || "Western";
}

function parseCity(address) {
  if (!address) return "Colombo";
  const parts = String(address).split(",");
  return parts[0]?.trim() || "Colombo";
}

function orderInRange(o, startMs, endMs) {
  const t = new Date(o.createdAt || o.created_at).getTime();
  return t >= startMs && t < endMs;
}

function normalizeRecentOrder(o) {
  const status = String(o.orderStatus || o.status || "PLACED").toLowerCase();
  return {
    id: o.id,
    order_number: o.orderNumber || o.order_number || `ORD-${o.id}`,
    customer_name: o.customerName || o.customer_name,
    customer_email: o.customerEmail || o.customer_email,
    total_amount: Number(o.totalAmount ?? o.total_amount ?? 0),
    status: status === "delivered" ? "completed" : status,
    payment_status: String(o.paymentStatus || o.payment_status || "PENDING").toLowerCase(),
    created_at: o.createdAt || o.created_at,
  };
}

function normalizeRecentReview(r) {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    is_approved: r.is_approved ?? (r.status === "approved"),
    created_at: r.createdAt || r.created_at,
    product_id: r.productId || r.product_id,
  };
}

/** Full analytics payload matching GET /admin/analytics */
export function buildDashboardAnalytics(range = "30d") {
  const rangeDays = RANGE_DAYS[range] || 30;
  const now = Date.now();
  const periodStart = now - rangeDays * 86_400_000;
  const prevStart = now - 2 * rangeDays * 86_400_000;

  const currOrders = orders.filter((o) => orderInRange(o, periodStart, now));
  const prevOrders = orders.filter((o) => orderInRange(o, prevStart, periodStart));

  const sumRevenue = (arr) => arr.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const revenue = sumRevenue(currOrders);
  const revenuePrev = sumRevenue(prevOrders);
  const ordersN = currOrders.length;
  const ordersPrev = prevOrders.length;
  const aov = ordersN ? revenue / ordersN : 0;
  const aovPrev = ordersPrev ? revenuePrev / ordersPrev : 0;

  const dayBuckets = new Map();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    dayBuckets.set(d, { date: d, revenue: 0, orders: 0 });
  }
  for (const o of currOrders) {
    const d = String(o.createdAt).slice(0, 10);
    const b = dayBuckets.get(d);
    if (!b) continue;
    b.revenue += Number(o.totalAmount || 0);
    b.orders += 1;
  }
  const salesByDay = Array.from(dayBuckets.values());

  const statusMap = new Map();
  const paymentMap = new Map();
  for (const o of currOrders) {
    const st = String(o.orderStatus || "PLACED").toLowerCase();
    const apiStatus = st === "delivered" ? "completed" : st === "placed" ? "pending" : st;
    statusMap.set(apiStatus, (statusMap.get(apiStatus) || 0) + 1);
    const pm = (o.paymentMethod || "unknown").toLowerCase();
    const slot = paymentMap.get(pm) || { method: pm, count: 0, amount: 0 };
    slot.count += 1;
    slot.amount += Number(o.totalAmount || 0);
    paymentMap.set(pm, slot);
  }

  const productAgg = new Map();
  const categoryAgg = new Map();
  for (const o of currOrders) {
    for (const it of o.items || []) {
      const pid = it.productId;
      const prod = products.find((p) => p.id === pid);
      const slot =
        productAgg.get(pid) ||
        {
          id: pid,
          title: it.name || prod?.name,
          image: it.image || prod?.images?.[0],
          qty: 0,
          revenue: 0,
        };
      slot.qty += Number(it.qty || 1);
      slot.revenue += Number(it.price || 0) * Number(it.qty || 1);
      productAgg.set(pid, slot);

      const catName = prod?.categoryName || "Uncategorized";
      const cslot = categoryAgg.get(catName) || { name: catName, revenue: 0, orders: 0 };
      cslot.revenue += Number(it.price || 0) * Number(it.qty || 1);
      cslot.orders += 1;
      categoryAgg.set(catName, cslot);
    }
  }

  const catTotal = Array.from(categoryAgg.values()).reduce((s, c) => s + c.revenue, 0) || 1;
  const topCategories = Array.from(categoryAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((c) => ({ ...c, share: c.revenue / catTotal }));

  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const monthBuckets = [];
  const baseYear = new Date(now).getUTCFullYear();
  const baseMonth = new Date(now).getUTCMonth();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(baseYear, baseMonth - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthBuckets.push({
      key,
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      year: d.getUTCFullYear(),
      revenue: 0,
      orders: 0,
    });
  }
  const monthIndex = new Map(monthBuckets.map((b, idx) => [b.key, idx]));
  for (const o of orders) {
    const dt = new Date(o.createdAt);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    const idx = monthIndex.get(key);
    if (idx === undefined) continue;
    monthBuckets[idx].revenue += Number(o.totalAmount || 0);
    monthBuckets[idx].orders += 1;
  }

  // Spread catalog sales history across months so the 12-month chart is readable in demo mode
  if (monthBuckets.every((m) => m.orders === 0)) {
    const catalogRevenue = products.reduce((s, p) => s + (p.revenue || p.price * (p.salesCount || 0)), 0);
    const perMonth = catalogRevenue / 12;
    monthBuckets.forEach((m, i) => {
      const wave = 0.65 + 0.35 * Math.sin((i / 12) * Math.PI * 2);
      m.revenue = Math.round(perMonth * wave);
      m.orders = Math.max(1, Math.round((m.revenue / 18000) * wave));
    });
  }

  const provinceAgg = new Map();
  const cityAgg = new Map();
  for (const o of currOrders) {
    const addr = o.shippingAddress || "";
    const province = parseProvince(addr);
    const city = parseCity(addr);
    const amount = Number(o.totalAmount || 0);
    const pSlot = provinceAgg.get(province) || { name: province, orders: 0, revenue: 0 };
    pSlot.orders += 1;
    pSlot.revenue += amount;
    provinceAgg.set(province, pSlot);
    const cSlot = cityAgg.get(city) || { name: city, province, orders: 0, revenue: 0 };
    cSlot.orders += 1;
    cSlot.revenue += amount;
    cityAgg.set(city, cSlot);
  }

  const totalLocOrders = currOrders.length || 1;
  const sortAndShare = (arr) =>
    arr
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 8)
      .map((r) => ({ ...r, share: r.orders / totalLocOrders }));

  const pendingOrders = orders.filter(
    (o) => ["PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED"].includes(o.orderStatus)
  ).length;
  const completedOrders = orders.filter((o) => o.orderStatus === "DELIVERED").length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === "CANCELLED").length;

  const newCustomersCurrent = customers.filter((c) => {
    const t = new Date(c.joinedAt).getTime();
    return t >= periodStart;
  }).length;

  return {
    range,
    rangeDays,
    generatedAt: new Date(now).toISOString(),
    _demo: true,
    kpis: {
      revenue: {
        value: revenue,
        prev: revenuePrev,
        delta: pctDelta(revenue, revenuePrev),
        spark: salesByDay.map((d) => d.revenue),
      },
      orders: {
        value: ordersN,
        prev: ordersPrev,
        delta: pctDelta(ordersN, ordersPrev),
        spark: salesByDay.map((d) => d.orders),
      },
      aov: {
        value: aov,
        prev: aovPrev,
        delta: pctDelta(aov, aovPrev),
      },
      newCustomers: {
        value: newCustomersCurrent,
        prev: Math.max(1, newCustomersCurrent - 2),
        delta: pctDelta(newCustomersCurrent, Math.max(1, newCustomersCurrent - 2)),
      },
    },
    totals: {
      ordersAllTime: orders.length,
      productsActive: products.filter((p) => p.isActive).length,
      usersTotal: customers.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      pendingReviews: reviews.filter((r) => r.status === "pending").length,
      lowStock: products.filter((p) => p.isActive && p.stock > 0 && p.stock <= 10).length,
    },
    salesByDay,
    salesByMonth: monthBuckets,
    statusBreakdown: Array.from(statusMap, ([status, count]) => ({ status, count })),
    paymentMix: Array.from(paymentMap.values()).sort((a, b) => b.amount - a.amount),
    topCategories,
    topProducts,
    customerLocations: {
      provinces: sortAndShare(Array.from(provinceAgg.values())),
      cities: sortAndShare(Array.from(cityAgg.values())),
      countries: [{ name: "Sri Lanka", orders: currOrders.length, revenue: revenue, share: 1 }],
      sampledOrders: currOrders.length,
    },
    recentOrders: [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8)
      .map(normalizeRecentOrder),
    recentReviews: [...reviews]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(normalizeRecentReview),
  };
}

export function buildDashboardStockReport() {
  const mapProduct = (p) => ({
    id: p.id,
    title: p.name,
    stock_qty: p.stock,
    is_active: p.isActive,
  });
  const mapped = products.map(mapProduct);
  return {
    lowStock: mapped.filter((p) => p.is_active && Number(p.stock_qty) > 0 && Number(p.stock_qty) <= 10),
    outOfStock: mapped.filter((p) => !p.is_active || Number(p.stock_qty) <= 0),
    all: mapped,
  };
}

function hasKpis(kpis) {
  return kpis && Number(kpis.revenue?.value) > 0;
}

function arr(x) {
  return Array.isArray(x) ? x : [];
}

/** Ensure one row per calendar day for the selected range (fills gaps with zeros). */
export function fillSalesByDay(days, rangeDays = 30) {
  const len =
    typeof rangeDays === "string"
      ? (RANGE_DAYS[rangeDays] ?? 30)
      : (Number(rangeDays) || 30);
  const map = new Map();
  for (const d of days || []) {
    const key = String(d.date || "").slice(0, 10);
    if (!key) continue;
    map.set(key, {
      date: key,
      revenue: Number(d.revenue) || 0,
      orders: Number(d.orders) || 0,
    });
  }
  const now = Date.now();
  const out = [];
  for (let i = len - 1; i >= 0; i--) {
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    out.push(map.get(date) || { date, revenue: 0, orders: 0 });
  }
  return out;
}

function mergeSalesByMonth(apiMonths, demoMonths) {
  const api = arr(apiMonths);
  const demo = arr(demoMonths);
  if (!api.length) return demo;
  if (!demo.length) return api;
  const demoByKey = new Map(demo.map((m) => [m.key, m]));
  return api.map((m) => {
    const fill = demoByKey.get(m.key) || demo[api.indexOf(m)] || {};
    const hasApi = Number(m.revenue) > 0 || Number(m.orders) > 0;
    if (hasApi) return m;
    return {
      ...m,
      revenue: Number(fill.revenue) || 0,
      orders: Number(fill.orders) || 0,
    };
  });
}

/** Prefer live API values; fill gaps from demo. */
export function mergeDashboardAnalytics(api, demo) {
  if (!api) return demo;
  if (!demo) return api;

  return {
    ...demo,
    ...api,
    range: api.range ?? demo.range,
    rangeDays: api.rangeDays ?? demo.rangeDays,
    generatedAt: api.generatedAt ?? demo.generatedAt,
    kpis: hasKpis(api.kpis) ? api.kpis : demo.kpis,
    totals: { ...demo.totals, ...api.totals },
    salesByDay: fillSalesByDay(
      arr(api.salesByDay).some((d) => d.orders > 0 || d.revenue > 0)
        ? api.salesByDay
        : demo.salesByDay,
      api.rangeDays ?? demo.rangeDays ?? 30
    ),
    salesByMonth: mergeSalesByMonth(api.salesByMonth, demo.salesByMonth),
    statusBreakdown: arr(api.statusBreakdown).length ? api.statusBreakdown : demo.statusBreakdown,
    paymentMix: arr(api.paymentMix).length ? api.paymentMix : demo.paymentMix,
    topCategories: arr(api.topCategories).length ? api.topCategories : demo.topCategories,
    topProducts: arr(api.topProducts).length ? api.topProducts : demo.topProducts,
    customerLocations: {
      provinces: arr(api.customerLocations?.provinces).length
        ? api.customerLocations.provinces
        : demo.customerLocations.provinces,
      cities: arr(api.customerLocations?.cities).length
        ? api.customerLocations.cities
        : demo.customerLocations.cities,
      countries: arr(api.customerLocations?.countries).length
        ? api.customerLocations.countries
        : demo.customerLocations.countries,
      sampledOrders: api.customerLocations?.sampledOrders || demo.customerLocations.sampledOrders,
    },
    recentOrders: arr(api.recentOrders).length ? api.recentOrders : demo.recentOrders,
    recentReviews: arr(api.recentReviews).length ? api.recentReviews : demo.recentReviews,
  };
}

export function mergeDashboardStockReport(api, demo) {
  if (!api) return demo;
  if (!demo) return api;
  const low = arr(api.lowStock);
  const out = arr(api.outOfStock);
  return {
    lowStock: low.length ? api.lowStock : demo.lowStock,
    outOfStock: out.length ? api.outOfStock : demo.outOfStock,
    all: arr(api.all).length ? api.all : demo.all,
  };
}
