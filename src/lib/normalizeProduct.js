/**
 * Normalize a product into a single shape consumed by the storefront UI.
 * Accepts both backend rows (`category_slug`, `original_price`, `stock_qty`,
 * `is_featured`, `images_json`, …) and the legacy dummy data shape.
 */
export function normalizeProduct(p) {
  if (!p) return null;
  const images =
    Array.isArray(p.images_json) && p.images_json.length
      ? p.images_json
      : Array.isArray(p.images) && p.images.length
        ? p.images
        : p.image
          ? [p.image]
          : [];

  const reviewsCount = p.reviews_count ?? p.reviewsCount ?? p.reviews ?? 0;

  let badge = p.badge || null;
  if (!badge) {
    if (p.is_best_seller) badge = "Best Seller";
    else if (p.is_new_arrival) badge = "New";
    else if (p.is_featured) badge = "Featured";
  }

  return {
    id: p.id,
    title: p.title || "",
    description: p.description || "",
    price: Number(p.price) || 0,
    originalPrice:
      p.original_price != null
        ? Number(p.original_price)
        : p.originalPrice != null
          ? Number(p.originalPrice)
          : null,
    discount: Number(p.discount) || 0,
    image: images[0] || "",
    images,
    category: p.category || p.category_slug || "",
    categorySlug: p.category_slug || p.categorySlug || "",
    brand: p.brand || "",
    rating: Number(p.rating) || 0,
    reviews: Number(reviewsCount) || 0,
    inStock: (p.stock_qty ?? p.inStock ?? 1) > 0,
    stockQty: Number(p.stock_qty ?? 0) || 0,
    badge,
    isFeatured: !!p.is_featured,
    isBestSeller: !!p.is_best_seller,
    isNewArrival: !!p.is_new_arrival,
    dateAdded: p.created_at || p.dateAdded || null,
  };
}

export function normalizeProducts(items) {
  return (items || []).map(normalizeProduct).filter(Boolean);
}
