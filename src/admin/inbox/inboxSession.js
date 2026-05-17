/** Client-side inbox persistence so List ↔ Conversation share state without a global store. */
const KEY = "twoway-admin-inbox-v1";

export const INBOX_UPDATED = "twoway-inbox-updated";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readInboxState() {
  if (typeof sessionStorage === "undefined") return null;
  return safeParse(sessionStorage.getItem(KEY));
}

export function writeInboxState(state) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(INBOX_UPDATED, { detail: state }));
}

export function getUnreadCount(messages, archivedIds = []) {
  const arch = new Set(archivedIds);
  return messages.filter((m) => m.unread && !arch.has(m.id)).length;
}

export function findMessageById(messages, id) {
  return messages.find((m) => m.id === id) || null;
}
