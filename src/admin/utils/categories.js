import { categories as mockCategories } from "../data/mockData";
import { fetchAdminCategories } from "../../services/adminApi";

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function normalizeCategory(c) {
  const name = c?.name || c?.title || "";
  const slug = c?.slug || slugify(name);
  return { ...c, name, slug };
}

export async function loadCategoriesWithFallback() {
  try {
    const res = await fetchAdminCategories();
    const raw = Array.isArray(res) ? res : res?.items || [];
    const normalized = raw.map(normalizeCategory).filter((c) => c.name);
    return normalized.length > 0 ? normalized : mockCategories;
  } catch {
    return mockCategories;
  }
}
