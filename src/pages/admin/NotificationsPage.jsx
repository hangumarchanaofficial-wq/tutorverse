import React, { useState, useMemo } from "react";
import {
  Bell,
  CreditCard,
  FileText,
  Package,
  Star,
  TrendingDown,
  Undo2,
} from "lucide-react";
import {
  PageHeader, StatusBadge, Tabs, Btn, useToast, fmtDateTime, timeAgo,
} from "../../admin/components/ui";
import { notifications, smsLogs } from "../../admin/data/mockData";

const TYPE_ICON_COMPONENTS = {
  order: Package,
  low_stock: TrendingDown,
  payment_failed: CreditCard,
  review: Star,
  return: Undo2,
  invoice: FileText,
};

/** Subtle accent per channel — works on dark panels */
const TYPE_ICON_TONE = {
  order: "border-[#38bdf8]/30 text-[#38bdf8] bg-[#38bdf8]/[0.08]",
  low_stock: "border-[#fb7185]/35 text-[#fb7185] bg-[#fb7185]/[0.08]",
  payment_failed: "border-[#f87171]/35 text-[#f87171] bg-[#f87171]/[0.08]",
  review: "border-[#d8b84f]/35 text-[#d8b84f] bg-[#d8b84f]/[0.1]",
  return: "border-[#a78bfa]/35 text-[#a78bfa] bg-[#a78bfa]/[0.08]",
  invoice: "border-[#34d399]/30 text-[#34d399] bg-[#34d399]/[0.08]",
};

function NotificationTypeIcon({ type }) {
  const Icon = TYPE_ICON_COMPONENTS[type] || Bell;
  const tone = TYPE_ICON_TONE[type] || "border-[#334155] text-[#94a3b8] bg-[#0f1726]";
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone}`}
      aria-hidden
    >
      <Icon className="h-5 w-5" strokeWidth={1.65} />
    </div>
  );
}

const TYPE_LABELS = {
  order: "Orders", low_stock: "Stock", payment_failed: "Payments",
  review: "Reviews", return: "Returns", invoice: "Invoices",
};

const TAB_DEFS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "order", label: "Orders" },
  { id: "low_stock", label: "Stock" },
  { id: "payment_failed", label: "Payments" },
  { id: "review", label: "Reviews" },
  { id: "return", label: "Returns" },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [items, setItems] = useState(() => notifications.map((n) => ({ ...n })));
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = items.filter((n) => !n.isRead).length;

  const tabsWithCounts = useMemo(() =>
    TAB_DEFS.map((t) => {
      let count;
      if (t.id === "all") count = items.length;
      else if (t.id === "unread") count = unreadCount;
      else count = items.filter((n) => n.type === t.id).length;
      return { ...t, count };
    }), [items, unreadCount]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "unread") return items.filter((n) => !n.isRead);
    return items.filter((n) => n.type === activeTab);
  }, [items, activeTab]);

  const toggleRead = (id) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast?.("All notifications marked as read");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Stay on top of store activity"
        badge={
          unreadCount > 0 && (
            <span className="rounded-full bg-[#f87171] px-2.5 py-0.5 text-[11px] font-bold text-white">
              {unreadCount} unread
            </span>
          )
        }
        actions={
          <Btn variant="secondary" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Btn>
        }
      />

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

      {/* Notification List */}
      <div className="rounded-xl border border-[#263145] bg-[#121b2e]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#8b95a7]">No notifications in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-[#263145]/50">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 transition hover:bg-[#182238] ${
                  !n.isRead ? "bg-[#0f1726]/50" : ""
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex-none">
                  {!n.isRead ? (
                    <span className="block h-2 w-2 rounded-full bg-[#60a5fa]" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Icon */}
                <div className="mt-0.5 flex-none">
                  <NotificationTypeIcon type={n.type} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-[#f8fafc]" : "text-[#f8fafc]/80"}`}>
                    {n.message}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={n.priority} />
                    <span className="text-[10px] text-[#8b95a7]">{TYPE_LABELS[n.type] || n.type}</span>
                    <span className="text-[10px] text-[#8b95a7]">·</span>
                    <span className="text-[10px] text-[#8b95a7]">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-none items-center gap-2">
                  <Btn variant="ghost" size="xs" onClick={() => toggleRead(n.id)}>
                    {n.isRead ? "Mark unread" : "Mark read"}
                  </Btn>
                  <Btn variant="ghost" size="xs">View</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SMS Logs */}
      <div className="rounded-xl border border-[#263145] bg-[#121b2e]">
        <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc]">SMS Logs</h3>
            <p className="text-[11px] text-[#8b95a7]">Outbound SMS delivery status</p>
          </div>
          <span className="rounded-md bg-[#182238] px-2 py-0.5 text-[10px] font-semibold text-[#8b95a7]">
            {smsLogs.length} messages
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-[#263145] bg-[#0f1726]">
              <tr>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Customer</th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Phone</th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Message Type</th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Status</th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/50">
              {smsLogs.map((sms) => (
                <tr key={sms.id} className="transition hover:bg-[#182238]">
                  <td className="px-5 py-3 font-medium text-[#f8fafc]">{sms.customerName}</td>
                  <td className="px-5 py-3 font-mono text-[#8b95a7]">{sms.phone}</td>
                  <td className="px-5 py-3 text-[#f8fafc]">{sms.messageType}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sms.status === "delivered" ? "DELIVERED" : "FAILED"} />
                  </td>
                  <td className="px-5 py-3 text-[#8b95a7]">{fmtDateTime(sms.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
