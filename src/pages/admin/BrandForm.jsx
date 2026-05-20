import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Input, Select, Btn, Skeleton, ProductThumbnail, useToast } from "../../admin/components/ui";
import { addBrand, loadBrandsWithFallback, slugify } from "../../admin/utils/brands";

const panelCls =
  "rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const textareaCls =
  "w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2.5 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none focus:ring-1 focus:ring-[#d8b84f]/30";

const rowCls =
  "flex items-center justify-between gap-2 rounded-lg border border-[#263145] bg-[#182238] px-3 py-2";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

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

export default function BrandForm() {
  const nav = useNavigate();
  const toast = useToast();
  const slugTouched = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    description: "",
    status: "active",
  });
  const [existing, setExisting] = useState([]);

  const previewSlug = useMemo(() => slugify(form.name), [form.name]);
  const effectiveSlug = (form.slug.trim() || previewSlug).toLowerCase();

  const loadExisting = useCallback(async () => {
    setLoadingExisting(true);
    try {
      setExisting(await loadBrandsWithFallback());
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const duplicateSlug = useMemo(() => {
    if (!effectiveSlug) return false;
    return existing.some((b) => String(b.slug || "").toLowerCase() === effectiveSlug);
  }, [existing, effectiveSlug]);

  const duplicateName = useMemo(() => {
    const name = form.name.trim().toLowerCase();
    if (!name) return false;
    return existing.some((b) => String(b.name || "").toLowerCase() === name);
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
      await new Promise((r) => setTimeout(r, 400));
      addBrand({
        name,
        slug: (form.slug.trim() || previewSlug).slice(0, 160),
        logoUrl: form.logoUrl.trim() || "",
        description: form.description.trim() || "",
        status: form.status,
      });
      toast?.("Brand created");
      nav("/admin/brands");
    } finally {
      setSaving(false);
    }
  };

  const sidebarList = existing.slice(0, 6);
  const saveBlocked = duplicateName || duplicateSlug;
  const logoPreview = form.logoUrl.trim();

  return (
    <div className="admin-products-page admin-brand-form space-y-6">
      <PageHeader
        title="Add Brand"
        subtitle="Dashboard · Catalog · Brands · Add Brand"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/brands">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn variant="primary" size="md" type="submit" form="brand-form" disabled={saving || saveBlocked}>
              {saving ? "Saving…" : "Save brand"}
            </Btn>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form id="brand-form" onSubmit={onSubmit} className={`${panelCls} flex flex-col space-y-5`}>
          <Input
            label="Brand name"
            required
            value={form.name}
            onChange={onNameChange}
            placeholder="SoundMax"
          />
          {duplicateName && (
            <p className="-mt-3 text-xs text-[#f59e0b]">A brand with this name already exists.</p>
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
              Brand page:{" "}
              <span className="font-mono text-[#c1c7d0]">/brand/{form.slug || previewSlug || "new-brand"}</span>
            </p>
          </div>

          <div className="space-y-3">
            <Input
              label="Logo URL (optional)"
              value={form.logoUrl}
              onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
              placeholder="https://…"
            />
            {logoPreview && (
              <div className="flex items-center gap-3 rounded-lg border border-[#263145] bg-[#182238] p-3">
                <ProductThumbnail src={logoPreview} alt={form.name || "Logo preview"} size={48} />
                <p className="text-xs text-[#8b95a7]">Logo preview</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              Description
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional notes for this brand"
              className={textareaCls}
            />
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            options={STATUS_OPTIONS}
          />

          <div className="flex flex-col gap-3 border-t border-[#263145] pt-5 sm:flex-row sm:flex-wrap">
            <Link to="/admin/brands">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn variant="primary" size="md" type="submit" disabled={saving || saveBlocked}>
              {saving ? "Saving…" : "Save brand"}
            </Btn>
          </div>
        </form>

        <aside className={`${panelCls} flex flex-col space-y-4 lg:sticky lg:top-24 lg:self-start`}>
          <div>
            <h3 className="text-sm font-semibold text-[#f8fafc]">Existing brands</h3>
            <p className="mt-2 rounded-lg border border-[#d8b84f]/25 bg-[#d8b84f]/10 px-3 py-2 text-xs text-[#8b95a7]">
              Use a distinct name and slug so storefront brand pages stay unique.
            </p>
          </div>

          {loadingExisting ? (
            <SidebarSkeleton />
          ) : sidebarList.length === 0 ? (
            <p className="text-sm text-[#8b95a7]">No brands yet. Create the first one in the form.</p>
          ) : (
            <ul className="space-y-2">
              {sidebarList.map((b) => (
                <li key={b.id ?? b.slug} className={rowCls}>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#f8fafc]">{b.name}</span>
                    <span className="mt-0.5 block truncate font-mono text-xs text-[#c1c7d0]">{b.slug}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/admin/brands"
            className="mt-auto text-center text-xs font-semibold text-[#d8b84f] hover:text-[#e5c866]"
          >
            View all brands
          </Link>
        </aside>
      </div>
    </div>
  );
}
