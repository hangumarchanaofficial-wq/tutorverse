import { products as mockProducts } from "./mockData";
import { slugify } from "../utils/categories";

/** Extra seed brands (no products yet) for admin list / pagination demos */
export const EXTRA_MOCK_BRANDS = [
  {
    id: "brand-urban-thread",
    name: "Urban Thread",
    slug: "urban-thread",
    description: "Contemporary streetwear label.",
    logoUrl: "",
    status: "inactive",
    productCount: 0,
  },
  {
    id: "brand-heritage-lk",
    name: "Heritage LK",
    slug: "heritage-lk",
    description: "Sri Lankan heritage crafts.",
    logoUrl: "",
    status: "active",
    productCount: 0,
  },
  {
    id: "brand-nova-elec",
    name: "Nova Elec",
    slug: "nova-elec",
    description: "Consumer electronics accessories.",
    logoUrl: "",
    status: "active",
    productCount: 0,
  },
  {
    id: "brand-pure-living",
    name: "Pure Living",
    slug: "pure-living",
    description: "Home and lifestyle essentials.",
    logoUrl: "",
    status: "inactive",
    productCount: 0,
  },
];

export function countProductsByBrandName(products = mockProducts) {
  const map = new Map();
  for (const p of products) {
    const name = p.brand?.trim();
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return map;
}

export function buildBrandsFromProducts(products = mockProducts) {
  const countMap = countProductsByBrandName(products);
  return Array.from(countMap.entries()).map(([name, productCount]) => ({
    id: `brand-${slugify(name)}`,
    name,
    slug: slugify(name),
    description: "",
    logoUrl: "",
    status: "active",
    productCount,
  }));
}
