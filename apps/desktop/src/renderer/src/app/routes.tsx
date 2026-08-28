import { AppearanceSection } from "@/features/settings/sections/AppearanceSection";
import { BillingSection } from "@/features/settings/sections/BillingSection";
import { ExportsSection } from "@/features/settings/sections/ExportsSection";
import { StoreProfileSection } from "@/features/settings/sections/StoreProfileSection";
import { PrintingSection } from "@/features/settings/sections/PrintingSection";
import BillingPage from "@/pages/BillingPage";
import CustomersPage from "@/pages/CustomersPage";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import PdfInvoicePage from "@/pages/PdfInvoicePage";
import ProductsPage from "@/pages/ProductsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import RootLayout from "./layouts/RootLayout";

export const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary scope="root" />,
    children: [
      {
        element: <Outlet />,
        errorElement: <RouteErrorBoundary scope="workspace" />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "customers", element: <CustomersPage /> },
          { path: "customers/:customerId", element: <CustomersPage /> },
          { path: "dashboard/:type", element: <TransactionsPage /> },
          { path: "reports", element: <ReportsPage /> },
          {
            path: "settings",
            element: <SettingsPage />,
            children: [
              { index: true, element: <Navigate to="appearance" replace /> },
              { path: "appearance", element: <AppearanceSection /> },
              { path: "store-profile", element: <StoreProfileSection /> },
              { path: "billing", element: <BillingSection /> },
              { path: "printing", element: <PrintingSection /> },
              { path: "exports", element: <ExportsSection /> }
            ]
          }
        ]
      },
      {
        path: "billing/*",
        errorElement: <RouteErrorBoundary scope="billing" />,
        children: [
          { path: ":type/create", element: <BillingPage /> },
          { path: ":type/:id/edit", element: <BillingPage /> },
          { path: "*", element: <NotFoundPage /> }
        ]
      }
    ]
  },
  {
    path: "export/pdf/:type",
    element: <PdfInvoicePage />,
    errorElement: <RouteErrorBoundary scope="pdf" />
  },
  { path: "*", element: <NotFoundPage /> }
]);
