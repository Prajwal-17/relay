import Estimate from "@/components/Estimate";
import Home from "@/components/Home";
import Parties from "@/components/Parties";
import Reports from "@/components/Reports";
import Sale from "@/components/Sale";
import SettingsPage from "@/components/SettingsPage";
import ProductsPage from "@/pages/ProductsPage/ProductsPage";
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
    href: "/parties",
    title: "Parties",
    element: <Parties />,
    icon: <Users size={28} />
  },
  {
    href: "/sale",
    title: "Sale",
    element: <Sale />,
    icon: <ShoppingCart size={28} />
  },
  {
    href: "/estimate",
    title: "Estimate",
    element: <Estimate />,
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
