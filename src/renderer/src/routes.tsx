import { createHashRouter } from "react-router-dom";
import RootLayout from "./components/layouts/RootLayout";
import CustomersPage from "./pages/customers/CustomersPage";
import HomePage from "./pages/home/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProductsPage from "./pages/products/ProductsPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SettingsPage from "./pages/settings/SettingsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

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
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
