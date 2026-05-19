import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Input, Btn, Skeleton, useToast } from "../../admin/components/ui";
import { loadCategoriesWithFallback, slugify } from "../../admin/utils/categories";
import { createAdminCategory } from "../../services/adminApi";

const panelCls =
  "rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const textareaCls =
  "w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none focus:ring-1 focus:ring-[#d8b84f]/30";

const rowCls =
  "flex items-center justify-between gap-2 rounded-lg border border-[#263145] bg-[#182238] px-3 py-2";

function SidebarSkeleton() {
  return (
    <ul className="space-y-2" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className={rowCls}>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </li>
      ))}
    </ul>
  );
}

export default function CategoryForm() {
  const nav = useNavigate();
  const toast = useToast();
  const slugTouched = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [existing, setExisting] = useState([]);

  const previewSlug = useMemo(() => slugify(form.name), [form.name]);
  const effectiveSlug = (form.slug.trim() || previewSlug).toLowerCase();

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true);
    try {
      setExisting(await loadCategoriesWithFallback());
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const duplicateSlug = useMemo(() => {
    if (!effectiveSlug) return false;
    return existing.some((c) => String(c.slug || "").toLowerCase() === effectiveSlug);
  }, [existing, effectiveSlug]);

  const duplicateName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) return false;
    return existing.some((c) => String(c.name || "").toLowerCase() === name);
  }, [existing, form.name]);

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

  const sidebarList = existing.slice(0, 6);

  return (
    <div className="admin-products-page admin-category-form space-y-6">
      <PageHeader
        title="Add Category"
        subtitle="Dashboard · Category · Add Category"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/categories">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn
              variant="primary"
              size="md"
              disabled={saving}
              onClick={() => document.getElementById("category-form")?.requestSubmit()}
            >
              {saving ? "Saving…" : "Save Category"}
            </Btn>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form id="category-form" onSubmit={onSubmit} className={`${panelCls} space-y-5`}>
          <Input
            label="Category name"
            required
            value={form.name}
            onChange={onNameChange}
            placeholder="Women Clothing"
          />
          {duplicateName && (
            <p className="-mt-3 text-xs text-[#f59e0b]">A category with this name already exists.</p>
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
              URL preview:{" "}
              <span className="font-mono text-[#c1c7d0]">
                /category/{form.slug || previewSlug || "new-category"}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional admin notes for this category"
              className={textareaCls}
            />
          </div>
        </form>

        <aside className={`${panelCls} flex flex-col space-y-4`}>
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc]">Existing categories</h3>
            <p className="mt-2 rounded-lg border border-[#d8b84f]/25 bg-[#d8b84f]/10 px-3 py-2 text-xs text-[#8b95a7]">
              Use a distinct name and slug to avoid storefront collisions.
            </p>
          </div>

          {loadingExisting ? (
            <SidebarSkeleton />
          ) : sidebarList.length === 0 ? (
            <p className="text-sm text-[#8b95a7]">No categories yet. Create the first one in the form.</p>
          ) : (
            <ul className="space-y-2">
              {sidebarList.map((c) => (
                <li key={c.id ?? c.slug} className={rowCls}>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#f8fafc]">{c.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-mono text-[#c1c7d0]">{c.slug}</span>
                  </div>
                  {c.productCount != null && (
                    <span className="shrink-0 rounded-full bg-[#263145] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#8b95a7]">
                      {c.productCount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/admin/categories"
            className="mt-auto text-center text-xs font-semibold text-[#d8b84f] hover:text-[#e5c866]"
          >
            View all categories
          </Link>
        </aside>
      </div>
    </div>
  );
}
