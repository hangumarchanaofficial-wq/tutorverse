import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Bolt,
  Eye,
  Heart,
  HelpCircle,
  Minus,
  Plus,
  Share2,
  Star,
  Truck,
} from "lucide-react";
import { products as mockProducts, reviews as mockReviews, IMG } from "../../admin/data/mockData";

const ACCENT = "#fe7a2f";

function formatLKR(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `LKR ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const FALLBACK_GALLERY = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=1000&fit=crop&auto=format",
];

function PreviewImg({ src, alt, className, idx = 0 }) {
  const [url, setUrl] = useState(src || FALLBACK_GALLERY[idx % FALLBACK_GALLERY.length]);
  useEffect(() => {
    setUrl(src || FALLBACK_GALLERY[idx % FALLBACK_GALLERY.length]);
  }, [src, idx]);
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setUrl(FALLBACK_GALLERY[idx % FALLBACK_GALLERY.length])}
    />
  );
}

const EXTRA_IMAGES_BY_CATEGORY = {
  1: [IMG.headphones, IMG.fitness, IMG.speaker],
  2: [IMG.kurta, IMG.shirt, IMG.saree],
  3: [IMG.serum, IMG.hairOil],
  4: [IMG.baskets, IMG.teaSet],
  5: [IMG.bag, IMG.shirt],
};

function buildGallery(product) {
  const base = [...(product.images || [])].filter(Boolean);
  const extras = EXTRA_IMAGES_BY_CATEGORY[product.categoryId] || Object.values(IMG);
  for (const u of extras) {
    if (base.length >= 6) break;
    if (!base.includes(u)) base.push(u);
  }
  let padIdx = 0;
  while (base.length < 4) {
    base.push(FALLBACK_GALLERY[padIdx % FALLBACK_GALLERY.length]);
    padIdx += 1;
  }
  return base.slice(0, 6);
}

function useCountdown(endMs) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, endMs - Date.now());
  void tick;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

function StarRow({ value, count, showCount = true }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 text-amber-400" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rounded ? "fill-current" : "fill-none opacity-35"}`}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {showCount && count != null ? (
        <span className="text-sm text-[#98a2b3]">({count} reviews)</span>
      ) : null}
    </div>
  );
}

const COLOR_SWATCHES = [
  { name: "Orange", hex: "#ff7a2f" },
  { name: "Gray", hex: "#9ca3af" },
  { name: "Purple", hex: "#a855f7" },
];

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

function PaymentBadge({ label, bg }) {
  return (
    <span
      className="rounded px-2 py-1 text-[10px] font-bold tracking-wide text-white"
      style={{ background: bg }}
    >
      {label}
    </span>
  );
}

export default function ProductDetailAdmin() {
  const { id } = useParams();
  const product = useMemo(() => mockProducts.find((p) => p.id === id), [id]);
  const gallery = useMemo(() => (product ? buildGallery(product) : []), [product]);
  const [mainIdx, setMainIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[1]);
  const [selectedSize, setSelectedSize] = useState("L");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");

  const offerEndRef = useRef(Date.now() + 7 * 86400000 + 44 * 60000 + 54 * 1000);
  const countdown = useCountdown(offerEndRef.current);

  useEffect(() => {
    setMainIdx(0);
  }, [id]);

  const productReviews = useMemo(
    () => mockReviews.filter((r) => r.productId === id),
    [id]
  );

  if (!product) {
    return (
      <div className="admin-panel rounded-2xl border border-[#1f232b] bg-[#06070a] p-8 text-center text-[#98a2b3]">
        Product not found.
        <Link to="/admin/products" className="mt-4 block font-medium text-[#fe7a2f] hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const listPrice = product.price;
  const salePrice = product.salePrice;
  const activePrice = salePrice != null ? salePrice : listPrice;
  const discountPct =
    salePrice != null && listPrice > 0 ? Math.round((1 - salePrice / listPrice) * 100) : null;

  const stock = product.stock ?? 0;
  const stockCap = Math.max(stock + 150, 200);
  const soldPct = Math.min(92, Math.max(18, Math.round((1 - stock / stockCap) * 100)));
  const leftInStock = Math.max(stock, 0);

  const categoryUpper = (product.categoryName || "General").toUpperCase();
  const viewingNow = 18 + (product.id.charCodeAt(product.id.length - 1) % 12);
  const soldFlash = Math.min(48, 12 + (product.salesCount % 37));

  const vendorName = product.brand || "TWOWAY";
  const availability = stock > 0 ? "Instock" : "Out of stock";
  const categoryTags = [product.categoryName, "Premium", product.isNewArrival ? "New" : "Classic"].filter(
    Boolean
  );

  const longBlurb = `${product.description} This listing is optimized for discovery and conversion: clear materials story, care guidance, and policy transparency help shoppers decide with confidence.`;

  return (
    <div className="admin-product-detail space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#f8fafc] md:text-[34px]">
            Product Details
          </h1>
          <p className="mt-1 text-xs text-[#98a2b3]">
            <span className="text-[#8b95a7]">Dashboard</span>
            <span className="mx-1.5 text-[#3d4a63]">&gt;</span>
            <span className="text-[#8b95a7]">Product</span>
            <span className="mx-1.5 text-[#3d4a63]">&gt;</span>
            <span className="text-[#fe7a2f]">Product Details</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/admin/products/${product.id}/edit`}
            className="rounded-lg bg-[#fe7a2f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#f97316]"
          >
            Edit product
          </Link>
          <Link
            to="/admin/products"
            className="rounded-lg border border-[#2a303c] bg-[#0c0e12] px-4 py-2 text-sm font-medium text-[#e5e7eb] hover:border-[#fe7a2f]/40"
          >
            All products
          </Link>
        </div>
      </div>

      <div className="admin-panel overflow-hidden rounded-2xl border border-[#1f232b] bg-[#06070a] shadow-[0_24px_40px_rgba(0,0,0,0.45)]">
        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] lg:p-8">
          {/* Gallery */}
          <div className="flex gap-4">
            <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setMainIdx(i)}
                  className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border transition sm:h-20 sm:w-16 ${
                    mainIdx === i
                      ? "border-[#fe7a2f] ring-1 ring-[#fe7a2f]/40"
                      : "border-[#2a303c] hover:border-[#3d4a63]"
                  }`}
                >
                  <PreviewImg src={src} alt="" className="h-full w-full object-cover" idx={i} />
                </button>
              ))}
            </div>
            <div className="min-h-[320px] flex-1 overflow-hidden rounded-2xl border border-[#2a303c] bg-[#0a0b0f] lg:min-h-[520px]">
              <PreviewImg
                src={gallery[mainIdx]}
                alt={product.name}
                className="h-full w-full object-cover object-center"
                idx={mainIdx}
              />
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 space-y-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8b95a7]">{categoryUpper}</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#f8fafc] md:text-3xl">
              {product.name}
            </h2>
            <StarRow value={product.ratingAvg || 0} count={product.reviewCount || 0} />

            <div className="flex items-center gap-2 text-sm text-[#e5e7eb]">
              <Bolt className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
              <span>
                <span className="font-semibold text-[#f8fafc]">{soldFlash} sold</span>
                <span className="text-[#98a2b3]"> in the last 32 hours</span>
              </span>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold text-[#f8fafc]">{formatLKR(activePrice)}</span>
              {salePrice != null && (
                <span className="text-lg text-[#98a2b3] line-through">{formatLKR(listPrice)}</span>
              )}
              {discountPct != null && discountPct > 0 && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                  style={{ background: ACCENT }}
                >
                  -{discountPct}%
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-[#c1c7d0]">{product.description}</p>

            <div className="flex items-center gap-2 text-sm text-[#98a2b3]">
              <Eye className="h-4 w-4" />
              <span>
                <span className="font-medium text-[#e5e7eb]">{viewingNow} people</span> are viewing this right now
              </span>
            </div>

            <div className="rounded-xl border border-[#252a33] bg-[#08090b] p-4">
              <p className="text-sm font-medium text-[#f8fafc]">Hurry Up! Offer ends in:</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center font-mono text-sm sm:text-base">
                {[
                  ["Days", countdown.d],
                  ["Hours", countdown.h],
                  ["Mins", countdown.m],
                  ["Secs", countdown.s],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-[#0f1116] py-2">
                    <div className="text-lg font-semibold tabular-nums text-[#fe7a2f]">
                      {String(val).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#8b95a7]">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-[#1f232b]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${soldPct}%`, background: ACCENT }}
                  />
                </div>
                <p className="mt-2 text-xs text-[#98a2b3]">
                  <span className="font-semibold text-[#e5e7eb]">{soldPct}% sold</span>
                  {" — "}
                  Only {leftInStock} item(s) left in stock!
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[#e5e7eb]">
                Colors: <span className="text-[#98a2b3]">{selectedColor.name}</span>
              </p>
              <div className="mt-2 flex gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setSelectedColor(c)}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      selectedColor.name === c.name
                        ? "border-white ring-2 ring-[#fe7a2f]/50"
                        : "border-transparent ring-1 ring-white/10"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#e5e7eb]">
                  Size: <span className="text-[#98a2b3]">{selectedSize}</span>
                </p>
                <button type="button" className="text-xs font-medium text-[#fe7a2f] hover:underline">
                  Size Guide
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((sz) => {
                  const disabled = sz === "XXL" && stock < 8;
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedSize(sz)}
                      className={`relative min-w-[40px] rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        disabled
                          ? "cursor-not-allowed border-[#2a303c] bg-[#0a0b0f] text-[#5c6578] line-through"
                          : active
                            ? "border-[#fe7a2f] bg-[#fe7a2f] text-white"
                            : "border-[#2a303c] bg-[#0c0e12] text-[#e5e7eb] hover:border-[#3d4a63]"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm text-[#e5e7eb]">Quantity</p>
              <div className="mt-2 inline-flex items-center rounded-lg border border-[#2a303c] bg-[#0c0e12]">
                <button
                  type="button"
                  className="p-2 text-[#e5e7eb] hover:bg-[#1a1d24]"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-[#f8fafc]">
                  {qty}
                </span>
                <button
                  type="button"
                  className="p-2 text-[#e5e7eb] hover:bg-[#1a1d24]"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-[#0a0b0f] hover:bg-[#f3f4f6]"
              >
                ADD TO CART — {formatLKR(activePrice * qty)}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a303c] bg-[#0c0e12] text-[#e5e7eb] hover:border-[#fe7a2f]/50"
                  aria-label="Compare"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a303c] bg-[#0c0e12] text-[#e5e7eb] hover:border-[#fe7a2f]/50"
                  aria-label="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white hover:opacity-95"
              style={{ background: ACCENT }}
            >
              Buy It Now
            </button>

            <div className="flex flex-wrap gap-4 border-t border-[#1f232b] pt-4 text-sm text-[#98a2b3]">
              <button type="button" className="inline-flex items-center gap-2 hover:text-[#fe7a2f]">
                <Truck className="h-4 w-4" /> Delivery &amp; Return
              </button>
              <button type="button" className="inline-flex items-center gap-2 hover:text-[#fe7a2f]">
                <HelpCircle className="h-4 w-4" /> Ask a question
              </button>
              <button type="button" className="inline-flex items-center gap-2 hover:text-[#fe7a2f]">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-[#252a33] bg-[#08090b] p-4 text-sm text-[#98a2b3]">
              <p>
                Estimated delivery: <span className="text-[#e5e7eb]">12–26 days</span> (International),{" "}
                <span className="text-[#e5e7eb]">3–6 days</span> (Sri Lanka).
              </p>
              <p>Return within 45 days of purchase.</p>
              <button type="button" className="text-[#fe7a2f] hover:underline">
                View store information
              </button>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#8b95a7]">SKU</dt>
                <dd className="font-medium text-[#f8fafc]">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-[#8b95a7]">Vendor</dt>
                <dd className="font-medium text-[#f8fafc]">{vendorName}</dd>
              </div>
              <div>
                <dt className="text-[#8b95a7]">Available</dt>
                <dd className="font-medium text-[#f8fafc]">{availability}</dd>
              </div>
              <div>
                <dt className="text-[#8b95a7]">Categories</dt>
                <dd className="font-medium text-[#f8fafc]">{categoryTags.join(", ")}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-medium text-[#8b95a7]">Guaranteed safe checkout:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <PaymentBadge label="VISA" bg="#1a1f71" />
                <PaymentBadge label="MC" bg="#eb001b" />
                <PaymentBadge label="AMEX" bg="#2e77bc" />
                <PaymentBadge label="PayPal" bg="#003087" />
                <PaymentBadge label="DINERS" bg="#0079be" />
                <PaymentBadge label="DISC" bg="#ff6000" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-[#1f232b] px-6 pb-8 lg:px-8">
          <div className="flex flex-wrap gap-6 border-b border-[#1f232b]">
            {[
              { id: "description", label: "Description" },
              { id: "reviews", label: "Customer Reviews" },
              { id: "shipping", label: "Shipping & Returns" },
              { id: "policy", label: "Return Policies" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative pb-3 text-sm font-medium transition ${
                  tab === t.id ? "text-[#fe7a2f]" : "text-[#98a2b3] hover:text-[#e5e7eb]"
                }`}
              >
                {t.label}
                {tab === t.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: ACCENT }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-[#252a33] bg-[#08090b] p-6">
            {tab === "description" && (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-[#f8fafc]">{product.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#c1c7d0]">{longBlurb}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8b95a7]">
                    Composition, origin and care
                  </h3>
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-[#c1c7d0]">
                    <li>Materials vary by SKU; see packaging for exact fiber content.</li>
                    <li>Designed for {product.categoryName} collections; sourced with quality checks.</li>
                    <li>Origin: multiple; final assembly per batch.</li>
                  </ul>
                  <p className="mt-4 text-xs uppercase tracking-wider text-[#8b95a7]">
                    Machine wash max 30°C / 85°F · short spin · line dry when possible
                  </p>
                </div>
              </div>
            )}

            {tab === "reviews" && (
              <div className="space-y-4">
                {productReviews.length === 0 ? (
                  <p className="text-sm text-[#98a2b3]">No reviews yet for this product.</p>
                ) : (
                  productReviews.map((r) => (
                    <div key={r.id} className="border-b border-[#1f232b] pb-4 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#f8fafc]">{r.customerName}</span>
                        <StarRow value={r.rating} showCount={false} />
                      </div>
                      <p className="mt-2 text-sm text-[#c1c7d0]">{r.comment}</p>
                      <p className="mt-1 text-xs text-[#5c6578]">{r.status} · {r.createdAt?.slice?.(0, 10)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "shipping" && (
              <div className="space-y-3 text-sm text-[#c1c7d0]">
                <p>Orders are packed within 1–2 business days. Tracking is emailed once the carrier accepts the parcel.</p>
                <p>International timelines depend on customs; local delivery targets 3–6 business days where couriers operate.</p>
              </div>
            )}

            {tab === "policy" && (
              <div className="space-y-3 text-sm text-[#c1c7d0]">
                <p>Returns are accepted within 45 days in original condition with tags where applicable.</p>
                <p>Refunds are issued to the original payment method after inspection. Exclusions apply for hygiene-sensitive items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#5c6578]">
        Storefront preview — customer-facing layout inside admin. Prices shown in LKR.
      </p>
    </div>
  );
}
