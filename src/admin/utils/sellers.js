import { customers as mockCustomers, orders as mockOrders, reviews as mockReviews } from "../data/mockData";

export function normalizeMockSellers(list = mockCustomers) {
  return list.map((c) => ({
    ...c,
    role: c.role || "customer",
    photoUrl: c.photoUrl || null,
  }));
}

export function filterMockSellers(items, { q, filter } = {}) {
  let out = items;
  const query = q ? String(q).trim().toLowerCase() : "";
  if (query) {
    out = out.filter((s) => {
      const hay = `${s.name} ${s.storeName || ""} ${s.email || ""} ${s.phone || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }
  if (filter === "active") out = out.filter((s) => s.status === "active");
  else if (filter === "inactive") out = out.filter((s) => s.status === "inactive");
  else if (filter === "repeat") out = out.filter((s) => s.isRepeat);
  return out;
}

export function loadMockSellers(params = {}) {
  const filtered = filterMockSellers(normalizeMockSellers(), {
    q: params.q,
    filter: params.filter,
  });
  return { items: filtered, total: filtered.length };
}

export function getMockSellerDetail(sellerId) {
  const seller = mockCustomers.find((c) => c.id === sellerId);
  if (!seller) {
    return { seller: null, orders: [], reviews: [] };
  }

  const orders = mockOrders
    .filter((o) => o.customerId === sellerId)
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
    }));

  const reviews = mockReviews
    .filter((r) => r.customerId === sellerId)
    .map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.productName,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.status === "approved",
      createdAt: r.createdAt,
    }));

  return { seller: normalizeMockSellers([seller])[0], orders, reviews };
}
