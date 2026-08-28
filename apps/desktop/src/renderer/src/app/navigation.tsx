import Customers from "@/pages/CustomersPage";
import TransactionsPage from "@/pages/TransactionsPage";
import Home from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import Reports from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import {
  ChartColumn,
  House,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";

type NavlinkType = {
  href: string;
  title: string;
  element: React.ReactNode;
  icon?: React.ReactNode;
};
export const navLinks: NavlinkType[] = [
  {
    href: "/",
    title: "Home",
    element: <Home />,
    icon: <House size={24} />
  },
  {
    href: "/products",
    title: "Products",
    element: <ProductsPage />,
    icon: <Package size={24} />
  },
  {
    href: "/customers",
    title: "Customers",
    element: <Customers />,
    icon: <Users size={24} />
  },
  {
    href: "/dashboard/sales",
    title: "Sales",
    element: <TransactionsPage />,
    icon: <ShoppingCart size={24} />
  },
  {
    href: "/dashboard/estimates",
    title: "Estimates",
    element: <TransactionsPage />,
    icon: <ReceiptText size={24} />
  },
  {
    href: "/reports",
    title: "Reports",
    element: <Reports />,
    icon: <ChartColumn size={24} />
  },
  {
    href: "/settings",
    title: "Settings",
    element: <SettingsPage />,
    icon: <Settings size={24} />
  }
];
