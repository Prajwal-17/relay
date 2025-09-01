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
    icon: <House size={28} />
  },
  {
    href: "/products",
    title: "Items",
    element: <ProductsPage />,
    icon: <Package size={28} />
  },
  {
    href: "/customers",
    title: "Customers",
    element: <Customers />,
    icon: <Users size={28} />
  },
  {
    href: "/sale",
    title: "Sale",
    element: <Dashboard />,
    icon: <ShoppingCart size={28} />
  },
  {
    href: "/estimate",
    title: "Estimate",
    element: <Dashboard />,
    icon: <ReceiptText size={28} />
  },
  {
    href: "/reports",
    title: "Reports",
    element: <Reports />,
    icon: <ChartColumn size={28} />
  },
  {
    href: "/settings",
    title: "Settings",
    element: <SettingsPage />,
    icon: <Settings size={28} />
  }
];
