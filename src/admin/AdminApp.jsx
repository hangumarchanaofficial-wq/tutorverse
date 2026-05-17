import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { ToastProvider } from "./components/ui";

import Dashboard from "../pages/admin/Dashboard";
import OrdersList from "../pages/admin/OrdersList";
import OrderDetail from "../pages/admin/AdminOrderDetail";
import OrderDetailRedirect from "../pages/admin/OrderDetailRedirect";
import OrderTracking from "../pages/admin/OrderTracking";
import ProductsList from "../pages/admin/ProductsList";
import ProductForm from "../pages/admin/ProductForm";
import ProductEditRedirect from "../pages/admin/ProductEditRedirect";
import ProductDetailRedirect from "../pages/admin/ProductDetailRedirect";
import ProductDetailAdmin from "../pages/admin/ProductDetailAdmin";
import CategoriesList from "../pages/admin/CategoriesList";
import CategoryForm from "../pages/admin/CategoryForm";
import AttributesList from "../pages/admin/AttributesList";
import AttributeForm from "../pages/admin/AttributeForm";
import StockOverview from "../pages/admin/StockOverview";
import StockLogs from "../pages/admin/StockLogs";
import RestockPlanner from "../pages/admin/RestockPlanner";
import CustomersList from "../pages/admin/CustomersList";
import AdminUserForm from "../pages/admin/AdminUserForm";
import CouponsList from "../pages/admin/CouponsList";
import ReviewsList from "../pages/admin/ReviewsList";
import PaymentsList from "../pages/admin/PaymentsList";
import InvoicesList from "../pages/admin/InvoicesList";
import ReturnsList from "../pages/admin/ReturnsList";
import ReportsPage from "../pages/admin/ReportsPage";
import StoreHealth from "../pages/admin/StoreHealth";
import NotificationsPage from "../pages/admin/NotificationsPage";
import AdminInboxList from "../pages/admin/AdminInboxList";
import AdminInboxConversation from "../pages/admin/AdminInboxConversation";
import SettingsPage from "../pages/admin/SettingsPage";
import PlaceholderPages from "../pages/admin/PlaceholderPages";

export default function AdminApp() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />

          {/* Operations */}
          <Route path="orders/tracking" element={<OrderTracking />} />
          <Route path="orders/detail" element={<OrderDetailRedirect />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="returns" element={<ReturnsList />} />
          <Route path="invoices" element={<InvoicesList />} />

          {/* Catalog */}
          <Route path="products" element={<ProductsList />} />
          <Route path="products/edit" element={<ProductEditRedirect />} />
          <Route path="products/details" element={<ProductDetailRedirect />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/details" element={<ProductDetailAdmin />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="categories" element={<CategoriesList />} />
          <Route path="categories/new" element={<CategoryForm />} />
          <Route path="attributes" element={<AttributesList />} />
          <Route path="attributes/new" element={<AttributeForm />} />
          <Route path="brands" element={<PlaceholderPages page="brands" />} />
          <Route path="catalogue-import" element={<PlaceholderPages page="import" />} />

          {/* Inventory */}
          <Route path="stock" element={<StockOverview />} />
          <Route path="stock/low" element={<StockOverview filter="low" />} />
          <Route path="stock/logs" element={<StockLogs />} />
          <Route path="stock/restock" element={<RestockPlanner />} />

          {/* Marketplace sellers (routes kept as /users for compatibility) */}
          <Route path="users" element={<CustomersList pageTitle="All Sellers" />} />
          <Route path="users/new" element={<AdminUserForm />} />
          <Route path="customers" element={<Navigate to="/admin/users" replace />} />
          <Route path="customers/segments" element={<PlaceholderPages page="segments" />} />

          {/* Marketing */}
          <Route path="coupons" element={<CouponsList />} />
          <Route path="reviews" element={<ReviewsList />} />

          {/* Finance */}
          <Route path="payments" element={<PaymentsList />} />
          <Route path="reconciliation" element={<PlaceholderPages page="reconciliation" />} />

          {/* Analytics */}
          <Route path="reports/:section?" element={<ReportsPage />} />

          {/* System */}
          <Route path="inbox" element={<AdminInboxList />} />
          <Route path="inbox/conversation/:messageId?" element={<AdminInboxConversation />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="admin-users" element={<PlaceholderPages page="admin-users" />} />
          <Route path="roles" element={<PlaceholderPages page="roles" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="health" element={<StoreHealth />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
