import { navLinks } from "@/constants/Navlinks";
import { useSidebarStore } from "@/store/sidebarStore";
import { Building2, FileText, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "./ui/button";

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { id } = useParams();
  const billingPages = [
    "/billing/sales/create/new",
    "/billing/estimates/create/new",
    `/billing/sales/edit/${id}`,
    `/billing/estimates/edit/${id}`
  ];
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
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            ref={sidebarRef}
            onMouseLeave={handleMouseLeave}
            className={`bg-sidebar text-sidebar-foreground w-full max-w-xs px-4 py-4 ${isBillingPage ? "border-r-border fixed top-2 left-0 z-50 h-[calc(100vh-1rem)] rounded-r-xl border shadow-xl" : "relative h-full"}`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div className="flex w-full items-center justify-start gap-3">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Building2 className="text-sidebar-foreground h-7 w-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans text-2xl font-extrabold">SuperBill</span>
                  </div>
                </div>
                {isBillingPage && (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSidebarPinned(false);
                    }}
                    className="hover:bg-secondary text-primary-foreground cursor-pointer rounded-lg p-2"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="mt-6 flex w-full flex-col gap-3">
                <Link to="/billing/sales/create/new" className="w-full">
                  <Button
                    variant="default"
                    size="lg"
                    className="group bg-primary border-border text-primary-foreground hover:bg-primary/80 w-full cursor-pointer py-5 text-lg font-semibold shadow-sm transition-all hover:shadow-md"
                  >
                    <ShoppingCart className="size-5 transition-transform duration-300 group-hover:rotate-12" />
                    <span>New Sale</span>
                  </Button>
                </Link>
                <Link to="/billing/estimates/create/new" className="w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group border-border hover:bg-accent hover:text-accent-foreground w-full cursor-pointer py-5 text-lg font-semibold shadow-sm transition-all hover:shadow-md"
                  >
                    <FileText className="size-5 transition-transform duration-300 group-hover:rotate-[-12deg]" />
                    <span>New Estimate</span>
                  </Button>
                </Link>
              </div>
              <div className="mt-8 w-full flex-1 space-y-2">
                {navLinks.map((item, idx) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={idx}
                      to={item.href}
                      className={`${isActive ? "bg-secondary font-semibold" : ""} hover:bg-secondary text-sidebar-foreground flex w-full items-center gap-3 rounded-lg px-3.5 py-1.5 transition-all`}
                    >
                      {item.icon}
                      <span className="text-xl">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="border-border flex w-full items-center gap-3 rounded-lg border p-3">
                <div className="bg-success/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <span className="text-success text-sm font-semibold">MS</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sidebar-foreground truncate text-sm font-semibold">
                    Sri Manjunatheshwara Stores
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
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
