import { payments as mockPayments } from "../data/mockData";

const STATUS_MAP = {
  PAID: "succeeded",
  PENDING: "pending",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELED: "canceled",
  INITIATED: "initiated",
};

export function normalizeMockPayment(row) {
  const rawStatus = String(row.status || "").toUpperCase();
  const status =
    STATUS_MAP[rawStatus] || String(row.status || "pending").toLowerCase();

  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber || null,
    customerName: row.customerName || null,
    customerEmail: row.customerEmail || null,
    method: String(row.method || "OTHER").toUpperCase(),
    provider: String(row.method || "").toLowerCase(),
    gateway: row.gateway || row.method || null,
    status,
    amount: Number(row.amount || 0),
    currency: row.currency || "LKR",
    transactionRef: row.transactionRef || null,
    createdAt: row.createdAt,
  };
}

export function normalizeMockPayments(list = mockPayments) {
  return list.map(normalizeMockPayment);
}

export function filterMockPayments(items, { status, method, q } = {}) {
  let out = items;

  if (status && status !== "all") {
    out = out.filter((p) => p.status === status);
  }

  if (method && method !== "all") {
    const m = String(method).toUpperCase();
    out = out.filter((p) => p.method === m);
  }

  const query = q ? String(q).trim().toLowerCase() : "";
  if (query) {
    out = out.filter((p) => {
      const hay = [
        p.id,
        p.orderNumber,
        p.customerName,
        p.transactionRef,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }

  return out;
}

export function loadMockPayments(params = {}) {
  const filtered = filterMockPayments(normalizeMockPayments(), {
    status: params.status,
    method: params.method,
    q: params.q,
  });
  return { items: filtered, total: filtered.length };
}
