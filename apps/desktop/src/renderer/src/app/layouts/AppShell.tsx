import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/app/sidebar.store";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BillingSidebar } from "./BillingSidebar";

const COMPACT_SHELL_QUERY = "(max-width: 1119px)";

const getPageTitle = (pathname: string) => {
  if (matchPath("/", pathname)) return "Dashboard";
  if (matchPath("/products", pathname)) return "Products";
  if (matchPath("/customers", pathname)) return "Customers";
  if (matchPath("/dashboard/sales", pathname)) return "Sales Overview";
  if (matchPath("/dashboard/estimates", pathname)) return "Estimates Overview";
  if (matchPath("/reports", pathname)) return "Reports";
  if (matchPath("/settings/*", pathname)) return "Settings";
  return "Workspace";
};

const AppShell = () => {
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);
  const isBillingPage = pathname.startsWith("/billing/");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => window.matchMedia(COMPACT_SHELL_QUERY).matches
  );
  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_SHELL_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsCompactViewport(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const usesOverlaySidebar = !isBillingPage && isCompactViewport;
  const isNavigationOpen = usesOverlaySidebar ? isSidebarOpen : isSidebarVisible;

  const toggleSidebar = () => {
    if (usesOverlaySidebar) {
      const nextOpen = !isSidebarOpen;
      setIsSidebarPinned(nextOpen);
      setIsSidebarOpen(nextOpen);
      return;
    }
    setIsSidebarVisible((current) => !current);
  };

  return (
    <div className="bg-background flex h-full w-full overflow-hidden">
      {isBillingPage && <BillingSidebar />}

      {!isBillingPage && !usesOverlaySidebar && isSidebarVisible && (
        <div className="h-full shrink-0 overflow-hidden">
          <Sidebar />
        </div>
      )}

      {!isBillingPage && usesOverlaySidebar && <Sidebar variant="overlay" />}

      <main className="flex min-w-0 flex-1 flex-col">
        {!isBillingPage && (
          <header className="bg-card border-b-frame flex h-(--app-header-height) shrink-0 items-center border-b px-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={isNavigationOpen ? "Close navigation" : "Open navigation"}
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-hover inline-flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) transition-colors outline-none",
                  "focus-visible:ring-ring/30 focus-visible:ring-2"
                )}
              >
                {(!usesOverlaySidebar && isSidebarVisible) ||
                (usesOverlaySidebar && isSidebarOpen) ? (
                  <PanelLeftClose className="size-4.5" />
                ) : (
                  <PanelLeftOpen className="size-4.5" />
                )}
              </button>
              <h1 className="truncate text-lg font-semibold tracking-[-0.02em]">{pageTitle}</h1>
            </div>
          </header>
        )}

        <section
          className={cn("min-h-0 flex-1", isBillingPage ? "overflow-clip" : "overflow-y-auto")}
        >
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AppShell;
