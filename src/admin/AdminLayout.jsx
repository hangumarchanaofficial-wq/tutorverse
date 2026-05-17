import React, { useState, useMemo, useEffect } from "react";
import { Outlet, NavLink, Link, Navigate, useLocation } from "react-router-dom";
import { Inbox, List, MessagesSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notifications as mockNotifs, inboxUnreadBadgeCount } from "./data/mockData";
import { readInboxState, getUnreadCount, INBOX_UPDATED } from "./inbox/inboxSession";
import "./admin-theme.css";

// ─── SVG icon helper ───
const I = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

// ─── Nav sections ───
const navSections = [
  {
    items: [
      { to: "/admin", label: "Dashboard", end: true, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        key: "order-menu",
        label: "Order",
        icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 14H6L5 9z",
        badgeKey: "pendingOrders",
        children: [
          { to: "/admin/orders", label: "Order List", end: true },
          { to: "/admin/orders/detail", label: "Order Detail", match: "order-detail" },
          { to: "/admin/orders/tracking", label: "Order Tracking", match: "order-tracking" },
        ],
      },
      { to: "/admin/returns", label: "Returns & Refunds", icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6", badgeKey: "pendingReturns" },
      { to: "/admin/invoices", label: "Invoices", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        key: "product-menu",
        label: "Product",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        children: [
          { to: "/admin/products", label: "All Products", end: true },
          { to: "/admin/products/new", label: "Add Product", match: "new" },
          { to: "/admin/products/edit", label: "Edit Product", match: "edit" },
          { to: "/admin/products/details", label: "Product Details", match: "details" },
        ],
      },
      {
        key: "category-menu",
        label: "Category",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
        children: [
          { to: "/admin/categories", label: "All Category", end: true },
          { to: "/admin/categories/new", label: "Add Category", match: "new" },
        ],
      },
      {
        key: "attributes-menu",
        label: "Attributes",
        icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
        children: [
          { to: "/admin/attributes", label: "All Attributes", end: true },
          { to: "/admin/attributes/new", label: "Add Attributes", match: "new" },
        ],
      },
      { to: "/admin/brands", label: "Brands", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/admin/stock", label: "Stock Overview", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm4 3h8m-8 4h5", badgeKey: "lowStockItems" },
      { to: "/admin/stock/logs", label: "Stock Logs", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { to: "/admin/stock/restock", label: "Restock Planner", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    ],
  },
  {
    label: "Sellers",
    items: [
      {
        key: "users-menu",
        label: "Sellers",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        children: [
          { to: "/admin/users", label: "All Sellers", end: true },
          { to: "/admin/users/new", label: "Add Seller", match: "new" },
          { to: "/login", label: "Login" },
          { to: "/register", label: "Sign Up" },
        ],
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/coupons", label: "Coupons", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" },
      { to: "/admin/reviews", label: "Reviews", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", badgeKey: "pendingReviews" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/admin/payments", label: "Payments", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", badgeKey: "failedPayments" },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        to: "/admin/reports/sales",
        label: "Advanced Reports",
        activePathPrefix: "/admin/reports",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
      { to: "/admin/health", label: "Store Health", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    ],
  },
  {
    label: "System",
    items: [
      {
        key: "inbox-menu",
        label: "Inbox",
        lucideParent: true,
        badgeKey: "inboxUnread",
        children: [
          { to: "/admin/inbox", label: "List", end: true, lucideSub: "list" },
          { to: "/admin/inbox/conversation", label: "Conversation", match: "inbox-conversation", lucideSub: "messages" },
        ],
      },
      { to: "/admin/notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
      { to: "/admin/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
  },
];

// ─── Badge counts (from mock data / future API) ───
const badgeCounts = {
  pendingOrders: 2,
  pendingReturns: 2,
  lowStockItems: 3,
  pendingReviews: 2,
  failedPayments: 1,
};

function initialInboxUnread() {
  const s = readInboxState();
  if (s?.messages?.length) return getUnreadCount(s.messages, s.archivedIds || []);
  return inboxUnreadBadgeCount;
}

function AdminLayout() {
  const { user, loading, isAdmin, adminBypass, logout } = useAuth();
  const location = useLocation();
  const [inboxUnread, setInboxUnread] = useState(initialInboxUnread);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("dark");
  const [productNavOpen, setProductNavOpen] = useState(() => location.pathname.startsWith("/admin/products"));
  const [categoryNavOpen, setCategoryNavOpen] = useState(() => location.pathname.startsWith("/admin/categories"));
  const [attributesNavOpen, setAttributesNavOpen] = useState(() => location.pathname.startsWith("/admin/attributes"));
  const [orderNavOpen, setOrderNavOpen] = useState(() => location.pathname.startsWith("/admin/orders"));
  const [usersNavOpen, setUsersNavOpen] = useState(() => location.pathname.startsWith("/admin/users"));
  const [inboxNavOpen, setInboxNavOpen] = useState(() => location.pathname.startsWith("/admin/inbox"));

  const unreadCount = useMemo(() => mockNotifs.filter((n) => !n.isRead).length, []);
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    localStorage.setItem("admin-theme", theme);
    document.documentElement.setAttribute("data-admin-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin/products")) setProductNavOpen(true);
    if (location.pathname.startsWith("/admin/categories")) setCategoryNavOpen(true);
    if (location.pathname.startsWith("/admin/attributes")) setAttributesNavOpen(true);
    if (location.pathname.startsWith("/admin/orders")) setOrderNavOpen(true);
    if (location.pathname.startsWith("/admin/users")) setUsersNavOpen(true);
    if (location.pathname.startsWith("/admin/inbox")) setInboxNavOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    const onInbox = () => setInboxUnread(initialInboxUnread());
    window.addEventListener(INBOX_UPDATED, onInbox);
    return () => window.removeEventListener(INBOX_UPDATED, onInbox);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#263145] border-t-[#d8b84f]" />
          <span className="text-sm text-[#8b95a7]">Loading admin…</span>
        </div>
      </div>
    );
  }

  if (!user && !adminBypass) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] px-6 text-center">
        <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-10">
          <h1 className="text-2xl font-bold text-[#f8fafc]">Admin access required</h1>
          <p className="mt-2 max-w-md text-sm text-[#8b95a7]">
            Your account does not have the admin role. Ask a database administrator to set{" "}
            <code className="rounded bg-[#182238] px-1.5 py-0.5 text-[11px] text-[#d8b84f]">profiles.role = 'admin'</code> for your user.
          </p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-[#d8b84f] px-5 py-2.5 text-sm font-semibold text-[#070b14] hover:bg-[#e5c866]">
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  const sidebar = (
    <aside className="admin-sidebar flex h-full w-[278px] flex-col bg-[#0f1726] border-r border-[#263145]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d8b84f]">
            <span className="text-sm font-black text-[#070b14]">T</span>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-[#d8b84f]">TWOWAY</span>
            <span className="ml-1.5 rounded bg-[#182238] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8b95a7]">Admin</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="rounded p-1 text-[#8b95a7] hover:bg-[#182238] lg:hidden">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6" /></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-5" : ""}>
            {section.label && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b95a7]/60">{section.label}</p>
            )}
            {section.items.map((item) => {
              if (item.children) {
                const isProductMenu = item.key === "product-menu";
                const isCategoryMenu = item.key === "category-menu";
                const isAttributesMenu = item.key === "attributes-menu";
                const isOrderMenu = item.key === "order-menu";
                const isUsersMenu = item.key === "users-menu";
                const isInboxMenu = item.key === "inbox-menu";
                const goldSubmenu = isInboxMenu;
                const isMenuRoute =
                  (isProductMenu && location.pathname.startsWith("/admin/products")) ||
                  (isCategoryMenu && location.pathname.startsWith("/admin/categories")) ||
                  (isAttributesMenu && location.pathname.startsWith("/admin/attributes")) ||
                  (isOrderMenu && location.pathname.startsWith("/admin/orders")) ||
                  (isUsersMenu && location.pathname.startsWith("/admin/users")) ||
                  (isInboxMenu && location.pathname.startsWith("/admin/inbox"));
                const isOpen = isProductMenu
                  ? productNavOpen
                  : isCategoryMenu
                    ? categoryNavOpen
                    : isAttributesMenu
                      ? attributesNavOpen
                      : isUsersMenu
                        ? usersNavOpen
                        : isInboxMenu
                          ? inboxNavOpen
                          : orderNavOpen;
                const subBadge =
                  item.badgeKey === "inboxUnread"
                    ? inboxUnread
                    : item.badgeKey
                      ? badgeCounts[item.badgeKey]
                      : 0;
                return (
                  <div key={item.key || item.label} className="mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (isProductMenu) setProductNavOpen((v) => !v);
                        if (isCategoryMenu) setCategoryNavOpen((v) => !v);
                        if (isAttributesMenu) setAttributesNavOpen((v) => !v);
                        if (isOrderMenu) setOrderNavOpen((v) => !v);
                        if (isUsersMenu) setUsersNavOpen((v) => !v);
                        if (isInboxMenu) setInboxNavOpen((v) => !v);
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                        goldSubmenu && isMenuRoute
                          ? "bg-[#d8b84f]/10 text-[#d8b84f]"
                          : isMenuRoute
                            ? "bg-[#d46f1e]/12 text-[#ff7a2f]"
                            : "text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
                      }`}
                    >
                      {isMenuRoute && (
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full ${goldSubmenu ? "bg-[#d8b84f]" : "bg-[#ff7a2f]"}`}
                        />
                      )}
                      {item.lucideParent ? (
                        <Inbox className="h-[17px] w-[17px] shrink-0 opacity-95" strokeWidth={1.75} />
                      ) : (
                        <I d={item.icon} size={17} />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {subBadge > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            goldSubmenu ? "bg-[#60a5fa] text-white" : "bg-[#f87171]/20 text-[#f87171]"
                          }`}
                        >
                          {subBadge}
                        </span>
                      )}
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {item.children.map((child, idx) => {
                          const path = location.pathname;
                          const subActive =
                            child.match === "edit"
                              ? /\/admin\/products\/[^/]+\/edit$/.test(path)
                              : child.match === "new"
                                ? isProductMenu
                                  ? path === "/admin/products/new"
                                  : isCategoryMenu
                                    ? path === "/admin/categories/new"
                                    : isUsersMenu
                                      ? path === "/admin/users/new"
                                      : path === "/admin/attributes/new"
                                : child.match === "details"
                                  ? /\/admin\/products\/[^/]+\/details$/.test(path)
                                  : child.match === "order-detail"
                                    ? path.startsWith("/admin/orders/") &&
                                      path !== "/admin/orders/tracking" &&
                                      path !== "/admin/orders"
                                    : child.match === "order-tracking"
                                      ? path === "/admin/orders/tracking"
                                      : child.match === "inbox-conversation"
                                        ? /^\/admin\/inbox\/conversation(\/|$)/.test(path)
                                        : null;
                          const activeClass = goldSubmenu ? "text-[#d8b84f]" : "text-[#ff7a2f]";
                          const activeRing = goldSubmenu ? "border-[#d8b84f]" : "border-[#ff7a2f]";
                          return (
                            <NavLink
                              key={`${child.label}-${idx}`}
                              to={child.to}
                              end={child.end}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) => {
                                const active = subActive != null ? subActive : isActive;
                                return `flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                                  active
                                    ? activeClass
                                    : "text-[#c3cad9] hover:bg-[#131a2b] hover:text-[#f8fafc]"
                                }`;
                              }}
                            >
                              {({ isActive }) => {
                                const active = subActive != null ? subActive : isActive;
                                const iconTone = active ? activeClass : "text-[#9aa4ba]";
                                return (
                                  <>
                                    {child.lucideSub === "list" ? (
                                      <List className={`h-3.5 w-3.5 shrink-0 ${iconTone}`} strokeWidth={2} />
                                    ) : child.lucideSub === "messages" ? (
                                      <MessagesSquare className={`h-3.5 w-3.5 shrink-0 ${iconTone}`} strokeWidth={2} />
                                    ) : (
                                      <span
                                        className={`h-2 w-2 shrink-0 rounded-full border ${
                                          active ? `${activeRing} bg-transparent` : "border-[#9aa4ba] bg-transparent"
                                        }`}
                                      />
                                    )}
                                    <span>{child.label}</span>
                                  </>
                                );
                              }}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
              const prefixActive = item.activePathPrefix && location.pathname.startsWith(item.activePathPrefix);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => {
                    const active = prefixActive || isActive;
                    return `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-[#d8b84f]/10 text-[#d8b84f]"
                        : "text-[#8b95a7] hover:bg-[#182238] hover:text-[#f8fafc]"
                    }`;
                  }}
                >
                  {({ isActive }) => {
                    const active = prefixActive || isActive;
                    return (
                      <>
                        {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#d8b84f]" />}
                        <I d={item.icon} size={17} />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="rounded-full bg-[#f87171]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f87171]">{badge}</span>
                        )}
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

    </aside>
  );

  return (
    <div className={`admin-theme-root admin-theme-${theme} flex h-screen`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - desktop always visible, mobile as overlay */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </div>

      {/* Main */}
      <div className="admin-main flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="admin-topbar sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#eceff3] bg-white px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] lg:hidden"
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="relative w-[420px] sm:w-[560px]">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#98a2b3]" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="11" cy="11" r="6" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-9 w-full rounded-md border border-[#eef0f2] bg-[#f7f8fa] pl-9 pr-2 text-sm text-[#344054] outline-none placeholder:text-[#98a2b3] focus:border-[#d0d5dd]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Language">
              <span className="text-sm">🇬🇧</span>
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={theme === "dark" ? "Use light theme" : "Use dark theme"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
                </svg>
              )}
            </button>
            <Link to="/admin/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" /></svg>
              {unreadCount > 0 && <span className="absolute right-[5px] top-[5px] h-1.5 w-1.5 rounded-full bg-[#f04438]" />}
            </Link>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Chat">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </button>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Fullscreen">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" /></svg>
            </button>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Apps">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" strokeLinecap="round" /></svg>
            </button>
            <div className="mx-2 h-5 w-px bg-[#eaecf0]" />
            <div className="flex items-center gap-2 pr-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fde8d8] text-xs font-bold text-[#c2410c]">
                {(user?.email || "A")[0].toUpperCase()}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-[#101828]">{user?.name || "Kristin Watson"}</p>
                <p className="text-xs text-[#98a2b3]">{adminBypass && !user ? "Dev Admin" : "Sale Administrator"}</p>
              </div>
            </div>
            <Link to="/admin/settings" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#667085] hover:bg-[#f3f4f6]" aria-label="Settings">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m12 15.5 0 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.4 7.4 0 0 0-.1-1l2-1.6-2-3.4-2.4.8a7.5 7.5 0 0 0-1.7-1L15 3h-6l-.2 2.8a7.5 7.5 0 0 0-1.7 1l-2.4-.8-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2l-2 1.6 2 3.4 2.4-.8a7.5 7.5 0 0 0 1.7 1L9 21h6l.2-2.8a7.5 7.5 0 0 0 1.7-1l2.4.8 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" /></svg>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="admin-footer shrink-0 border-t border-[#263145] bg-[#0f1726]/80 px-4 py-3 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-[11px] text-[#8b95a7]">
              &copy; {new Date().getFullYear()} <span className="font-semibold text-[#d8b84f]">TwoWay Ceylon</span>. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#8b95a7]">
              <span>v1.0.0</span>
              <span className="h-3 w-px bg-[#263145]" />
              <a href="/admin/health" className="transition hover:text-[#f8fafc]">System Health</a>
              <span className="h-3 w-px bg-[#263145]" />
              <a href="/admin/settings" className="transition hover:text-[#f8fafc]">Settings</a>
              <span className="h-3 w-px bg-[#263145]" />
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] animate-pulse" />
                Operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
