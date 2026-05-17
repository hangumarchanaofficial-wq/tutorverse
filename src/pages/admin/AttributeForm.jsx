import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Btn, useToast } from "../../admin/components/ui";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const inputCls =
  "h-11 w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]";

const TYPE_OPTIONS = [
  { value: "select", label: "Select" },
  { value: "swatch", label: "Swatch (color)" },
  { value: "text", label: "Text" },
];

export default function AttributeForm() {
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "select",
    values: "",
  });

  const previewSlug = useMemo(() => slugify(form.name), [form.name]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast?.("Attribute saved");
      nav("/admin/attributes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">Add Attributes</h1>
          <p className="mt-1 text-xs text-[#98a2b3]">Dashboard &gt; Attributes &gt; Add Attributes</p>
        </div>
        <Link
          to="/admin/attributes"
          className="rounded-lg border border-[#2a303c] bg-[#0c0e12] px-4 py-2 text-sm font-medium text-[#e5e7eb] hover:border-[#fe7a2f]/40"
        >
          All Attributes
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="admin-panel max-w-3xl space-y-5 rounded-2xl border border-[#1f232b] bg-[#06070a] p-6"
      >
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Attribute name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Sleeve length"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder={previewSlug || "auto-generated"}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Input type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className={inputCls}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
            Values (optional)
          </label>
          <textarea
            rows={4}
            value={form.values}
            onChange={(e) => setForm((p) => ({ ...p, values: e.target.value }))}
            placeholder="Comma-separated, e.g. S, M, L, XL"
            className="w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Btn variant="primary" type="submit" size="md" disabled={saving}>
            {saving ? "Saving…" : "Save attribute"}
          </Btn>
          <Link
            to="/admin/attributes"
            className="rounded-lg border border-[#2a303c] px-4 py-2.5 text-sm font-semibold text-[#c1c7d0] hover:bg-[#0f1116]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
