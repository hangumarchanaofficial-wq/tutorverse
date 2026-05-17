import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Btn, useToast } from "../../admin/components/ui";
import { products as mockProducts, categories as mockCategories } from "../../admin/data/mockData";
import { createAdminProduct, patchAdminProduct } from "../../services/adminApi";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const isoDateOnly = (iso) => {
  if (!iso) return "";
  const s = String(iso);
  return s.length >= 10 ? s.slice(0, 10) : "";
};

const emptyForm = {
  name: "", slug: "", sku: "", brand: "", categoryId: "", categoryIds: [],
  description: "", shortDescription: "",
  price: "", salePrice: "", costPrice: "",
  stock: "0", lowStockThreshold: "5",
  mainImage: "", galleryImages: "",
  schedule: "",
  size: "M",
  color: "Orange",
  tags: "",
  seoTitle: "", metaDescription: "", keywords: "",
  isActive: true, isFeatured: false, isBestSeller: false, isNewArrival: false,
};

function fromProduct(p) {
  const ids = p.categoryId ? [p.categoryId] : [];
  return {
    name: p.name || "", slug: p.slug || "", sku: p.sku || "",
    brand: p.brand || "", categoryId: p.categoryId || "", categoryIds: ids,
    description: p.description || "", shortDescription: p.shortDescription || "",
    price: p.price != null ? String(p.price) : "",
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    costPrice: p.costPrice != null ? String(p.costPrice) : "",
    stock: String(p.stock ?? 0), lowStockThreshold: String(p.lowStockThreshold ?? 5),
    mainImage: p.images?.[0] || "",
    galleryImages: (p.images || []).slice(1).join("\n"),
    schedule: isoDateOnly(p.updatedAt || p.createdAt),
    size: "M",
    color: "Orange",
    tags: p.keywords || "",
    seoTitle: p.seoTitle || "", metaDescription: p.metaDescription || "", keywords: p.keywords || "",
    isActive: !!p.isActive, isFeatured: !!p.isFeatured,
    isBestSeller: !!p.isBestSeller, isNewArrival: !!p.isNewArrival,
  };
}

const inputCls =
  "h-11 w-full rounded-lg border border-[#252a33] bg-[#161a20] px-3 text-sm text-[#f8fafc] placeholder-[#7f8795] outline-none focus:border-[#fe7a2f]";
const tinyHintCls = "mt-1 text-[10px] text-[#8b95a7]";
const colorOptions = [
  { name: "Orange", value: "#ff7a2f" },
  { name: "Blue", value: "#2286f7" },
  { name: "Yellow", value: "#f6c847" },
  { name: "White", value: "#f3f4f6" },
];
const sizeOptions = ["S", "M", "L", "XL"];

const FALLBACK_PREVIEW_IMGS = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop&auto=format",
];

function PreviewImg({ src, alt, idx = 0, className }) {
  const [url, setUrl] = useState(src || FALLBACK_PREVIEW_IMGS[idx % FALLBACK_PREVIEW_IMGS.length]);
  useEffect(() => {
    setUrl(src || FALLBACK_PREVIEW_IMGS[idx % FALLBACK_PREVIEW_IMGS.length]);
  }, [src, idx]);
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setUrl(FALLBACK_PREVIEW_IMGS[idx % FALLBACK_PREVIEW_IMGS.length])}
    />
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-[#f8fafc]">
      {children}
      {required && <span className="text-[#fe7a2f]">*</span>}
    </label>
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
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [fallbackStock, setFallbackStock] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    const product = mockProducts.find((p) => p.id === id);
    if (product) {
      setForm(fromProduct(product));
      setFallbackStock(Number(product.stock) || 0);
    }
    try {
      window.localStorage.setItem("admin-last-product-edit", id);
    } catch {
      /* ignore */
    }
  }, [id, isEdit]);

  useEffect(
    () => () => {
      galleryFiles.forEach((item) => URL.revokeObjectURL(item.url));
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
      return {
        ...prev,
        categoryIds: nextIds,
        categoryId: nextIds[0] || "",
      };
    });
  };

  const galleryList = form.galleryImages.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  const appendFiles = useCallback((files) => {
    const arr = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setGalleryFiles((prev) => {
      const next = [...prev, ...arr.map((f) => ({ file: f, url: URL.createObjectURL(f) }))];
      return next;
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryIds.length && !form.categoryId) {
      toast?.("Add at least one category", "error");
      return;
    }
    setSaving(true);
    const parsedStock = parseInt(String(form.stock).trim(), 10);
    const stockVal = Number.isFinite(parsedStock) ? parsedStock : fallbackStock;

    const primaryCategory = form.categoryIds[0] || form.categoryId;
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
      images: [form.mainImage.trim(), ...galleryList].filter(Boolean),
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

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">
          {isEdit ? "Edit Product" : "Add Product"}
        </h1>
        <p className="text-xs text-[#98a2b3]">
          Dashboard &gt; Product &gt; {isEdit ? "Edit Product" : "Add Product"}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-2xl border border-[#1f232b] bg-[#06070a] p-4">
          <p className="mb-2 text-sm font-semibold text-[#f8fafc]">Upload Images</p>
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
            className={`flex h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-[#111318] text-center transition-colors ${
              dragOver ? "border-[#fe7a2f] bg-[#fe7a2f]/5" : "border-[#fe7a2f]/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" className="mb-2 h-8 w-8 text-[#fe7a2f]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 16.5A3.5 3.5 0 0 0 17 10h-1a6 6 0 1 0-11 3.2" />
              <path d="M12 12v8m0-8 3 3m-3-3-3 3" />
            </svg>
            <p className="text-sm text-[#aab2c1]">
              Drop your images here or <span className="text-[#fe7a2f]">select click to browse</span>
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
            <div className="mt-4 flex flex-wrap gap-3">
              {galleryFiles.map((item, i) => (
                <img key={`local-${i}`} src={item.url} alt="" className="h-28 w-28 rounded-xl border border-[#242933] object-cover" />
              ))}
              {form.mainImage && (
                <PreviewImg src={form.mainImage} alt="" idx={0} className="h-28 w-28 rounded-xl border border-[#242933] object-cover" />
              )}
              {galleryList.slice(0, 6).map((url, i) => (
                <PreviewImg key={`remote-${i}`} src={url} alt="" idx={i + 1} className="h-28 w-28 rounded-xl border border-[#242933] object-cover" />
              ))}
            </div>
          )}
          <p className={tinyHintCls}>
            You need to add at least 4 images. Pay attention to the quality of the pictures you add, comply with the background color
            standards. Pictures must be in certain dimensions. Notice that the product shows all the details.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1f232b] bg-[#06070a] p-4">
          <div className="space-y-4">
            <div>
              <FieldLabel required>Product title</FieldLabel>
              <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Enter title" />
              <p className={tinyHintCls}>Do not exceed 20 characters when entering the product name.</p>
            </div>

            <div>
              <FieldLabel required>Category</FieldLabel>
              <div className="min-h-[2.75rem] rounded-lg border border-[#252a33] bg-[#161a20] px-2 py-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {form.categoryIds.map((cid) => {
                    const c = categoryById[cid];
                    if (!c) return null;
                    return (
                      <span
                        key={cid}
                        className="inline-flex items-center gap-1 rounded-md border border-[#fe7a2f]/60 bg-[#fe7a2f]/10 px-2 py-0.5 text-xs font-medium text-[#fe7a2f]"
                      >
                        {c.name}
                        <button type="button" className="text-[#fe7a2f] hover:text-white" onClick={() => removeCategoryChip(cid)} aria-label={`Remove ${c.name}`}>
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
              <select className={`${inputCls} mt-2`} defaultValue="" onChange={addCategoryChip}>
                <option value="">Add category…</option>
                {mockCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel required>Price</FieldLabel>
                <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-[#252a33] bg-[#161a20] focus-within:border-[#fe7a2f]">
                  <span className="flex items-center border-r border-[#252a33] px-3 text-sm text-[#98a2b3]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={set("price")}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#f8fafc] outline-none"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Sale Price</FieldLabel>
                <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-[#252a33] bg-[#161a20] focus-within:border-[#fe7a2f]">
                  <span className="flex items-center border-r border-[#252a33] px-3 text-sm text-[#98a2b3]">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salePrice}
                    onChange={set("salePrice")}
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#f8fafc] outline-none"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Schedule</FieldLabel>
                <input type="date" value={form.schedule} onChange={set("schedule")} className={inputCls} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel required>Brand</FieldLabel>
                <input value={form.brand} onChange={set("brand")} className={inputCls} placeholder="Choose brand" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#f8fafc]">Color: {form.color}</label>
                <div className="flex items-center gap-2 pt-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, color: c.name }))}
                      className={`h-6 w-6 rounded-full border-2 ${form.color === c.name ? "border-white" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#f8fafc]">Size: {form.size}</label>
                <div className="flex items-center gap-2 pt-1">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, size: s }))}
                      className={`h-9 w-9 rounded-lg text-xs font-semibold transition ${
                        form.size === s ? "bg-[#fe7a2f] text-white" : "bg-[#2a3038] text-[#e5e7eb] hover:bg-[#363d47]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <FieldLabel>SKU</FieldLabel>
                <input value={form.sku} onChange={set("sku")} className={inputCls} placeholder="Enter SKU" />
              </div>
              <div>
                <FieldLabel required>Stock</FieldLabel>
                <input value={form.stock} onChange={set("stock")} className={inputCls} placeholder="e.g. 120 or Instock" />
              </div>
              <div>
                <FieldLabel>Tags</FieldLabel>
                <input value={form.tags} onChange={set("tags")} className={inputCls} placeholder="Enter a tag" />
              </div>
            </div>

            <div>
              <FieldLabel required>Description</FieldLabel>
              <textarea
                rows={6}
                value={form.description}
                onChange={set("description")}
                className={`${inputCls} h-auto py-3`}
                placeholder="Short description about product"
              />
              <p className={tinyHintCls}>Do not exceed 1000 characters when entering the product description.</p>
            </div>
          </div>
        </div>

        {discountPct != null && (
          <div className="rounded-xl border border-[#2a3038] bg-[#101319] px-4 py-2 text-sm text-[#f8fafc]">
            Auto discount: <span className="font-semibold text-[#fe7a2f]">{discountPct}%</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Btn
            variant="primary"
            type="submit"
            size="md"
            disabled={saving}
            className="!h-12 !min-w-[180px] !rounded-xl !bg-[#fe7a2f] !px-8 !text-sm !font-semibold hover:!bg-[#f97316]"
          >
            {saving ? "Saving…" : isEdit ? "Save & Publish" : "Add product"}
          </Btn>
          <Link to="/admin/products">
            <button
              type="button"
              className="h-12 min-w-[180px] rounded-xl border border-[#fe7a2f]/60 bg-transparent px-8 text-sm font-semibold text-[#fe7a2f] transition hover:bg-[#fe7a2f]/10"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
