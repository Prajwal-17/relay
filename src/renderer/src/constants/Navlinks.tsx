import Customers from "@/pages/Customers";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import ProductsPage from "@/pages/ProductsPage";
import Reports from "@/pages/Reports";
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
    href: "/sale",
    title: "Sales",
    element: <Dashboard />,
    icon: <ShoppingCart size={24} />
  },
  {
    href: "/estimate",
    title: "Estimates",
    element: <Dashboard />,
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
