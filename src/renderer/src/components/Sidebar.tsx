import { navLinks } from "@/constants/Navlinks";
import { useSidebarStore } from "@/store/sidebarStore";
import { Building2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const billingPages = ["/sales/new", "/estimate/new"];
  const isBillingPage = billingPages.includes(pathname);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const isSidebarPinned = useSidebarStore((state) => state.isSidebarPinned);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  useEffect(() => {
    if (isBillingPage) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isBillingPage, setIsSidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        setIsSidebarPinned(false);
      }
    };

    if (isSidebarOpen && isBillingPage) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen, isSidebarPinned, setIsSidebarOpen, setIsSidebarPinned, isBillingPage]);

  const handleMouseLeave = () => {
    if (!isSidebarPinned && isBillingPage) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isBillingPage && (
        <div
          className="fixed top-0 left-0 z-30 h-full w-4"
          onMouseEnter={() => setIsSidebarOpen(true)}
        />
      )}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -75 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            ref={sidebarRef}
            className={`text-sidebar-foreground bg-sidebar border-border h-full w-full max-w-xs border-r px-4 py-4 ${isBillingPage ? "absolute z-20" : "relative"}`}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div className="flex w-full items-center justify-start gap-3">
                  <div className="bg-primary text-foreground flex h-12 w-12 items-center justify-center rounded-lg">
                    <Building2 className="text-background h-8 w-8" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-2xl font-extrabold">SuperBill</span>
                    <span className="text-muted-foreground text-md font-medium">POS Billing</span>
                  </div>
                </div>
                {isBillingPage && (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSidebarPinned(false);
                    }}
                    className="text-foreground hover:b rounded-lg px-2 py-2 hover:cursor-pointer hover:bg-neutral-200/80"
                  >
                    <X />
                  </button>
                )}
              </div>
              <div className="mt-5 flex w-full flex-col items-center justify-center gap-3">
                <Link to="/sales/new" className="w-full">
                  <Button variant="default" size="lg" className="w-full text-lg font-medium">
                    Create Sale
                  </Button>
                </Link>
                <Link to="/estimate/new" className="w-full">
                  <Button variant="default" size="lg" className="w-full text-lg font-medium">
                    Add Estimate
                  </Button>
                </Link>
              </div>
              <div className="mt-12 w-full flex-1 space-y-4">
                {navLinks.map((item, idx) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={idx}
                      to={item.href}
                      className={`${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-primary/25 border" : "text-sidebar-accent-foreground border border-transparent"} hover:text-sidebar-foreground hover:bg-sidebar-accent flex w-full transform items-center justify-start gap-3 rounded-lg px-3 py-3 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95`}
                    >
                      {item.icon}
                      <span className="text-xl font-semibold">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex w-full items-center px-1 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-green-100">
                  <span className="text-md font-medium text-green-700"> MS</span>
                </div>
                <div className="ml-2 flex flex-col items-start justify-center leading-tight">
                  <span className="text-sidebar-foreground text-base leading-none font-semibold">
                    Sri Manjunatheshwara Stores
                  </span>
                  <span className="text-muted-foreground text-sm font-medium">
                    kumarkrwelcome@gmail.com
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
