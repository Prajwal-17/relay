import { createHashRouter, Navigate } from "react-router-dom";
import RootLayout from "./components/layouts/RootLayout";
import {
  BillingSettingsPage,
  ExportsSettingsPage,
  StoreProfileSettingsPage
} from "./features/settings/SettingsSections";
import BillingPage from "./pages/billing/BillingPage";
import CustomersPage from "./pages/customers/CustomersPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PdfInvoicePage from "./pages/export/pdf/PdfInvoicePage";
import HomePage from "./pages/home/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductsPage from "./pages/products/ProductsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SettingsPage from "./pages/settings/SettingsPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "products",
        element: <ProductsPage />
      },
      {
        path: "customers",
        element: <CustomersPage />
      },
      {
        path: "dashboard/:type",
        element: <DashboardPage />
      },
      {
        path: "reports",
        element: <ReportsPage />
      },
      {
        path: "settings",
        element: <SettingsPage />,
        children: [
          {
            index: true,
            element: <Navigate to="store-profile" replace />
          },
          {
            path: "store-profile",
            element: <StoreProfileSettingsPage />
          },
          {
            path: "billing",
            element: <BillingSettingsPage />
          },
          {
            path: "exports",
            element: <ExportsSettingsPage />
          }
        ]
      },
      {
        path: "billing/*",
        children: [
          {
            path: ":type/create",
            element: <BillingPage />
          },
          {
            path: ":type/create",
            element: <BillingPage />
          },
          {
            path: ":type/:id/edit",
            element: <BillingPage />
          },
          {
            path: ":type/:id/edit",
            element: <BillingPage />
          }
        ]
      }
    ]
  },
  {
    path: "export/pdf/:type",
    element: <PdfInvoicePage />
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
