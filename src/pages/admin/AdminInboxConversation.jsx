import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  MoreHorizontal,
  Paperclip,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader, Btn, useToast } from "../../admin/components/ui";
import { InboxAvatar } from "../../admin/utils/avatars";
import { inboxDemoThread, inboxLabels, inboxMessages as seedMessages } from "../../admin/data/mockData";
import { readInboxState, writeInboxState, findMessageById } from "../../admin/inbox/inboxSession";

const PAGE_SUBTITLE = "System · Inbox · Conversation";

function labelLookup(id) {
  return inboxLabels.find((l) => l.id === id);
}

function ensureSessionBase() {
  const s = readInboxState();
  if (s?.messages?.length) {
    return {
      messages: s.messages,
      snoozedIds: s.snoozedIds || [],
      archivedIds: s.archivedIds || [],
    };
  }
  return {
    messages: seedMessages.map((m) => ({ ...m })),
    snoozedIds: [],
    archivedIds: [],
  };
}

function threadMessageAvatarPayload(msg) {
  if (msg.role === "System") return null;
  const parts = (msg.from || "").trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0] || "?").slice(0, 2).toUpperCase();
  return { id: msg.id, from: msg.from, initials };
}

function ConversationHeaderActions({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function InboxBackLink() {
  return (
    <Link
      to="/admin/inbox"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#263145] px-3 py-1.5 text-xs font-semibold text-[#c3cad9] hover:bg-[#182238] hover:text-[#f8fafc]"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
      Inbox
    </Link>
  );
}

function MessageBodyPanel({ body, hasAttachment }) {
  return (
    <div className="admin-inbox-conversation__message-panel rounded-xl border border-[#263145] bg-[#121b2e] p-5">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c3cad9]">{body}</p>
      {hasAttachment && (
        <p className="mt-4 flex items-center gap-2 border-t border-[#263145] pt-4 text-xs text-[#8b95a7]">
          <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
          This thread has an attachment (demo — no file).
        </p>
      )}
    </div>
  );
}

function ReplyStrip({ onReply }) {
  return (
    <div className="admin-inbox-conversation__reply mt-4 rounded-xl border border-[#263145] bg-[#0f1726]/40 p-4">
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
        Reply
      </label>
      <textarea
        rows={3}
        readOnly
        placeholder="Write your reply…"
        className="w-full resize-y rounded-lg border border-[#263145] bg-[#0f1726] px-3 py-2.5 text-sm text-[#c3cad9] placeholder-[#6b7280] outline-none focus:border-[#d8b84f]/50"
      />
      <div className="mt-3 flex justify-end">
        <Btn variant="primary" size="sm" onClick={onReply}>
          <Reply className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2} />
          Send reply
        </Btn>
      </div>
    </div>
  );
}

function ThreadAvatar({ msg }) {
  const payload = threadMessageAvatarPayload(msg);
  if (!payload) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#263145] text-[10px] font-bold uppercase text-[#8b95a7] ring-1 ring-[#3d4a5f]">
        {msg.from.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <InboxAvatar message={payload} />;
}

export default function AdminInboxConversation() {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [, setSessionRev] = useState(0);

  useEffect(() => {
    if (!messageId) return;
    const pm = location.state?.message;
    const base = ensureSessionBase();
    const found =
      findMessageById(base.messages, messageId) || (pm?.id === messageId ? pm : null);
    if (!found) return;
    if (found.unread) {
      const messages = base.messages.map((m) => (m.id === messageId ? { ...m, unread: false } : m));
      writeInboxState({
        messages,
        snoozedIds: base.snoozedIds,
        archivedIds: base.archivedIds,
      });
    }
    setSessionRev((n) => n + 1);
  }, [messageId, location.state]);

  const pm = location.state?.message;
  const baseForRow = ensureSessionBase();
  const listMessage =
    !messageId ? null : findMessageById(baseForRow.messages, messageId) || (pm?.id === messageId ? pm : null);

  const [open, setOpen] = useState(() =>
    Object.fromEntries(inboxDemoThread.messages.map((m) => [m.id, !m.collapsed]))
  );

  const toggle = (id) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  const thread = inboxDemoThread;

  const archiveCurrent = useCallback(() => {
    if (!messageId || !listMessage) return;
    const base = ensureSessionBase();
    const archivedIds = [...new Set([...(base.archivedIds || []), messageId])];
    writeInboxState({ ...base, archivedIds });
    toast?.("Archived");
    navigate("/admin/inbox");
  }, [messageId, listMessage, navigate, toast]);

  const trashCurrent = useCallback(() => {
    if (!messageId || !listMessage) return;
    const base = ensureSessionBase();
    const messages = base.messages.filter((m) => m.id !== messageId);
    writeInboxState({
      messages,
      snoozedIds: base.snoozedIds,
      archivedIds: base.archivedIds,
    });
    toast?.("Message removed");
    navigate("/admin/inbox");
  }, [messageId, listMessage, navigate, toast]);

  const toggleStarCurrent = useCallback(() => {
    if (!messageId || !listMessage) return;
    const base = ensureSessionBase();
    const messages = base.messages.map((m) =>
      m.id === messageId ? { ...m, starred: !m.starred } : m
    );
    writeInboxState({ ...base, messages });
    setSessionRev((n) => n + 1);
    toast?.("Updated");
  }, [messageId, listMessage, toast]);

  const downloadDemo = useCallback(() => {
    toast?.("Download started (demo)");
  }, [toast]);

  const replyDemo = useCallback(() => {
    toast?.("Reply sent (demo)");
  }, [toast]);

  if (messageId && listMessage) {
    const dateLabel = listMessage.date
      ? new Date(listMessage.date).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    return (
      <div className="admin-products-page admin-inbox-conversation space-y-6">
        <PageHeader
          title="Conversation"
          subtitle={PAGE_SUBTITLE}
          actions={
            <ConversationHeaderActions>
              <InboxBackLink />
              <Btn variant="ghost" size="sm" onClick={toggleStarCurrent} title="Star">
                <Star
                  className={`h-3.5 w-3.5 ${listMessage.starred ? "fill-[#d8b84f] text-[#d8b84f]" : ""}`}
                  strokeWidth={2}
                />
              </Btn>
              <Btn variant="secondary" size="sm" onClick={archiveCurrent}>
                <Archive className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2} />
                Archive
              </Btn>
              <Btn variant="ghost" size="sm" onClick={trashCurrent} title="Delete">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </Btn>
            </ConversationHeaderActions>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263145] px-5 py-3">
            <span className="text-[11px] tabular-nums text-[#8b95a7]">1 message</span>
            <button
              type="button"
              className="rounded-lg p-2 text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
              aria-label="More"
              onClick={() => toast?.("More actions (demo)")}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="border-b border-[#263145] px-5 py-4">
            <h2 className="text-lg font-semibold leading-snug text-[#f8fafc]">{listMessage.subject}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {listMessage.labelIds?.map((lid) => {
                const lb = labelLookup(lid);
                if (!lb) return null;
                return (
                  <span
                    key={lid}
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: `${lb.color}22`, color: lb.color }}
                  >
                    {lb.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="admin-inbox-conversation__sender flex items-center gap-3 border-b border-[#263145] bg-[#0f1726]/30 px-5 py-4">
            <InboxAvatar message={listMessage} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#f8fafc]">{listMessage.from}</p>
              <p className="text-[11px] text-[#6b7280]">{dateLabel}</p>
            </div>
          </div>

          <div className="px-5 py-5">
            <MessageBodyPanel body={listMessage.snippet} hasAttachment={listMessage.hasAttachment} />
            <ReplyStrip onReply={replyDemo} />
          </div>
        </div>
      </div>
    );
  }

  if (messageId && !listMessage) {
    return (
      <div className="admin-products-page admin-inbox-conversation space-y-6">
        <PageHeader title="Conversation" subtitle={PAGE_SUBTITLE} />
        <div className="rounded-2xl border border-[#263145] bg-[#121b2e] px-6 py-12 text-center text-sm text-[#8b95a7]">
          <p>This message is no longer in your inbox session.</p>
          <Link to="/admin/inbox" className="mt-4 inline-block text-sm font-semibold text-[#60a5fa] hover:underline">
            Back to Inbox
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products-page admin-inbox-conversation space-y-6">
      <PageHeader
        title="Conversation"
        subtitle={PAGE_SUBTITLE}
        actions={
          <ConversationHeaderActions>
            <InboxBackLink />
            <Btn variant="secondary" size="sm" onClick={() => toast?.("Archived (demo thread)")}>
              <Archive className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2} />
              Archive
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => toast?.("Removed (demo)")}>
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </Btn>
          </ConversationHeaderActions>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263145] px-5 py-3">
          <span className="text-[11px] tabular-nums text-[#8b95a7]">7 of 512</span>
          <button
            type="button"
            className="rounded-lg p-2 text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
            aria-label="More"
            onClick={() => toast?.("More actions (demo)")}
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="border-b border-[#263145] px-5 py-4">
          <h2 className="text-lg font-semibold leading-snug text-[#f8fafc]">{thread.subject}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {thread.tags.map((t) => (
              <span key={t.label} className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${t.className}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#263145]/60">
          {thread.messages.map((msg) => {
            const isOpen = open[msg.id];
            return (
              <div key={msg.id} className="bg-[#0f1726]/30">
                <button
                  type="button"
                  onClick={() => toggle(msg.id)}
                  className="admin-inbox-conversation__sender flex w-full items-center gap-3 border-b border-transparent px-5 py-3 text-left transition hover:bg-[#182238]/50"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#8b95a7]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#8b95a7]" />
                  )}
                  <ThreadAvatar msg={msg} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {msg.from}
                      <span className="ml-2 text-[11px] font-normal text-[#8b95a7]">{msg.role}</span>
                    </p>
                    <p className="text-[11px] text-[#6b7280]">{msg.dateLabel}</p>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-4">
                    <div className="ml-7">
                      <MessageBodyPanel body={msg.body} hasAttachment={false} />
                      {msg.meta && (
                        <dl className="admin-inbox-conversation__message-panel mt-4 space-y-2 rounded-xl border border-[#263145] bg-[#121b2e] p-4 text-xs">
                          <div className="flex justify-between gap-4">
                            <dt className="text-[#8b95a7]">Item</dt>
                            <dd className="text-right font-medium text-[#f8fafc]">{msg.meta.item}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-[#8b95a7]">Sender</dt>
                            <dd className="font-mono text-[#e5e7eb]">{msg.meta.sender}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-[#8b95a7]">Date purchased</dt>
                            <dd className="tabular-nums text-[#e5e7eb]">{msg.meta.purchased}</dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt className="text-[#8b95a7]">Support entitlement</dt>
                            <dd className="tabular-nums text-[#34d399]">{msg.meta.supportEnds}</dd>
                          </div>
                          <div className="pt-1">
                            <a
                              href={msg.meta.verifyUrl}
                              className="text-[#60a5fa] hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Verification link
                            </a>
                          </div>
                          <div className="pt-2">
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#263145]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#d8b84f]"
                                style={{ width: "72%" }}
                                title="Support window progress (demo)"
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-[#6b7280]">Support coverage (illustrative)</p>
                          </div>
                        </dl>
                      )}
                      <ReplyStrip onReply={() => toast?.("Reply (demo)")} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {thread.attachments?.length > 0 && (
          <div className="border-t border-[#263145] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">Attachments</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {thread.attachments.map((a) => (
                <div
                  key={a.name}
                  className="flex min-w-[200px] flex-1 items-center gap-3 rounded-xl border border-[#263145] bg-[#0f1726] px-3 py-2.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#334155] bg-[#182238] text-[#8b95a7]">
                    {a.icon === "pdf" ? (
                      <FileText className="h-5 w-5 text-[#f87171]" strokeWidth={1.65} />
                    ) : (
                      <Paperclip className="h-5 w-5" strokeWidth={1.65} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#f8fafc]">{a.name}</p>
                    <p className="text-[10px] text-[#8b95a7]">{a.size}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={downloadDemo}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#60a5fa] hover:underline"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
              Download all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
