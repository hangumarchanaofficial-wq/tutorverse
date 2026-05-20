import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Input, Select, Btn, useToast } from "../../admin/components/ui";

const panelCls =
  "rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const ROLE_OPTIONS = [
  { value: "seller", label: "Seller" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

export default function AdminUserForm() {
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    storeName: "",
    email: "",
    role: "seller",
    phone: "",
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast?.("Seller created");
      nav("/admin/users");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-products-page admin-seller-form space-y-6">
      <PageHeader
        title="Add Seller"
        subtitle="Dashboard · Sellers · Add Seller"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/users">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn variant="primary" size="md" type="submit" form="seller-form" disabled={saving}>
              {saving ? "Saving…" : "Save seller"}
            </Btn>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form id="seller-form" onSubmit={onSubmit} className={`${panelCls} flex flex-col space-y-5`}>
          <div className="grid gap-5 lg:grid-cols-2">
            <Input
              label="Full name"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full legal name"
            />
            <Input
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="seller@example.com"
            />
            <Input
              label="Shop / stall name"
              value={form.storeName}
              onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
              placeholder="Optional — shown on storefront"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+94 …"
            />
            <div className="lg:col-span-2">
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                options={ROLE_OPTIONS}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#263145] pt-5 sm:flex-row sm:flex-wrap">
            <Btn variant="primary" type="submit" size="md" className="w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving…" : "Create seller"}
            </Btn>
            <Link to="/admin/users" className="w-full sm:w-auto">
              <Btn variant="secondary" size="md" className="w-full sm:w-auto">
                Cancel
              </Btn>
            </Link>
          </div>
        </form>

        <aside className={`${panelCls} flex flex-col space-y-3 lg:sticky lg:top-24 lg:self-start`}>
          <h3 className="text-sm font-semibold text-[#f8fafc]">Invite</h3>
          <p className="text-xs leading-relaxed text-[#8b95a7]">
            Seller receives login instructions after invite.
          </p>
        </aside>
      </div>
    </div>
  );
}
