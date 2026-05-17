import { apiFetch } from "../lib/apiClient";

export async function fetchProducts(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const response = await apiFetch(`/products${suffix}`);
  return response.items || [];
}

export async function fetchProductById(id) {
  return apiFetch(`/products/${id}`);
}

export async function fetchCategories() {
  const response = await apiFetch("/categories");
  return response.items || [];
}

export async function fetchRelatedProducts(categorySlug, excludeId, limit = 4) {
  const items = await fetchProducts({ category: categorySlug, limit: limit + 1 });
  return items.filter((p) => String(p.id) !== String(excludeId)).slice(0, limit);
}
