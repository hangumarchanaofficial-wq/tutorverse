import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Btn, useToast } from "../../admin/components/ui";

const inputCls =
  "h-11 w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]";

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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">Add Seller</h1>
          <p className="mt-1 text-xs text-[#98a2b3]">Dashboard &gt; Sellers &gt; Add Seller</p>
        </div>
        <Link
          to="/admin/users"
          className="rounded-lg border border-[#2a303c] bg-[#0c0e12] px-4 py-2 text-sm font-medium text-[#e5e7eb] hover:border-[#fe7a2f]/40"
        >
          All Sellers
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="admin-panel max-w-xl space-y-5 rounded-2xl border border-[#1f232b] bg-[#06070a] p-6"
      >
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Full name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Kristin Watson"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Shop / stall name
          </label>
          <input
            value={form.storeName}
            onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
            placeholder="Colombo Weekend Market — Lane 4"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Email
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="name@company.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Phone
          </label>
          <input
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+94 77 000 0000"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className={inputCls}
          >
            <option value="seller">Seller</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Btn variant="primary" type="submit" size="md" disabled={saving}>
            {saving ? "Saving…" : "Create seller"}
          </Btn>
          <Link
            to="/admin/users"
            className="rounded-lg border border-[#2a303c] px-4 py-2.5 text-sm font-semibold text-[#c1c7d0] hover:bg-[#0f1116]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
