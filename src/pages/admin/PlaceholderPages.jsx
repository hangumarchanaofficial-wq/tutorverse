import React from "react";
import { PlaceholderPage } from "../../admin/components/ui";

const PAGE_MAP = {
  brands: {
    title: "Brands Management",
    description: "Manage product brands, logos, and brand pages.",
  },
  import: {
    title: "Catalogue Import",
    description: "Bulk import products from CSV/JSON files with validation.",
  },
  segments: {
    title: "Customer Segments",
    description: "Create customer segments for targeted marketing.",
  },
  reconciliation: {
    title: "Payment Reconciliation",
    description: "Match payments with orders and resolve discrepancies.",
  },
  "admin-users": {
    title: "Admin Users",
    description: "Manage admin team members and their access levels.",
  },
  roles: {
    title: "Roles & Permissions",
    description: "Configure role-based access control for admin users.",
  },
};

const DEFAULT_PAGE = {
  title: "Coming Soon",
  description: "This feature is under development.",
};

export default function PlaceholderPages({ page }) {
  const config = PAGE_MAP[page] || DEFAULT_PAGE;
  return <PlaceholderPage title={config.title} description={config.description} />;
}
