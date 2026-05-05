import { createHashRouter, Navigate } from "react-router-dom";
import RootLayout from "./components/layouts/RootLayout";
import {
  BillingSettingsPage,
  DashboardSettingsPage,
  ExportsSettingsPage,
  GeneralSettingsPage,
  StorageSettingsPage
} from "./features/settings/SettingsSections";
import BillingPage from "./pages/billing/BillingPage";
import CustomersPage from "./pages/customers/CustomersPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
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
            element: <Navigate to="general" replace />
          },
          {
            path: "general",
            element: <GeneralSettingsPage />
          },
          {
            path: "billing",
            element: <BillingSettingsPage />
          },
          {
            path: "dashboard",
            element: <DashboardSettingsPage />
          },
          {
            path: "exports",
            element: <ExportsSettingsPage />
          },
          {
            path: "storage",
            element: <StorageSettingsPage />
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
    path: "*",
    element: <NotFoundPage />
  }
]);
