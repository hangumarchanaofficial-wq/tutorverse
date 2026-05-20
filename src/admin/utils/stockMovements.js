import { stockLogs as mockStockLogs } from "../data/mockData";

const LABEL_TO_MOVEMENT = {
  ADDED: "in",
  RETURNED: "in",
  SOLD: "out",
  ADJUSTED: "adjustment",
  DAMAGED: "adjustment",
};

export function labelToMovementType(label) {
  const key = String(label || "").toUpperCase();
  return LABEL_TO_MOVEMENT[key] || "adjustment";
}

export function normalizeMockStockMovements(logs = mockStockLogs) {
  return logs.map((row) => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    type: row.type,
    movementType: labelToMovementType(row.type),
    quantity: row.quantity,
    reason: row.reason || null,
    createdAt: row.createdAt,
  }));
}

export function filterMockMovements(items, { type, q } = {}) {
  let out = items;
  if (type && type !== "all") {
    out = out.filter((row) => row.movementType === type);
  }
  const query = q ? String(q).trim().toLowerCase() : "";
  if (query) {
    out = out.filter((row) => String(row.reason || "").toLowerCase().includes(query));
  }
  return out;
}

export function getMockStockMovementTabCounts(items) {
  const map = {};
  items.forEach((row) => {
    map[row.movementType] = (map[row.movementType] || 0) + 1;
  });
  return { all: items.length, ...map };
}

export function loadMockStockMovements(params = {}) {
  const normalized = normalizeMockStockMovements();
  const filtered = filterMockMovements(normalized, {
    type: params.type,
    q: params.q,
  });
  return { items: filtered, total: filtered.length };
}
