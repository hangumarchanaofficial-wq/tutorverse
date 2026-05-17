import { Navigate } from "react-router-dom";
import { orders as mockOrders } from "../../admin/data/mockData";

export default function OrderDetailRedirect() {
  const last =
    typeof window !== "undefined" ? window.localStorage.getItem("admin-last-order-view") : null;
  const id =
    last && mockOrders.some((o) => o.id === last) ? last : mockOrders[0]?.id || "1";
  return <Navigate to={`/admin/orders/${id}`} replace />;
}
