import { Input } from "@/components/ui/input";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Outlet, matchPath, useLocation } from "react-router-dom";
import { Sidebar } from "../Sidebar";

const getPageTitle = (pathname: string) => {
  if (matchPath("/", pathname)) {
    return "Dashboard";
  }

  if (matchPath("/products", pathname)) {
    return "Products";
  }

  if (matchPath("/customers", pathname)) {
    return "Customers";
  }

  if (matchPath("/dashboard/sales", pathname)) {
    return "Sales Overview";
  }

  if (matchPath("/dashboard/estimates", pathname)) {
    return "Estimates Overview";
  }

  if (matchPath("/reports", pathname)) {
    return "Reports";
  }

  if (matchPath("/settings", pathname)) {
    return "Settings";
  }

  if (matchPath("/billing/sales/create", pathname)) {
    return "New Sale";
  }

  if (matchPath("/billing/estimates/create", pathname)) {
    return "New Estimate";
  }

  if (matchPath("/billing/sales/:id/edit", pathname)) {
    return "Edit Sale";
  }

  if (matchPath("/billing/estimates/:id/edit", pathname)) {
    return "Edit Estimate";
  }

  return "Workspace";
};

const AppShell = () => {
  const { pathname } = useLocation();
  const pageTitle = getPageTitle(pathname);
  const isBillingPage = pathname.startsWith("/billing/");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden">
      {!isBillingPage && (
        <AnimatePresence initial={false}>
          {isSidebarVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: -28 }}
              animate={{ width: "auto", opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -28 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="h-full shrink-0 transform-gpu origin-left overflow-hidden"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {isBillingPage && <Sidebar variant="overlay" />}

      <main className="flex min-w-0 flex-1 flex-col">
        {!isBillingPage && (
          <header className="bg-background/95 flex h-[73px] items-center border-b px-6">
            <div className="flex w-full items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => setIsSidebarVisible((current) => !current)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/60 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all duration-150 active:scale-[0.97]"
                >
                  {isSidebarVisible ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelLeftOpen className="h-5 w-5" />
                  )}
                </motion.button>

                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-semibold">{pageTitle}</h1>
                </div>
              </div>

              <div className="relative ml-auto w-full max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search anything..."
                  className="bg-muted/40 h-10 pl-9"
                />
              </div>
            </div>
          </header>
        )}

        <section className="flex-1 overflow-y-auto">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AppShell;
