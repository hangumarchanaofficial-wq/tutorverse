import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, UploadCloud, X } from "lucide-react";
import { PageHeader, Input, Select, Btn, Skeleton, useToast } from "../../admin/components/ui";
import { products as mockProducts, categories as mockCategories } from "../../admin/data/mockData";
import { createAdminProduct, fetchAdminProducts, patchAdminProduct } from "../../services/adminApi";

const MIN_IMAGES_RECOMMENDED = 4;

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const isoDateOnly = (iso) => {
  if (!iso) return "";
  const s = String(iso);
  return s.length >= 10 ? s.slice(0, 10) : "";
};

const emptyForm = {
  name: "",
  slug: "",
  sku: "",
  brand: "",
  categoryId: "",
  categoryIds: [],
  description: "",
  shortDescription: "",
  price: "",
  salePrice: "",
  costPrice: "",
  stock: "0",
  lowStockThreshold: "5",
  mainImage: "",
  galleryImages: "",
  schedule: "",
  size: "M",
  color: "Orange",
  tags: "",
  seoTitle: "",
  metaDescription: "",
  keywords: "",
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
};

const textareaCls =
  "w-full rounded-lg border border-[#263145] bg-[#182238] px-3 py-2 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none focus:ring-1 focus:ring-[#d8b84f]/30";
const tinyHintCls = "mt-1 text-[11px] text-[#8b95a7]";
const panelCls = "admin-product-form__panel rounded-xl border border-[#263145] bg-[#121b2e] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

const colorOptions = [
  { name: "Orange", value: "#d8b84f" },
  { name: "Blue", value: "#60a5fa" },
  { name: "Yellow", value: "#f59e0b" },
  { name: "White", value: "#f3f4f6" },
];
const sizeOptions = ["S", "M", "L", "XL"];

function normalizeApiProduct(p) {
  if (!p) return null;
  return {
    ...p,
    name: p.name || p.title || "Untitled Product",
    stock: p.stock ?? p.stock_qty ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? p.low_stock_threshold ?? 10,
    images: Array.isArray(p.images) ? p.images : p.image ? [p.image] : [],
  };
}

function fromProduct(p) {
  const normalized = normalizeApiProduct(p) || p;
  const ids = normalized.categoryId ? [normalized.categoryId] : [];
  return {
    name: normalized.name || "",
    slug: normalized.slug || "",
    sku: normalized.sku || "",
    brand: normalized.brand || "",
    categoryId: normalized.categoryId || "",
    categoryIds: ids,
    description: normalized.description || "",
    shortDescription: normalized.shortDescription || "",
    price: normalized.price != null ? String(normalized.price) : "",
    salePrice: normalized.salePrice != null ? String(normalized.salePrice) : "",
    costPrice: normalized.costPrice != null ? String(normalized.costPrice) : "",
    stock: String(normalized.stock ?? 0),
    lowStockThreshold: String(normalized.lowStockThreshold ?? 5),
    mainImage: normalized.images?.[0] || "",
    galleryImages: (normalized.images || []).slice(1).join("\n"),
    schedule: isoDateOnly(normalized.updatedAt || normalized.createdAt),
    size: "M",
    color: "Orange",
    tags: normalized.keywords || "",
    seoTitle: normalized.seoTitle || "",
    metaDescription: normalized.metaDescription || "",
    keywords: normalized.keywords || "",
    isActive: normalized.isActive !== false,
    isFeatured: !!normalized.isFeatured,
    isBestSeller: !!normalized.isBestSeller,
    isNewArrival: !!normalized.isNewArrival,
  };
}

function LkrField({ label, required, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
        {label}
        {required && <span className="text-[#d8b84f]">*</span>}
      </label>
      <div className="flex h-10 items-stretch overflow-hidden rounded-lg border border-[#263145] bg-[#182238] focus-within:border-[#d8b84f]/60 focus-within:ring-1 focus-within:ring-[#d8b84f]/30">
        <span className="flex items-center border-r border-[#263145] px-3 text-xs font-semibold text-[#8b95a7]">
          LKR
        </span>
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#f8fafc] outline-none"
        />
      </div>
    </div>
  );
}

function ThumbnailTile({ src, isMain, onSetMain, onRemove, label }) {
  return (
    <div className="relative">
      <img src={src} alt="" className="h-24 w-24 rounded-lg border border-[#263145] object-cover" />
      {isMain && (
        <span className="absolute left-1 top-1 rounded bg-[#d8b84f] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#070b14]">
          Main
        </span>
      )}
      <div className="absolute right-1 top-1 flex gap-0.5">
        {onSetMain && !isMain && (
          <button
            type="button"
            title="Set as main image"
            onClick={onSetMain}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#263145] bg-[#0f1726]/90 text-[#d8b84f] hover:bg-[#182238]"
          >
            <Star className="h-3 w-3" strokeWidth={2.2} />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            title={`Remove ${label || "image"}`}
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[#263145] bg-[#0f1726]/90 text-[#f87171] hover:bg-[#182238]"
          >
            <X className="h-3 w-3" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [fallbackStock, setFallbackStock] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    let on = true;
    setLoading(true);
    fetchAdminProducts({ limit: 500 })
      .then((res) => {
        if (!on) return;
        const items = res?.items || [];
        const product =
          items.map(normalizeApiProduct).find((p) => String(p.id) === String(id)) ||
          mockProducts.find((p) => String(p.id) === String(id));
        if (product) {
          setForm(fromProduct(product));
          setFallbackStock(Number(product.stock) || 0);
        }
      })
      .catch(() => {
        if (!on) return;
        const product = mockProducts.find((p) => String(p.id) === String(id));
        if (product) {
          setForm(fromProduct(product));
          setFallbackStock(Number(product.stock) || 0);
        }
      })
      .finally(() => {
        if (on) setLoading(false);
      });
    try {
      window.localStorage.setItem("admin-last-product-edit", id);
    } catch {
      /* ignore */
    }
    return () => {
      on = false;
    };
  }, [id, isEdit]);

  useEffect(
    () => () => {
      galleryFiles.forEach((item) => {
        if (item.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);
      });
    },
    [galleryFiles]
  );

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "name" && !isEdit) next.slug = slugify(String(val));
      return next;
    });
  };

  const discountPct = useMemo(() => {
    const p = Number(form.price);
    const s = Number(form.salePrice);
    if (!p || !s || s >= p) return null;
    return Math.round(((p - s) / p) * 100);
  }, [form.price, form.salePrice]);

  const categoryById = useMemo(
    () => Object.fromEntries(mockCategories.map((c) => [c.id, c])),
    []
  );

  const galleryList = useMemo(
    () => form.galleryImages.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    [form.galleryImages]
  );

  const imageCount = useMemo(() => {
    const hasMain = !!form.mainImage;
    return (hasMain ? 1 : 0) + galleryFiles.length + galleryList.length;
  }, [form.mainImage, galleryFiles.length, galleryList.length]);

  const addCategoryChip = (e) => {
    const cid = e.target.value;
    if (!cid) return;
    setForm((prev) => {
      if (prev.categoryIds.includes(cid)) return prev;
      const nextIds = [...prev.categoryIds, cid];
      return { ...prev, categoryIds: nextIds, categoryId: nextIds[0] || prev.categoryId };
    });
    e.target.value = "";
  };

  const removeCategoryChip = (cid) => {
    setForm((prev) => {
      const nextIds = prev.categoryIds.filter((x) => x !== cid);
      return { ...prev, categoryIds: nextIds, categoryId: nextIds[0] || "" };
    });
  };

  const appendFiles = useCallback((files) => {
    const arr = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newItems = arr.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setGalleryFiles((prev) => [...prev, ...newItems]);
    setForm((prev) => {
      if (prev.mainImage) return prev;
      return { ...prev, mainImage: newItems[0].url };
    });
  }, []);

  const removeLocalFile = (index) => {
    setGalleryFiles((prev) => {
      const item = prev[index];
      if (item?.url?.startsWith("blob:")) URL.revokeObjectURL(item.url);
      const next = prev.filter((_, i) => i !== index);
      setForm((f) => {
        if (f.mainImage !== item?.url) return f;
        const fallback = next[0]?.url || galleryList[0] || "";
        return { ...f, mainImage: fallback };
      });
      return next;
    });
  };

  const removeRemoteUrl = (url) => {
    setForm((prev) => {
      const lines = prev.galleryImages
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s && s !== url);
      const nextMain = prev.mainImage === url ? lines[0] || galleryFiles[0]?.url || "" : prev.mainImage;
      return {
        ...prev,
        mainImage: nextMain,
        galleryImages: lines.slice(prev.mainImage === url ? 1 : 0).join("\n"),
      };
    });
  };

  const setAsMain = (url) => {
    setForm((prev) => {
      const others = [
        ...galleryList.filter((u) => u !== url),
        ...(prev.mainImage && prev.mainImage !== url ? [prev.mainImage] : []),
      ];
      return { ...prev, mainImage: url, galleryImages: others.join("\n") };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryIds.length && !form.categoryId) {
      toast?.("Add at least one category", "error");
      return;
    }
    if (imageCount < 1) {
      toast?.("Add at least one product image", "error");
      return;
    }
    if (imageCount < MIN_IMAGES_RECOMMENDED) {
      toast?.(`Tip: add ${MIN_IMAGES_RECOMMENDED} or more images for best listing quality`, "warning");
    }

    setSaving(true);
    const parsedStock = parseInt(String(form.stock).trim(), 10);
    const stockVal = Number.isFinite(parsedStock) ? parsedStock : fallbackStock;
    const primaryCategory = form.categoryIds[0] || form.categoryId;

    const imageUrls = [
      form.mainImage.trim(),
      ...galleryList.filter((u) => u !== form.mainImage.trim()),
    ].filter((u) => u && !u.startsWith("blob:"));

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      sku: form.sku.trim(),
      brand: form.brand.trim(),
      categoryId: primaryCategory,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price: Number(form.price) || 0,
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      stock: stockVal,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      images: imageUrls.length ? imageUrls : [form.mainImage].filter(Boolean),
      seoTitle: form.seoTitle.trim(),
      metaDescription: form.metaDescription.trim(),
      keywords: [form.keywords, form.tags].filter(Boolean).join(", ").trim(),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
    };

    try {
      if (isEdit) {
        await patchAdminProduct(id, payload);
        toast?.("Product saved and published");
      } else {
        await createAdminProduct(payload);
        toast?.("Product created");
      }
      navigate("/admin/products");
    } catch (err) {
      toast?.(err.message || "Save failed — check console", "error");
    } finally {
      setSaving(false);
    }
  };

  const onPickImages = (e) => {
    appendFiles(e.target.files);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="admin-products-page admin-product-form space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products-page admin-product-form space-y-6">
      <PageHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        subtitle="Create a listing with images, pricing, and inventory"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/products">
              <Btn variant="secondary" size="md">
                Cancel
              </Btn>
            </Link>
            <Btn variant="primary" size="md" disabled={saving} onClick={() => document.getElementById("product-form-submit")?.click()}>
              {saving ? "Saving…" : isEdit ? "Save & publish" : "Add product"}
            </Btn>
          </div>
        }
      />

      <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className={`${panelCls} lg:sticky lg:top-4 lg:self-start`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#f8fafc]">Upload images</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                imageCount >= MIN_IMAGES_RECOMMENDED
                  ? "bg-[#34d399]/15 text-[#34d399]"
                  : "bg-[#f59e0b]/15 text-[#f59e0b]"
              }`}
            >
              {imageCount} / {MIN_IMAGES_RECOMMENDED} min
            </span>
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              appendFiles(e.dataTransfer.files);
            }}
            className={`admin-product-form__dropzone flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors ${
              dragOver
                ? "border-[#d8b84f] bg-[#d8b84f]/10"
                : "border-[#d8b84f]/40 bg-[#0f1726]/50 hover:border-[#d8b84f]/60"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mb-2 h-9 w-9 text-[#d8b84f]" strokeWidth={1.8} />
            <p className="px-4 text-sm text-[#8b95a7]">
              Drop images here, or{" "}
              <span className="font-semibold text-[#d8b84f]">click to browse</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={onPickImages}
            />
          </div>

          {(galleryFiles.length > 0 || form.mainImage || galleryList.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.mainImage && !galleryFiles.some((g) => g.url === form.mainImage) && (
                <ThumbnailTile
                  src={form.mainImage}
                  isMain
                  onRemove={() => setForm((prev) => ({ ...prev, mainImage: galleryList[0] || "" }))}
                  label="main"
                />
              )}
              {galleryFiles.map((item, i) => (
                <ThumbnailTile
                  key={`local-${i}`}
                  src={item.url}
                  isMain={form.mainImage === item.url}
                  onSetMain={() => setAsMain(item.url)}
                  onRemove={() => removeLocalFile(i)}
                  label="upload"
                />
              ))}
              {galleryList.map((url, i) => (
                <ThumbnailTile
                  key={`remote-${url}`}
                  src={url}
                  isMain={form.mainImage === url}
                  onSetMain={() => setAsMain(url)}
                  onRemove={() => removeRemoteUrl(url)}
                  label="gallery"
                />
              ))}
            </div>
          )}

          <ul className={`mt-4 list-inside list-disc space-y-1 text-[11px] text-[#8b95a7] ${tinyHintCls}`}>
            <li>Use clear photos on a neutral background</li>
            <li>Square or 1:1 crops work best (min. 800×800px)</li>
            <li>Show the full product and important details</li>
            <li>Star an image to set it as the main listing photo</li>
          </ul>
        </div>

        <div className="space-y-5">
          <div className={panelCls}>
            <p className="mb-4 text-sm font-semibold text-[#f8fafc]">Product information</p>
            <div className="space-y-4">
              <div>
                <Input label="Product title" required value={form.name} onChange={set("name")} placeholder="Enter title" />
                <p className={tinyHintCls}>Keep the title clear and under 120 characters.</p>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Category <span className="text-[#d8b84f]">*</span>
                </label>
                <div className="min-h-[2.75rem] rounded-lg border border-[#263145] bg-[#182238] px-2 py-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {form.categoryIds.map((cid) => {
                      const c = categoryById[cid];
                      if (!c) return null;
                      return (
                        <span
                          key={cid}
                          className="inline-flex items-center gap-1 rounded-md border border-[#d8b84f]/40 bg-[#d8b84f]/10 px-2 py-0.5 text-xs font-medium text-[#d8b84f]"
                        >
                          {c.name}
                          <button
                            type="button"
                            className="text-[#d8b84f] hover:text-[#f8fafc]"
                            onClick={() => removeCategoryChip(cid)}
                            aria-label={`Remove ${c.name}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Select className="mt-2" value="" onChange={addCategoryChip} options={[{ value: "", label: "Add category…" }, ...mockCategories.map((c) => ({ value: c.id, label: c.name }))]} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <LkrField label="Price" required value={form.price} onChange={set("price")} placeholder="0" />
                <LkrField label="Sale price" value={form.salePrice} onChange={set("salePrice")} placeholder="Optional" />
              </div>

              {discountPct != null && (
                <div className="rounded-lg border border-[#d8b84f]/25 bg-[#d8b84f]/10 px-3 py-2 text-sm text-[#f8fafc]">
                  Auto discount: <span className="font-semibold text-[#d8b84f]">{discountPct}%</span>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Brand" value={form.brand} onChange={set("brand")} placeholder="Brand name" />
                <Input label="SKU" value={form.sku} onChange={set("sku")} placeholder="TWO-ELC-001" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Stock" required value={form.stock} onChange={set("stock")} placeholder="e.g. 120" />
                <Input
                  label="Low stock alert"
                  value={form.lowStockThreshold}
                  onChange={set("lowStockThreshold")}
                  placeholder="5"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                    Color: {form.color}
                  </label>
                  <div className="flex items-center gap-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, color: c.name }))}
                        className={`h-7 w-7 rounded-full border-2 transition ${
                          form.color === c.name ? "border-[#d8b84f] ring-2 ring-[#d8b84f]/30" : "border-[#263145]"
                        }`}
                        style={{ backgroundColor: c.value }}
                        aria-label={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                    Size: {form.size}
                  </label>
                  <div className="flex items-center gap-2">
                    {sizeOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, size: s }))}
                        className={`h-9 w-9 rounded-lg text-xs font-semibold transition ${
                          form.size === s
                            ? "bg-[#d8b84f] text-[#070b14]"
                            : "border border-[#263145] bg-[#182238] text-[#8b95a7] hover:text-[#f8fafc]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Input label="Tags" value={form.tags} onChange={set("tags")} placeholder="Comma-separated tags" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Description <span className="text-[#d8b84f]">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={set("description")}
                  className={textareaCls}
                  placeholder="Describe the product for customers"
                />
                <p className={tinyHintCls}>Up to 1000 characters recommended.</p>
              </div>

              <Input label="Main image URL (optional)" value={form.mainImage} onChange={set("mainImage")} placeholder="https://…" />
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                  Gallery URLs (one per line)
                </label>
                <textarea
                  rows={3}
                  value={form.galleryImages}
                  onChange={set("galleryImages")}
                  className={textareaCls}
                  placeholder="https://…"
                />
              </div>

              <Input label="Schedule" type="date" value={form.schedule} onChange={set("schedule")} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Btn variant="primary" type="submit" id="product-form-submit" size="md" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save & publish" : "Add product"}
            </Btn>
            <Link to="/admin/products">
              <Btn variant="secondary" type="button" size="md">
                Cancel
              </Btn>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
