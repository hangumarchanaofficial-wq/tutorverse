import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CreditCard,
  ExternalLink,
  FileText,
  Package,
  Star,
  TrendingDown,
  Undo2,
} from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  Tabs,
  Btn,
  useToast,
  fmtDateTime,
  timeAgo,
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

const TYPE_ICON_TONE = {
  order: "border-[#38bdf8]/30 text-[#38bdf8] bg-[#38bdf8]/[0.08]",
  low_stock: "border-[#fb7185]/35 text-[#fb7185] bg-[#fb7185]/[0.08]",
  payment_failed: "border-[#f87171]/35 text-[#f87171] bg-[#f87171]/[0.08]",
  review: "border-[#d8b84f]/35 text-[#d8b84f] bg-[#d8b84f]/[0.1]",
  return: "border-[#a78bfa]/35 text-[#a78bfa] bg-[#a78bfa]/[0.08]",
  invoice: "border-[#34d399]/30 text-[#34d399] bg-[#34d399]/[0.08]",
};

const TYPE_LABELS = {
  order: "Orders",
  low_stock: "Stock",
  payment_failed: "Payments",
  review: "Reviews",
  return: "Returns",
  invoice: "Invoices",
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

function notificationViewPath(n) {
  switch (n.type) {
    case "order":
      return `/admin/orders/${n.relatedId}`;
    case "low_stock":
      return `/admin/products/${n.relatedId}/details`;
    case "payment_failed":
      return `/admin/orders/${n.relatedId}`;
    case "review":
      return "/admin/reviews";
    case "return":
      return "/admin/returns";
    case "invoice":
      return "/admin/invoices";
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState(() => notifications.map((n) => ({ ...n })));
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = items.filter((n) => !n.isRead).length;

  const tabsWithCounts = useMemo(
    () =>
      TAB_DEFS.map((t) => {
        let count;
        if (t.id === "all") count = items.length;
        else if (t.id === "unread") count = unreadCount;
        else count = items.filter((n) => n.type === t.id).length;
        return { ...t, count };
      }),
    [items, unreadCount]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "unread") return items.filter((n) => !n.isRead);
    return items.filter((n) => n.type === activeTab);
  }, [items, activeTab]);

  const toggleRead = useCallback((id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast?.("All notifications marked as read");
  }, [toast]);

  const viewNotification = useCallback(
    (n) => {
      const path = notificationViewPath(n);
      if (path) {
        if (!n.isRead) toggleRead(n.id);
        navigate(path);
      } else {
        toast?.("No linked view for this notification", "warning");
      }
    },
    [navigate, toast, toggleRead]
  );

  return (
    <div className="admin-products-page admin-notifications-page space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="System · Alerts"
        badge={
          unreadCount > 0 ? (
            <span className="rounded-full bg-[#f87171]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#f87171]">
              {unreadCount} unread
            </span>
          ) : null
        }
        actions={
          <Btn variant="secondary" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Btn>
        }
      />

      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onChange={setActiveTab} />

      <div className="overflow-hidden rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Bell className="mb-3 h-10 w-10 text-[#8b95a7] opacity-60" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[#f8fafc]">No notifications in this category</p>
            <p className="mt-1 text-xs text-[#8b95a7]">Try another tab or check back later.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#263145]/50">
            {filtered.map((n) => {
              const viewPath = notificationViewPath(n);
              return (
                <li
                  key={n.id}
                  className={`admin-notification-row flex items-center gap-4 px-5 py-4 transition ${
                    !n.isRead
                      ? "admin-notification-row--unread border-l-[3px] border-l-[#60a5fa] bg-[#0f1726]/50 pl-[17px]"
                      : "border-l-[3px] border-l-transparent pl-5 hover:bg-[#182238]/60"
                  }`}
                >
                  <div className="flex w-3 shrink-0 justify-center" aria-hidden>
                    {!n.isRead ? (
                      <span className="block h-2 w-2 rounded-full bg-[#60a5fa] ring-2 ring-[#60a5fa]/25" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-[#334155]/80" />
                    )}
                  </div>

                  <NotificationTypeIcon type={n.type} />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        !n.isRead
                          ? "admin-notification-row__title--unread font-semibold text-[#f8fafc]"
                          : "admin-notification-row__title--read text-[#e5e7eb]"
                      }`}
                    >
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusBadge status={n.priority} />
                      <span className="text-[10px] font-medium text-[#8b95a7]">
                        {TYPE_LABELS[n.type] || n.type}
                      </span>
                      <span className="text-[10px] text-[#6b7280]" aria-hidden>
                        ·
                      </span>
                      <span className="text-[10px] tabular-nums text-[#8b95a7]">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <Btn variant="ghost" size="xs" onClick={() => toggleRead(n.id)}>
                      {n.isRead ? "Mark unread" : "Mark read"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="xs"
                      onClick={() => viewNotification(n)}
                      disabled={!viewPath}
                      title={viewPath ? "Open related record" : "No link"}
                    >
                      <ExternalLink className="mr-1 inline h-3 w-3 opacity-70" strokeWidth={2} />
                      View
                    </Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263145] px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-[#f8fafc]">SMS Logs</h3>
            <p className="text-[11px] text-[#8b95a7]">Outbound SMS delivery status</p>
          </div>
          <span className="rounded-full bg-[#182238] px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-[#8b95a7]">
            {smsLogs.length} messages
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-xs">
            <thead className="border-b border-[#263145] bg-[#0f1726]">
              <tr>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Customer
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Phone
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Message Type
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Status
                </th>
                <th className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/50">
              {smsLogs.map((sms) => (
                <tr key={sms.id} className="transition hover:bg-[#182238]/60">
                  <td className="px-5 py-3 font-medium text-[#f8fafc]">{sms.customerName}</td>
                  <td className="px-5 py-3 font-mono text-[#8b95a7]">{sms.phone}</td>
                  <td className="px-5 py-3 text-[#e5e7eb]">{sms.messageType}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={sms.status === "delivered" ? "DELIVERED" : "FAILED"} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-[#8b95a7]">{fmtDateTime(sms.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
