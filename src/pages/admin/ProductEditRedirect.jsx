import { Navigate } from "react-router-dom";
import { products as mockProducts } from "../../admin/data/mockData";

export default function ProductEditRedirect() {
  const last =
    typeof window !== "undefined"
      ? window.localStorage.getItem("admin-last-product-edit")
      : null;
  const id = last && mockProducts.some((p) => p.id === last) ? last : mockProducts[0]?.id || "P001";
  return <Navigate to={`/admin/products/${id}/edit`} replace />;
}
