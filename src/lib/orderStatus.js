/** Admin pipeline steps shown in the UI. */
export const ORDER_PIPELINE = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
];

/** Values stored in `orders.status` (API / database). */
export const API_ORDER_STATUSES = [
  "pending",
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];

const PIPELINE_TO_API = {
  PLACED: "placed",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "completed",
  CANCELLED: "cancelled",
};

const API_TO_PIPELINE = {
  pending: "PLACED",
  placed: "PLACED",
  confirmed: "CONFIRMED",
  processing: "PROCESSING",
  packed: "PACKED",
  shipped: "SHIPPED",
  completed: "DELIVERED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
};

/** Map API / legacy values to a pipeline step for display. */
export function normalizeOrderPipelineStatus(status) {
  const raw = String(status || "").trim();
  if (!raw) return "PLACED";

  const lower = raw.toLowerCase();
  if (API_TO_PIPELINE[lower]) return API_TO_PIPELINE[lower];

  const upper = raw.toUpperCase();
  if (upper === "COMPLETED") return "DELIVERED";
  if (upper === "CANCELED") return "CANCELLED";
  if (ORDER_PIPELINE.includes(upper)) return upper;
  if (upper === "CANCELLED" || upper === "RETURNED") return upper;

  return "PLACED";
}

/** Map pipeline step to API `orders.status` values. */
export function toApiOrderStatus(pipelineStatus) {
  const upper = String(pipelineStatus || "").toUpperCase().trim();
  return PIPELINE_TO_API[upper] || "pending";
}
