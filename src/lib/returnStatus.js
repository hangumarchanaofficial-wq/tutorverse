/** Happy-path return pipeline steps (admin UI). */
export const RETURN_PIPELINE = [
  "REQUESTED",
  "APPROVED",
  "RETURN_RECEIVED",
  "INSPECTED",
  "REFUNDED",
];

export const RETURN_TERMINAL_REJECTED = "REJECTED";

export const RETURN_FILTER_STATUSES = [
  "ALL",
  ...RETURN_PIPELINE,
  RETURN_TERMINAL_REJECTED,
];

const ALLOWED_TRANSITIONS = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RETURN_RECEIVED", "REJECTED"],
  RETURN_RECEIVED: ["INSPECTED", "REJECTED"],
  INSPECTED: ["REFUNDED", "REJECTED"],
  REFUNDED: [],
  REJECTED: [],
};

/** Normalize API / legacy values to pipeline status. */
export function normalizeReturnStatus(status) {
  const upper = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!upper) return "REQUESTED";
  if (upper === "RETURN_APPROVED") return "APPROVED";
  if (RETURN_PIPELINE.includes(upper) || upper === RETURN_TERMINAL_REJECTED) return upper;
  return "REQUESTED";
}

export function canTransition(fromStatus, toStatus) {
  const from = normalizeReturnStatus(fromStatus);
  const to = normalizeReturnStatus(toStatus);
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

export function nextReturnStatus(currentStatus) {
  const current = normalizeReturnStatus(currentStatus);
  const idx = RETURN_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= RETURN_PIPELINE.length - 1) return null;
  return RETURN_PIPELINE[idx + 1];
}

/** Statuses that need staff action soon. */
export function isReturnActionNeeded(status) {
  const s = normalizeReturnStatus(status);
  return s === "REQUESTED" || s === "APPROVED";
}

/** In progress (not terminal, not just requested). */
export function isReturnInProgress(status) {
  const s = normalizeReturnStatus(status);
  return ["RETURN_RECEIVED", "INSPECTED"].includes(s);
}

export function isReturnTerminal(status) {
  const s = normalizeReturnStatus(status);
  return s === "REFUNDED" || s === "REJECTED";
}
