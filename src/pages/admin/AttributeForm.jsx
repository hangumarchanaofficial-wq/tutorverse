import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Input, Select, Btn, useToast } from "../../admin/components/ui";
import { slugify } from "../../admin/utils/categories";
import { MOCK_ATTRIBUTES, SHOP_CATEGORY_LABEL } from "../../admin/data/mockAttributes";

const panelCls =
  "rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const textareaCls =
  "w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none focus:ring-1 focus:ring-[#d8b84f]/30";

const rowCls =
  "flex items-center justify-between gap-2 rounded-lg border border-[#263145] bg-[#182238] px-3 py-2";

const TYPE_OPTIONS = [
  { value: "select", label: "Select" },
  { value: "swatch", label: "Swatch (color)" },
  { value: "text", label: "Text" },
];

const SHOP_CATEGORY_OPTIONS = Object.entries(SHOP_CATEGORY_LABEL)
  .filter(([key]) => key !== "all")
  .map(([value, label]) => ({ value, label }));

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AttributeForm() {
  const nav = useNavigate();
  const toast = useToast();
  const slugTouched = useRef(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "select",
    values: "",
    shopCategory: "fashion",
    status: "active",
  });

  const existing = MOCK_ATTRIBUTES;
  const previewSlug = useMemo(() => slugify(form.name), [form.name]);
  const effectiveSlug = (form.slug.trim() || previewSlug).toLowerCase();

  const duplicateName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) return false;
    return existing.some((a) => a.category.toLowerCase() === name);
  }, [existing, form.name]);

  const duplicateSlug = useMemo(() => {
    if (!effectiveSlug) return false;
    return existing.some((a) => slugify(a.category).toLowerCase() === effectiveSlug);
  }, [existing, effectiveSlug]);

  const onNameChange = (e) => {
    const name = e.target.value;
    setForm((p) => ({
      ...p,
      name,
      slug: slugTouched.current ? p.slug : slugify(name),
    }));
  };

  const onSlugChange = (e) => {
    slugTouched.current = true;
    setForm((p) => ({ ...p, slug: e.target.value }));
  };

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

  const sidebarList = existing.slice(0, 6);

  return (
    <div className="admin-products-page admin-attribute-form space-y-6">
      <div className="admin-attribute-form__toolbar sticky top-0 z-20 -mx-4 border-b border-[#263145] bg-[#121b2e]/95 px-4 py-4 backdrop-blur-sm lg:-mx-6 lg:px-6">
        <PageHeader
          title="Add Attributes"
          subtitle="Dashboard · Attributes · Add Attributes"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/admin/attributes">
                <Btn variant="secondary" size="md">
                  Cancel
                </Btn>
              </Link>
              <Btn variant="primary" size="md" type="submit" form="attribute-form" disabled={saving}>
                {saving ? "Saving…" : "Save attribute"}
              </Btn>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form id="attribute-form" onSubmit={onSubmit} className={`${panelCls} flex flex-col space-y-5`}>
          <Input
            label="Attribute name"
            required
            value={form.name}
            onChange={onNameChange}
            placeholder="e.g. Sleeve length"
          />
          {duplicateName && (
            <p className="-mt-3 text-xs text-[#f59e0b]">An attribute with this name already exists.</p>
          )}

          <div>
            <Input
              label="Slug"
              value={form.slug}
              onChange={onSlugChange}
              placeholder={previewSlug || "auto-generated"}
            />
            {duplicateSlug && (
              <p className="mt-1 text-xs text-[#f59e0b]">
                This slug is already in use. Choose a different slug to avoid collisions.
              </p>
            )}
            <p className="mt-2 text-xs text-[#8b95a7]">
              Attribute key:{" "}
              <span className="font-mono text-[#c1c7d0]">
                {form.slug || previewSlug || "new-attribute"}
              </span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Shop category"
              value={form.shopCategory}
              onChange={(e) => setForm((p) => ({ ...p, shopCategory: e.target.value }))}
              options={SHOP_CATEGORY_OPTIONS}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              options={STATUS_OPTIONS}
            />
          </div>

          <Select
            label="Input type"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            options={TYPE_OPTIONS}
          />

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              Values (optional)
            </label>
            <textarea
              rows={4}
              value={form.values}
              onChange={(e) => setForm((p) => ({ ...p, values: e.target.value }))}
              placeholder="Comma-separated, e.g. S, M, L, XL"
              className={textareaCls}
            />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-[#263145] pt-5">
            <Link to="/admin/attributes">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn variant="primary" size="md" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save attribute"}
            </Btn>
          </div>
        </form>

        <aside className={`${panelCls} flex flex-col space-y-4 lg:sticky lg:top-24 lg:self-start`}>
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc]">Existing attributes</h3>
            <p className="mt-2 rounded-lg border border-[#d8b84f]/25 bg-[#d8b84f]/10 px-3 py-2 text-xs text-[#8b95a7]">
              Reuse distinct names and slugs so product variants stay easy to filter.
            </p>
          </div>

          {sidebarList.length === 0 ? (
            <p className="text-sm text-[#8b95a7]">No attributes yet. Create the first one in the form.</p>
          ) : (
            <ul className="space-y-2">
              {sidebarList.map((a) => (
                <li key={a.id} className={rowCls}>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#f8fafc]">{a.category}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#c1c7d0]">{a.value}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/admin/attributes"
            className="mt-auto text-center text-xs font-semibold text-[#d8b84f] hover:text-[#e5c866]"
          >
            View all attributes
          </Link>
        </aside>
      </div>
    </div>
  );
}
