import { products as mockProducts } from "../data/mockData";
import { buildBrandsFromProducts, EXTRA_MOCK_BRANDS, countProductsByBrandName } from "../data/mockBrands";
import { slugify } from "./categories";

/** Session-scoped list so Add Brand can append until page reload */
let sessionBrands = null;

export { slugify };

export function normalizeBrand(b) {
  const name = b?.name || b?.title || "";
  const slug = b?.slug || slugify(name);
  return { ...b, name, slug };
}

function attachProductCounts(brands) {
  const countMap = countProductsByBrandName(mockProducts);
  return brands.map((b) => ({
    ...b,
    productCount: countMap.get(b.name) ?? b.productCount ?? 0,
  }));
}

function getSeedBrands() {
  const fromProducts = buildBrandsFromProducts(mockProducts);
  const names = new Set(fromProducts.map((b) => b.name.toLowerCase()));
  const extra = EXTRA_MOCK_BRANDS.filter((b) => !names.has(b.name.toLowerCase()));
  return attachProductCounts([...fromProducts, ...extra].map(normalizeBrand));
}

export function getBrands() {
  if (!sessionBrands) sessionBrands = getSeedBrands();
  return attachProductCounts(sessionBrands.map(normalizeBrand));
}

export function setBrands(brands) {
  sessionBrands = brands.map(normalizeBrand);
}

export function addBrand(brand) {
  const list = getBrands();
  setBrands([
    ...list,
    normalizeBrand({
      ...brand,
      id: brand.id || `brand-${slugify(brand.name)}-${Date.now()}`,
      productCount: brand.productCount ?? 0,
    }),
  ]);
}

export async function loadBrandsWithFallback() {
  return getBrands();
}
