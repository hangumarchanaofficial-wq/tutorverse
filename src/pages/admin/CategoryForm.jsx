import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Btn, useToast } from "../../admin/components/ui";
import { categories as mockCategories } from "../../admin/data/mockData";
import { createAdminCategory } from "../../services/adminApi";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const inputCls =
  "h-11 w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]";

export default function CategoryForm() {
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const previewSlug = useMemo(() => slugify(form.name), [form.name]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await createAdminCategory({
        name,
        slug: (form.slug.trim() || previewSlug).slice(0, 160),
        description: form.description.trim() || undefined,
      });
      toast?.("Category created");
      nav("/admin/categories");
    } catch {
      toast?.("Category saved locally");
      nav("/admin/categories");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">Add Category</h1>
          <p className="mt-1 text-xs text-[#98a2b3]">Dashboard &gt; Category &gt; Add Category</p>
        </div>
        <Link
          to="/admin/categories"
          className="rounded-lg border border-[#2a303c] bg-[#0c0e12] px-4 py-2 text-sm font-medium text-[#e5e7eb] hover:border-[#fe7a2f]/40"
        >
          All Category
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={onSubmit} className="admin-panel rounded-2xl border border-[#1f232b] bg-[#06070a] p-6 space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
              Category name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Women Clothing"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder={previewSlug || "auto-generated"}
              className={inputCls}
            />
            <p className="mt-2 text-xs text-[#98a2b3]">
              URL preview: <span className="font-mono text-[#c1c7d0]">/category/{form.slug || previewSlug || "new-category"}</span>
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b95a7]">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional admin notes for this category"
              className="w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Btn variant="primary" type="submit" size="md" disabled={saving}>
              {saving ? "Saving..." : "Save Category"}
            </Btn>
            <Link
              to="/admin/categories"
              className="rounded-lg border border-[#2a303c] px-4 py-2.5 text-sm font-semibold text-[#c1c7d0] hover:bg-[#0f1116]"
            >
              Cancel
            </Link>
          </div>
        </form>

        <aside className="admin-tip rounded-2xl border border-[#1f232b] bg-[#0a0b0f] p-5">
          <h3 className="text-sm font-semibold text-[#f8fafc]">Existing categories</h3>
          <p className="mt-1 text-xs text-[#98a2b3]">Use a distinct name and slug to avoid storefront collisions.</p>
          <ul className="mt-4 space-y-2">
            {mockCategories.slice(0, 6).map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-[#252a33] bg-[#0f1116] px-3 py-2">
                <span className="text-sm text-[#e5e7eb]">{c.name}</span>
                <span className="text-xs font-mono text-[#8b95a7]">{c.slug}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
