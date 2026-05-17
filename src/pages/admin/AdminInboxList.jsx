import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Inbox,
  Layers,
  Paperclip,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { PageHeader, Btn, useToast } from "../../admin/components/ui";
import { inboxMessages as seedMessages, inboxLabels } from "../../admin/data/mockData";
import { readInboxState, writeInboxState } from "../../admin/inbox/inboxSession";

const PAGE_SIZE = 8;

function labelLookup(id) {
  return inboxLabels.find((l) => l.id === id);
}

function fmtShortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initMessages() {
  const s = readInboxState();
  if (s?.messages?.length) return s.messages;
  return seedMessages.map((m) => ({ ...m }));
}

function initSet(key) {
  const s = readInboxState();
  return new Set(s?.[key] || []);
}

export default function AdminInboxList() {
  const navigate = useNavigate();
  const toast = useToast();
  const [messages, setMessages] = useState(initMessages);
  const [snoozedIds, setSnoozedIds] = useState(() => initSet("snoozedIds"));
  const [archivedIds, setArchivedIds] = useState(() => initSet("archivedIds"));
  const [folder, setFolder] = useState("inbox");
  const [labelFilter, setLabelFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const selectAllRef = useRef(null);

  useEffect(() => {
    writeInboxState({
      messages,
      snoozedIds: [...snoozedIds],
      archivedIds: [...archivedIds],
    });
  }, [messages, snoozedIds, archivedIds]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.unread && !archivedIds.has(m.id)).length,
    [messages, archivedIds]
  );

  const filtered = useMemo(() => {
    let list = messages.filter((m) => !archivedIds.has(m.id));
    if (folder === "inbox") list = list.filter((m) => !snoozedIds.has(m.id));
    else if (folder === "snoozed") list = list.filter((m) => snoozedIds.has(m.id));
    else if (folder === "starred") list = list.filter((m) => m.starred);
    if (labelFilter) list = list.filter((m) => m.labelIds.includes(labelFilter));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.from.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, archivedIds, snoozedIds, folder, labelFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const visibleIds = useMemo(() => pageSlice.map((m) => m.id), [pageSlice]);
  const allOnPageSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = visibleIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someOnPageSelected && !allOnPageSelected;
  }, [someOnPageSelected, allOnPageSelected]);

  const toggleSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allOnPageSelected, visibleIds]);

  const toggleSelectOne = useCallback((id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleStar = useCallback((id, e) => {
    e.stopPropagation();
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)));
  }, []);

  const toggleSnooze = useCallback(
    (id, e) => {
      e.stopPropagation();
      let wasSnoozed = false;
      setSnoozedIds((prev) => {
        const next = new Set(prev);
        wasSnoozed = next.has(id);
        if (wasSnoozed) next.delete(id);
        else next.add(id);
        return next;
      });
      toast?.(wasSnoozed ? "Returned to Inbox" : "Conversation snoozed");
    },
    [toast]
  );

  const openRow = useCallback(
    (m) => {
      navigate(`/admin/inbox/conversation/${m.id}`, { state: { message: m } });
    },
    [navigate]
  );

  const archiveSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      toast?.("Select messages first", "warning");
      return;
    }
    const n = selectedIds.size;
    setArchivedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
    toast?.(`${n} archived`);
  }, [selectedIds, toast]);

  const sendCompose = useCallback(
    (e) => {
      e.preventDefault();
      if (!compose.to.trim() || !compose.subject.trim()) {
        toast?.("Add at least To and Subject", "warning");
        return;
      }
      const id = `M${Date.now()}`;
      const initials = compose.to
        .split(/[\s@]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("") || "ME";
      const row = {
        id,
        from: compose.to.includes("@") ? compose.to.split("@")[0] : compose.to,
        initials,
        subject: compose.subject,
        snippet: compose.body.slice(0, 120) || "(No body)",
        starred: false,
        unread: true,
        labelIds: ["L1"],
        date: new Date().toISOString(),
        hasAttachment: false,
      };
      setMessages((prev) => [row, ...prev]);
      setCompose({ to: "", subject: "", body: "" });
      setComposeOpen(false);
      setPage(1);
      toast?.("Message sent");
    },
    [compose, toast]
  );

  const snoozedCount = snoozedIds.size;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inbox"
        subtitle="Seller messages and buyer conversations"
        badge={
          unreadCount > 0 ? (
            <span className="rounded-full bg-[#60a5fa]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#7dd3fc]">
              {unreadCount} unread
            </span>
          ) : null
        }
      />

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="compose-title">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#263145] bg-[#121b2e] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3">
              <h2 id="compose-title" className="text-sm font-bold text-[#f8fafc]">
                New message
              </h2>
              <button type="button" className="rounded-lg p-1.5 text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]" onClick={() => setComposeOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={sendCompose} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">To</label>
                <input
                  value={compose.to}
                  onChange={(e) => setCompose((p) => ({ ...p, to: e.target.value }))}
                  className="w-full rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#d8b84f]/50"
                  placeholder="name@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Subject</label>
                <input
                  value={compose.subject}
                  onChange={(e) => setCompose((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#d8b84f]/50"
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Message</label>
                <textarea
                  value={compose.body}
                  onChange={(e) => setCompose((p) => ({ ...p, body: e.target.value }))}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-2 text-sm text-[#f8fafc] outline-none focus:border-[#d8b84f]/50"
                  placeholder="Write your message…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Btn type="button" variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Btn>
                <Btn type="submit" variant="primary" size="sm">
                  Send
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_24px_48px_rgba(0,0,0,0.25)] lg:flex-row">
        <aside className="w-full shrink-0 border-b border-[#263145] bg-[#0f1726] p-4 lg:w-56 lg:border-b-0 lg:border-r">
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d8b84f] py-3 text-sm font-semibold text-[#070b14] shadow-[0_4px_20px_rgba(216,184,79,0.25)] transition hover:bg-[#e5c866]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Compose
          </button>

          <nav className="mt-5 space-y-0.5 text-[13px]">
            <button
              type="button"
              onClick={() => { setFolder("inbox"); setPage(1); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left font-medium transition ${
                folder === "inbox" ? "bg-[#d8b84f]/10 text-[#d8b84f]" : "text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
              }`}
            >
              <Inbox className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">Inbox</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#60a5fa] px-1.5 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setFolder("snoozed"); setPage(1); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                folder === "snoozed" ? "bg-[#182238] text-[#f8fafc]" : "text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
              }`}
            >
              <Clock className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
              <span className="flex-1">Snoozed</span>
              {snoozedCount > 0 && (
                <span className="rounded-full bg-[#334155] px-1.5 py-0.5 text-[10px] font-bold text-[#e5e7eb]">{snoozedCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setFolder("starred"); setPage(1); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
                folder === "starred" ? "bg-[#182238] text-[#f8fafc]" : "text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
              }`}
            >
              <Star className={`h-4 w-4 shrink-0 ${folder === "starred" ? "fill-[#d8b84f] text-[#d8b84f]" : "opacity-80"}`} strokeWidth={1.75} />
              Starred
            </button>
          </nav>

          <div className="mt-6 border-t border-[#263145] pt-4">
            <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Labels</p>
            <ul className="space-y-1">
              {inboxLabels.map((lb) => {
                const active = labelFilter === lb.id;
                return (
                  <li key={lb.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setLabelFilter((cur) => (cur === lb.id ? null : lb.id));
                        setPage(1);
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12px] transition ${
                        active ? "bg-[#182238] text-[#f8fafc]" : "text-[#c3cad9] hover:bg-[#182238]"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-[#0f1726]" style={{ background: lb.color, boxShadow: `0 0 0 1px ${lb.color}55` }} />
                      {lb.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[#121b2e]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263145] px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#8b95a7]">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="rounded border-[#334155] bg-[#182238] text-[#d8b84f]"
                checked={allOnPageSelected}
                onChange={toggleSelectAllPage}
              />
              Select all
            </label>
            <div className="flex items-center gap-1 text-[11px] text-[#8b95a7]">
              <span className="tabular-nums">
                {filtered.length === 0 ? "0" : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)}`} of {filtered.length}
              </span>
              <button
                type="button"
                disabled={safePage <= 1}
                className="rounded p-1 text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc] disabled:opacity-30"
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                className="rounded p-1 text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc] disabled:opacity-30"
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative border-b border-[#263145] px-4 py-2">
            <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" strokeWidth={1.75} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search messages…"
              className="w-full rounded-lg border border-[#263145] bg-[#0f1726] py-2 pl-10 pr-3 text-sm text-[#f8fafc] placeholder-[#6b7280] outline-none focus:border-[#d8b84f]/50"
            />
          </div>

          <div className="flex-1 divide-y divide-[#263145]/60 overflow-y-auto">
            {pageSlice.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-[#8b95a7]">
                {folder === "snoozed" && snoozedCount === 0
                  ? "No snoozed conversations. Use the clock on a row to snooze."
                  : "No messages match this view."}
              </div>
            ) : (
              pageSlice.map((m) => (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openRow(m)}
                  onKeyDown={(e) => e.key === "Enter" && openRow(m)}
                  className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-[#182238]/80 ${
                    m.unread ? "bg-[#0f1726]/40" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1.5 rounded border-[#334155] bg-[#182238]"
                    checked={selectedIds.has(m.id)}
                    onChange={(e) => toggleSelectOne(m.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    className="mt-0.5 text-[#8b95a7] hover:text-[#d8b84f]"
                    aria-label={m.starred ? "Unstar" : "Star"}
                    onClick={(e) => toggleStar(m.id, e)}
                  >
                    <Star className={`h-4 w-4 ${m.starred ? "fill-[#d8b84f] text-[#d8b84f]" : ""}`} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className={`mt-0.5 rounded p-0.5 hover:bg-[#263145] ${
                      snoozedIds.has(m.id) ? "text-[#d8b84f]" : "text-[#6b7280] hover:text-[#d8b84f]"
                    }`}
                    title={snoozedIds.has(m.id) ? "Unsnooze" : "Snooze"}
                    aria-label={snoozedIds.has(m.id) ? "Unsnooze" : "Snooze"}
                    onClick={(e) => toggleSnooze(m.id, e)}
                  >
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2a3548] to-[#1a2332] text-[11px] font-bold text-[#e5e7eb] ring-1 ring-[#3d4a5f]">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className={`text-sm ${m.unread ? "font-semibold text-[#f8fafc]" : "font-medium text-[#e5e7eb]"}`}>{m.from}</span>
                      {m.labelIds.map((lid) => {
                        const lb = labelLookup(lid);
                        if (!lb) return null;
                        return (
                          <span
                            key={lid}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ background: `${lb.color}22`, color: lb.color }}
                          >
                            {lb.name}
                          </span>
                        );
                      })}
                    </div>
                    <p className={`mt-0.5 text-sm ${m.unread ? "font-medium text-[#f8fafc]" : "text-[#c3cad9]"}`}>{m.subject}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[#8b95a7]">{m.snippet}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] tabular-nums text-[#8b95a7]">{fmtShortDate(m.date)}</span>
                    {m.hasAttachment && <Paperclip className="h-3.5 w-3.5 text-[#6b7280]" strokeWidth={2} />}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#263145] px-4 py-3">
            <p className="text-[11px] text-[#6b7280]">
              <Layers className="mr-1 inline h-3.5 w-3.5 align-text-bottom opacity-70" strokeWidth={1.75} />
              Selections and snoozes persist for this browser session.
            </p>
            <Btn variant="ghost" size="xs" onClick={archiveSelected} disabled={selectedIds.size === 0}>
              Archive selected
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
