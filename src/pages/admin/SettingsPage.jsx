import React, { useState } from "react";
import {
  PageHeader,
  Tabs,
  Input,
  Select,
  Btn,
  StatusBadge,
  ActionMenu,
  useToast,
} from "../../admin/components/ui";

const SETTINGS_KEY = "twoway_admin_settings";

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

export default function SettingsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("store");
  const [saved] = useState(() => loadSettings());

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />

      {tab === "store" && <StoreSettings saved={saved} toast={toast} />}
      {tab === "payment" && <PaymentSettings saved={saved} toast={toast} />}
      {tab === "sms" && <SmsSettings saved={saved} toast={toast} />}
      {tab === "users" && <AdminUsersTab />}
      {tab === "roles" && <RolesTab saved={saved} toast={toast} />}
    </div>
  );
}

/* ─── Store Settings ─── */
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
    saveSettings({ ...s, storeName: store.name, storeEmail: store.email, storePhone: store.phone, storeAddress: store.address, timezone: store.timezone });
    toast("Store settings saved");
  };

  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-6">
      <h3 className="mb-5 text-sm font-bold text-[#f8fafc]">Store Information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Store Name" value={store.name} onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))} />
        <Input label="Store Email" type="email" value={store.email} onChange={(e) => setStore((s) => ({ ...s, email: e.target.value }))} />
        <Input label="Phone" value={store.phone} onChange={(e) => setStore((s) => ({ ...s, phone: e.target.value }))} />
        <Input label="Address" value={store.address} onChange={(e) => setStore((s) => ({ ...s, address: e.target.value }))} />
        <Input label="Currency" value={store.currency} readOnly className="opacity-60" />
        <Input label="Timezone" value={store.timezone} onChange={(e) => setStore((s) => ({ ...s, timezone: e.target.value }))} />
      </div>
      <div className="mt-5">
        <Btn variant="primary" onClick={handleSave}>Save Store Settings</Btn>
      </div>
    </div>
  );
}

/* ─── Payment Settings ─── */
function PaymentSettings({ saved, toast }) {
  const [codEnabled, setCodEnabled] = useState(saved.codEnabled ?? true);
  const [gateway, setGateway] = useState(saved.gateway || "payhere");
  const [apiKey, setApiKey] = useState(saved.gatewayApiKey || "");
  const webhookUrl = `https://api.twoway.lk/webhooks/${gateway}`;

  const handleSave = () => {
    const s = loadSettings();
    saveSettings({ ...s, codEnabled, gateway, gatewayApiKey: apiKey });
    toast("Payment settings saved");
  };

  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-6">
      <h3 className="mb-5 text-sm font-bold text-[#f8fafc]">Payment Configuration</h3>
      <div className="space-y-5">
        {/* COD */}
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
            className="rounded border-[#263145] bg-[#182238]"
          />
          <div>
            <span className="text-sm font-medium text-[#f8fafc]">Cash on Delivery (COD)</span>
            <p className="text-[11px] text-[#8b95a7]">Allow customers to pay at delivery</p>
          </div>
        </label>

        <div className="border-t border-[#263145] pt-4">
          <p className="mb-3 text-[11px] text-[#f59e0b]">Only one online gateway can be active at a time.</p>
          <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Webhook URL */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#8b95a7] opacity-70"
            />
            <Btn
              variant="ghost"
              size="xs"
              onClick={() => { navigator.clipboard.writeText(webhookUrl); toast("Copied!"); }}
            >
              Copy
            </Btn>
          </div>
        </div>

        <Btn variant="primary" onClick={handleSave}>Save Payment Settings</Btn>
      </div>
    </div>
  );
}

/* ─── SMS Settings ─── */
function SmsSettings({ saved, toast }) {
  const [provider, setProvider] = useState(saved.smsProvider || "");
  const [smsApiKey, setSmsApiKey] = useState(saved.smsApiKey || "");
  const [orderPlaced, setOrderPlaced] = useState(saved.smsOrderPlaced ?? true);
  const [orderStatus, setOrderStatus] = useState(saved.smsOrderStatus ?? true);
  const [delivery, setDelivery] = useState(saved.smsDelivery ?? false);

  const handleSave = () => {
    const s = loadSettings();
    saveSettings({ ...s, smsProvider: provider, smsApiKey, smsOrderPlaced: orderPlaced, smsOrderStatus: orderStatus, smsDelivery: delivery });
    toast("SMS settings saved");
  };

  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-6">
      <h3 className="mb-5 text-sm font-bold text-[#f8fafc]">SMS Notifications</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="SMS Provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Dialog, Mobitel, Twilio" />
        <Input label="API Key" type="password" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} placeholder="API key" />
      </div>
      <div className="mt-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">SMS Triggers</p>
        <Toggle label="Order Placed SMS" checked={orderPlaced} onChange={setOrderPlaced} description="Send SMS when a new order is placed" />
        <Toggle label="Order Status SMS" checked={orderStatus} onChange={setOrderStatus} description="Send SMS on order status changes" />
        <Toggle label="Delivery SMS" checked={delivery} onChange={setDelivery} description="Send SMS when order is out for delivery" />
      </div>
      <div className="mt-5">
        <Btn variant="primary" onClick={handleSave}>Save SMS Settings</Btn>
      </div>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-[#263145] bg-[#182238] p-3 transition hover:bg-[#182238]/80 cursor-pointer">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${checked ? "bg-[#34d399]" : "bg-[#263145]"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
      <div>
        <span className="text-sm font-medium text-[#f8fafc]">{label}</span>
        {description && <p className="text-[11px] text-[#8b95a7]">{description}</p>}
      </div>
    </label>
  );
}

/* ─── Admin Users Tab ─── */
function AdminUsersTab() {
  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-6">
      <h3 className="mb-5 text-sm font-bold text-[#f8fafc]">Admin Team</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#263145]">
              {["Name", "Email", "Role", "Status", "Last Login", ""].map((h, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ADMINS.map((a) => (
              <tr key={a.id} className="border-b border-[#263145]/60 transition hover:bg-[#182238]">
                <td className="px-4 py-3 font-medium text-[#f8fafc]">{a.name}</td>
                <td className="px-4 py-3 text-[#8b95a7]">{a.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[#a78bfa]/15 px-2 py-0.5 text-[11px] font-semibold text-[#a78bfa]">{a.role}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                  {new Date(a.lastLogin).toLocaleString()}
                </td>
                <td className="px-4 py-3">
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
    </div>
  );
}

/* ─── Roles Tab ─── */
function RolesTab({ saved, toast }) {
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
    toast("Roles & permissions saved");
  };

  return (
    <div className="rounded-xl border border-[#263145] bg-[#121b2e] p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f8fafc]">Roles & Permissions</h3>
        <Btn variant="primary" size="sm" onClick={handleSave}>Save Permissions</Btn>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#263145]">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">Permission</th>
              {ROLES.map((r) => (
                <th key={r.id} className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm} className="border-b border-[#263145]/60">
                <td className="px-4 py-3 text-sm text-[#f8fafc]">{perm}</td>
                {ROLES.map((role) => (
                  <td key={role.id} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!perms[role.id]?.[perm]}
                      onChange={() => togglePerm(role.id, perm)}
                      disabled={role.id === "super_admin"}
                      className="rounded border-[#263145] bg-[#182238] text-[#d8b84f] disabled:opacity-50"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-2">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-lg border border-[#263145] bg-[#182238] px-4 py-2">
            <span className="text-xs font-semibold text-[#f8fafc]">{r.name}</span>
            <span className="ml-2 text-[11px] text-[#8b95a7]">{r.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
