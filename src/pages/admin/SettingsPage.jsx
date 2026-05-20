import React, { useState } from "react";
import {
  CreditCard,
  MessageSquare,
  Shield,
  Store,
  UserPlus,
  Users,
} from "lucide-react";
import {
  PageHeader,
  Tabs,
  Input,
  Select,
  Btn,
  StatusBadge,
  ActionMenu,
  useToast,
  timeAgo,
} from "../../admin/components/ui";
import { dummyAvatarUrl } from "../../admin/utils/avatars";

const SETTINGS_KEY = "twoway_admin_settings";
const PAGE_SUBTITLE = "System · Settings";

const panelCls =
  "admin-settings-panel rounded-2xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const subPanelCls =
  "admin-settings-subpanel rounded-lg border border-[#263145] bg-[#182238]/40 p-4";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Colombo", label: "Asia/Colombo (Sri Lanka)" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "UTC", label: "UTC" },
];

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function saveSettings(data) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
}

const TABS = [
  { id: "store", label: "Store" },
  { id: "payment", label: "Payment" },
  { id: "sms", label: "SMS" },
  { id: "users", label: "Admin Users" },
  { id: "roles", label: "Roles" },
];

const GATEWAY_OPTIONS = [
  { value: "payhere", label: "PayHere" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

const MOCK_ADMINS = [
  { id: "A1", name: "Hansaka Gunawardhana", email: "hansaka@twoway.lk", role: "Super Admin", status: "active", lastLogin: new Date(Date.now() - 36e5).toISOString() },
  { id: "A2", name: "Kavindi Perera", email: "kavindi@twoway.lk", role: "Product Manager", status: "active", lastLogin: new Date(Date.now() - 864e5).toISOString() },
  { id: "A3", name: "Nuwan Silva", email: "nuwan@twoway.lk", role: "Order Manager", status: "inactive", lastLogin: new Date(Date.now() - 7 * 864e5).toISOString() },
];

const ROLES = [
  { id: "super_admin", name: "Super Admin", description: "Full access to all features" },
  { id: "product_manager", name: "Product Manager", description: "Manage products, categories, and inventory" },
  { id: "order_manager", name: "Order Manager", description: "Manage orders, returns, and shipping" },
];

const PERMISSIONS = ["Dashboard", "Products", "Orders", "Customers", "Coupons", "Reviews", "Returns", "Payments", "Settings", "Reports"];

const DEFAULT_ROLE_PERMS = {
  super_admin: PERMISSIONS.reduce((o, p) => ({ ...o, [p]: true }), {}),
  product_manager: { Dashboard: true, Products: true, Reviews: true, Reports: false, Orders: false, Customers: false, Coupons: false, Returns: false, Payments: false, Settings: false },
  order_manager: { Dashboard: true, Orders: true, Returns: true, Customers: true, Payments: true, Products: false, Coupons: false, Reviews: false, Settings: false, Reports: false },
};

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-[#d8b84f]" strokeWidth={1.75} aria-hidden />}
      <h3 className="text-sm font-bold text-[#f8fafc]">{title}</h3>
    </div>
  );
}

function SettingsSection({ title, description, icon, onSave, saveLabel, children, footerExtra }) {
  return (
    <div className={panelCls}>
      <div className="border-b border-[#263145] px-6 py-5">
        <SectionTitle icon={icon} title={title} />
        {description && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-[#8b95a7]">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
      {(onSave || footerExtra) && (
        <div
          className={`admin-settings-panel__footer flex flex-wrap items-center gap-3 border-t border-[#263145] px-6 py-4 ${
            onSave ? "justify-between" : "justify-end"
          }`}
        >
          {footerExtra}
          {onSave && (
            <Btn variant="primary" onClick={onSave}>
              {saveLabel || "Save changes"}
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

function AdminUserAvatar({ admin }) {
  const src = dummyAvatarUrl(admin.id, admin.name);
  const initial = (admin.name || "?")[0].toUpperCase();
  const [failed, setFailed] = useState(false);

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-[#3d4a5f]">
      {!failed ? (
        <img
          src={src}
          alt=""
          className="h-9 w-9 object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center bg-gradient-to-br from-[#2a3548] to-[#1a2332] text-[11px] font-bold text-[#e5e7eb]">
          {initial}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("store");
  const [saved] = useState(() => loadSettings());

  return (
    <div className="admin-products-page admin-settings-page space-y-6">
      <PageHeader title="Settings" subtitle={PAGE_SUBTITLE} />
      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />

      {tab === "store" && <StoreSettings saved={saved} toast={toast} />}
      {tab === "payment" && <PaymentSettings saved={saved} toast={toast} />}
      {tab === "sms" && <SmsSettings saved={saved} toast={toast} />}
      {tab === "users" && <AdminUsersTab toast={toast} />}
      {tab === "roles" && <RolesTab toast={toast} />}
    </div>
  );
}

function StoreSettings({ saved, toast }) {
  const [store, setStore] = useState({
    name: saved.storeName || "TWOWAY",
    email: saved.storeEmail || "hello@twoway.lk",
    phone: saved.storePhone || "+94 11 234 5678",
    address: saved.storeAddress || "42 Galle Road, Colombo 03, Sri Lanka",
    currency: "LKR",
    timezone: saved.timezone || "Asia/Colombo",
  });

  const handleSave = () => {
    const s = loadSettings();
    saveSettings({
      ...s,
      storeName: store.name,
      storeEmail: store.email,
      storePhone: store.phone,
      storeAddress: store.address,
      timezone: store.timezone,
    });
    toast?.("Store settings saved");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <SettingsSection
        icon={Store}
        title="Store Information"
        description="Public storefront contact details and locale defaults shown on invoices and emails."
        onSave={handleSave}
        saveLabel="Save store settings"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Store Name" value={store.name} onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))} />
          <Input label="Store Email" type="email" value={store.email} onChange={(e) => setStore((s) => ({ ...s, email: e.target.value }))} />
          <Input label="Phone" value={store.phone} onChange={(e) => setStore((s) => ({ ...s, phone: e.target.value }))} />
          <Input label="Address" value={store.address} onChange={(e) => setStore((s) => ({ ...s, address: e.target.value }))} />
          <div>
            <Input label="Currency" value={store.currency} readOnly className="opacity-70" />
            <p className="mt-1 text-[11px] text-[#8b95a7]">Fixed to LKR for this marketplace demo.</p>
          </div>
          <Select
            label="Timezone"
            value={store.timezone}
            onChange={(e) => setStore((s) => ({ ...s, timezone: e.target.value }))}
            options={TIMEZONE_OPTIONS}
          />
        </div>
      </SettingsSection>

      <aside className={`${panelCls} flex flex-col gap-3 p-5 lg:sticky lg:top-4 lg:self-start`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8b95a7]">Tips</p>
        <ul className="space-y-2 text-xs leading-relaxed text-[#8b95a7]">
          <li>Use a monitored inbox for the store email — order alerts route there in production.</li>
          <li>Timezone affects report cutoffs and scheduled SMS windows.</li>
          <li>Address appears on packing slips and return labels.</li>
        </ul>
      </aside>
    </div>
  );
}

function PaymentSettings({ saved, toast }) {
  const [codEnabled, setCodEnabled] = useState(saved.codEnabled ?? true);
  const [gateway, setGateway] = useState(saved.gateway || "payhere");
  const [apiKey, setApiKey] = useState(saved.gatewayApiKey || "");
  const webhookUrl = `https://api.twoway.lk/webhooks/${gateway}`;

  const handleSave = () => {
    const s = loadSettings();
    saveSettings({ ...s, codEnabled, gateway, gatewayApiKey: apiKey });
    toast?.("Payment settings saved");
  };

  return (
    <SettingsSection
      icon={CreditCard}
      title="Payment Configuration"
      description="Configure cash on delivery and a single active online gateway for checkout."
      onSave={handleSave}
      saveLabel="Save payment settings"
    >
      <div className="space-y-5">
        <div className={subPanelCls}>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="rounded border-[#263145] bg-[#182238] text-[#d8b84f]"
            />
            <div>
              <span className="text-sm font-medium text-[#f8fafc]">Cash on Delivery (COD)</span>
              <p className="text-[11px] text-[#8b95a7]">Allow customers to pay at delivery</p>
            </div>
          </label>
        </div>

        <div className={subPanelCls}>
          <div className="mb-4 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-2 text-[11px] leading-relaxed text-[#f59e0b]">
            Only one online gateway can be active at a time. Switching gateways clears pending checkout sessions (demo).
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Payment Gateway"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              options={GATEWAY_OPTIONS}
            />
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_live_••••••••••"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
            Webhook URL
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={webhookUrl}
              className="w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#8b95a7]"
            />
            <Btn
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                toast?.("Copied!");
              }}
            >
              Copy
            </Btn>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

function SmsSettings({ saved, toast }) {
  const [provider, setProvider] = useState(saved.smsProvider || "");
  const [smsApiKey, setSmsApiKey] = useState(saved.smsApiKey || "");
  const [orderPlaced, setOrderPlaced] = useState(saved.smsOrderPlaced ?? true);
  const [orderStatus, setOrderStatus] = useState(saved.smsOrderStatus ?? true);
  const [delivery, setDelivery] = useState(saved.smsDelivery ?? false);

  const handleSave = () => {
    const s = loadSettings();
    saveSettings({
      ...s,
      smsProvider: provider,
      smsApiKey,
      smsOrderPlaced: orderPlaced,
      smsOrderStatus: orderStatus,
      smsDelivery: delivery,
    });
    toast?.("SMS settings saved");
  };

  return (
    <SettingsSection
      icon={MessageSquare}
      title="SMS Notifications"
      description="Connect an SMS provider and choose which transactional messages to send."
      onSave={handleSave}
      saveLabel="Save SMS settings"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="SMS Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Dialog, Mobitel, Twilio"
        />
        <Input
          label="API Key"
          type="password"
          value={smsApiKey}
          onChange={(e) => setSmsApiKey(e.target.value)}
          placeholder="API key"
        />
      </div>
      <div className="mt-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">SMS Triggers</p>
        <Toggle label="Order Placed SMS" checked={orderPlaced} onChange={setOrderPlaced} description="Send SMS when a new order is placed" />
        <Toggle label="Order Status SMS" checked={orderStatus} onChange={setOrderStatus} description="Send SMS on order status changes" />
        <Toggle label="Delivery SMS" checked={delivery} onChange={setDelivery} description="Send SMS when order is out for delivery" />
      </div>
    </SettingsSection>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#263145] bg-[#182238] p-3 transition hover:bg-[#182238]/80">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-[#34d399]" : "bg-[#263145]"}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </button>
      </div>
      <div>
        <span className="text-sm font-medium text-[#f8fafc]">{label}</span>
        {description && <p className="text-[11px] text-[#8b95a7]">{description}</p>}
      </div>
    </div>
  );
}

function AdminUsersTab({ toast }) {
  return (
    <SettingsSection
      icon={Users}
      title="Admin Team"
      description="Manage who can access the admin dashboard and their assigned roles."
      footerExtra={
        <Btn variant="primary" size="sm" onClick={() => toast?.("Invite admin (demo)")}>
          <UserPlus className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2} />
          Invite admin
        </Btn>
      }
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="admin-table w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Member</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Email</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Role</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Status</th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Last login</th>
              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {MOCK_ADMINS.map((a) => (
              <tr key={a.id} className="transition hover:bg-[#182238]/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AdminUserAvatar admin={a} />
                    <span className="font-medium text-[#f8fafc]">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#8b95a7]">{a.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[#a78bfa]/15 px-2 py-0.5 text-[11px] font-semibold text-[#a78bfa]">
                    {a.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#8b95a7]">
                  {timeAgo(a.lastLogin)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    items={[
                      { label: "Edit Role" },
                      { label: a.status === "active" ? "Deactivate" : "Activate" },
                      { divider: true },
                      { label: "Remove", danger: true },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
}

function RolesTab({ toast }) {
  const [perms, setPerms] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("twoway_role_perms") || "null") || DEFAULT_ROLE_PERMS;
    } catch {
      return DEFAULT_ROLE_PERMS;
    }
  });

  const togglePerm = (roleId, perm) => {
    if (roleId === "super_admin") return;
    setPerms((prev) => ({
      ...prev,
      [roleId]: { ...prev[roleId], [perm]: !prev[roleId][perm] },
    }));
  };

  const handleSave = () => {
    localStorage.setItem("twoway_role_perms", JSON.stringify(perms));
    toast?.("Roles & permissions saved");
  };

  return (
    <SettingsSection
      icon={Shield}
      title="Roles & Permissions"
      description="Control which areas of the admin each role can access. Super Admin always has full access."
      onSave={handleSave}
      saveLabel="Save permissions"
    >
      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-lg border border-[#263145] bg-[#182238] px-4 py-3">
            <p className="text-xs font-semibold text-[#f8fafc]">{r.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#8b95a7]">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="admin-table w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-[#263145] bg-[#0f1726]">
            <tr>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                Permission
              </th>
              {ROLES.map((r) => (
                <th
                  key={r.id}
                  className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]"
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/50">
            {PERMISSIONS.map((perm) => (
              <tr key={perm} className="transition hover:bg-[#182238]/40">
                <td className="px-4 py-3 text-sm font-medium text-[#f8fafc]">{perm}</td>
                {ROLES.map((role) => (
                  <td key={role.id} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!perms[role.id]?.[perm]}
                      onChange={() => togglePerm(role.id, perm)}
                      disabled={role.id === "super_admin"}
                      className="rounded border-[#263145] bg-[#182238] text-[#d8b84f] disabled:opacity-50"
                      aria-label={`${perm} for ${role.name}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
}
