import relayAppIcon from "@assets/desktop/app-icon-small.svg";
import { navLinks } from "@/app/navigation";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { StoreProfile } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainLinks = navLinks.filter((item) => item.href !== "/settings");
const systemLinks = navLinks.filter((item) => item.href === "/settings");

const IconTooltip = ({ label, children }: { label: string; children: React.ReactElement }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="right" sideOffset={8}>
      {label}
    </TooltipContent>
  </Tooltip>
);

export const BillingSidebar = () => {
  const { pathname } = useLocation();
  const { data: storeProfile } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const storeInitials = useMemo(() => {
    if (!storeProfile?.storeName) return "R";
    const words = storeProfile.storeName.trim().split(/\s+/);
    if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
    return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
  }, [storeProfile?.storeName]);

  const renderNavItem = (item: (typeof navLinks)[number]) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    return (
      <IconTooltip key={item.href} label={item.title}>
        <Link
          to={item.href}
          draggable={false}
          aria-label={item.title}
          className={cn(
            "flex size-10 items-center justify-center rounded-(--radius-control) transition-colors duration-150 outline-none [&_svg]:size-4.5",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
            isActive
              ? "bg-nav-icon-active-bg text-nav-icon-active-foreground"
              : "text-sidebar-foreground/70 hover:bg-hover hover:text-sidebar-foreground"
          )}
        >
          {item.icon}
        </Link>
      </IconTooltip>
    );
  };

  return (
    <aside
      aria-label="Billing navigation"
      className="bg-sidebar text-sidebar-foreground border-r-frame flex h-full w-(--sidebar-compact-width) shrink-0 flex-col border-r"
    >
      <header className="border-b-frame flex h-(--app-header-height) shrink-0 items-center justify-center border-b">
        <IconTooltip label="Relay home">
          <Link
            to="/"
            draggable={false}
            aria-label="Relay home"
            className="focus-visible:ring-ring flex size-8 items-center justify-center rounded-(--radius-control) outline-none focus-visible:ring-2"
          >
            <img
              src={relayAppIcon}
              alt=""
              draggable={false}
              className="size-full rounded-(--radius-control) object-contain"
            />
          </Link>
        </IconTooltip>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-1.5">
          <IconTooltip label="New Sale">
            <Button
              asChild
              size="icon-lg"
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <Link to="/billing/sales/create" draggable={false} aria-label="New Sale">
                <ShoppingCart className="size-4.5" />
              </Link>
            </Button>
          </IconTooltip>

          <IconTooltip label="New Estimate">
            <Button
              asChild
              size="icon-lg"
              className="border-estimate bg-card text-estimate-foreground hover:bg-estimate-soft border"
            >
              <Link to="/billing/estimates/create" draggable={false} aria-label="New Estimate">
                <FileText className="size-4.5" />
              </Link>
            </Button>
          </IconTooltip>
        </div>

        <nav aria-label="Main navigation" className="mt-3 flex flex-col items-center gap-1">
          {mainLinks.map(renderNavItem)}
        </nav>

        <nav
          aria-label="System navigation"
          className="border-border/70 mt-3 flex flex-col items-center gap-1 border-t pt-3"
        >
          {systemLinks.map(renderNavItem)}
        </nav>
      </div>

      <footer className="border-t-frame flex shrink-0 justify-center border-t py-2">
        <IconTooltip label={storeProfile?.storeName || "Store profile"}>
          <Link
            to="/settings/store-profile"
            draggable={false}
            aria-label={storeProfile?.storeName || "Store profile"}
            className="bg-selected text-foreground hover:bg-hover focus-visible:ring-ring flex size-9 items-center justify-center rounded-(--radius-control) text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
          >
            {storeInitials}
          </Link>
        </IconTooltip>
      </footer>
    </aside>
  );
};
