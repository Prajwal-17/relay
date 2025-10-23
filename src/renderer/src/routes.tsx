import { createHashRouter } from "react-router-dom";
import RootLayout from "./components/layouts/RootLayout";
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
        element: <SettingsPage />
      },
      {
        path: "billing/*",
        children: [
          {
            path: ":type/create/new",
            element: <BillingPage />
          },
          {
            path: ":type/create/new",
            element: <BillingPage />
          },
          {
            path: ":type/edit/:id",
            element: <BillingPage />
          },
          {
            path: ":type/edit/:id",
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
