import { products as mockProducts, IMG } from "../admin/data/mockData";

const BROKEN_IMAGE_MAP = {
  "photo-lFQV2lt7qcw": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop&auto=format",
  "photo-T29AcrDfWsY": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop&auto=format",
  "photo-VzBlp8rl5h8": "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=400&fit=crop&auto=format",
  "photo-1591290619762-dbe58e27b5d0": IMG.charger,
  "photo-1576243345690-4e4b79b6328a": IMG.fitness,
  "photo-1608043152269-423dbba4e7e2": IMG.speaker,
};

/** Lookup by product id, numeric id, name, or SKU for demo/API rows without images. */
function buildDemoProductImages() {
  const map = {};
  for (const p of mockProducts) {
    const url = p.images?.[0];
    if (!url) continue;
    map[String(p.id)] = url;
    map[p.name] = url;
    if (p.sku) map[p.sku] = url;
    const numeric = String(p.id).replace(/^P0*/i, "");
    if (/^\d+$/.test(numeric)) map[numeric] = url;
  }
  return map;
}

const DEMO_PRODUCT_IMAGES = buildDemoProductImages();

/** Normalize image URLs (absolute, Unsplash slug, broken-ID fixes). */
export function resolveProductImageUrl(img) {
  if (!img || typeof img !== "string") return "";
  const trimmed = img.trim();
  if (!trimmed) return "";
  for (const [broken, fixed] of Object.entries(BROKEN_IMAGE_MAP)) {
    if (trimmed.includes(broken)) return fixed;
  }
  if (trimmed.startsWith("http") || trimmed.startsWith("data:")) return trimmed;
  return `https://images.unsplash.com/${trimmed}?w=400&h=400&fit=crop&auto=format`;
}

function parseImagesJson(imagesJson) {
  if (!imagesJson) return null;
  if (Array.isArray(imagesJson)) return imagesJson[0] || null;
  if (typeof imagesJson === "string") {
    try {
      const parsed = JSON.parse(imagesJson);
      return Array.isArray(parsed) ? parsed[0] : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function parseCatalogProductImage(product) {
  if (!product) return "";
  return resolveProductImageUrl(
    product.images?.[0] ||
      product.image ||
      parseImagesJson(product.images_json) ||
      ""
  );
}

function findMockProduct(productId, productTitle) {
  const idStr = productId != null ? String(productId) : "";
  if (idStr) {
    let match = mockProducts.find((p) => String(p.id) === idStr);
    if (!match && /^\d+$/.test(idStr)) {
      match = mockProducts.find((p) => String(p.id) === `P${idStr.padStart(3, "0")}`);
    }
    if (match) return match;
  }
  if (productTitle) {
    return mockProducts.find((p) => p.name === productTitle);
  }
  return null;
}

/** Resolve a line-item thumbnail from stored image, mock catalog, or API product row. */
export function resolveLineItemProductImage({ productId, productTitle, image, catalogProduct }) {
  const fromField = resolveProductImageUrl(image);
  if (fromField) return fromField;

  const fromCatalog = parseCatalogProductImage(catalogProduct);
  if (fromCatalog) return fromCatalog;

  const mock = findMockProduct(productId, productTitle);
  const fromMock = resolveProductImageUrl(mock?.images?.[0] || mock?.image || "");
  if (fromMock) return fromMock;

  const demo =
    DEMO_PRODUCT_IMAGES[String(productId ?? "")] ||
    DEMO_PRODUCT_IMAGES[productTitle] ||
    DEMO_PRODUCT_IMAGES[mock?.sku];
  return resolveProductImageUrl(demo || "");
}
