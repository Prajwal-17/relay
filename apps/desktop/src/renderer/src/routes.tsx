import { createHashRouter, Navigate } from "react-router-dom";
import RootLayout from "./components/layouts/RootLayout";
import { AppearanceSection } from "./features/settings/sections/AppearanceSection";
import { BillingSection } from "./features/settings/sections/BillingSection";
import { ExportsSection } from "./features/settings/sections/ExportsSection";
import { StoreProfileSection } from "./features/settings/sections/StoreProfileSection";
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
        path: "customers/:customerId",
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
            element: <Navigate to="appearance" replace />
          },
          {
            path: "appearance",
            element: <AppearanceSection />
          },
          {
            path: "store-profile",
            element: <StoreProfileSection />
          },
          {
            path: "billing",
            element: <BillingSection />
          },
          {
            path: "exports",
            element: <ExportsSection />
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
