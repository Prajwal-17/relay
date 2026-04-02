import { navLinks } from "@/constants/Navlinks";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";
import { Building2, FileText, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button } from "./ui/button";

const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 288;
const SIDEBAR_WIDTH_STORAGE_KEY = "quickcart-sidebar-width";

type SidebarProps = {
  variant?: "docked" | "overlay";
};

export const Sidebar = ({ variant = "docked" }: SidebarProps) => {
  const { pathname } = useLocation();
  const { id } = useParams();
  const billingPages = [
    "/billing/sales/create",
    "/billing/estimates/create",
    `/billing/sales/${id}/edit`,
    `/billing/estimates/${id}/edit`
  ];
  const isBillingPage = billingPages.includes(pathname);
  const isOverlay = variant === "overlay";
  const sidebarRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const sidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const animationFrameRef = useRef<number | null>(null);
  const suppressHoverOpenUntilRef = useRef(0);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SIDEBAR_WIDTH;
    }

    const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const parsedWidth = storedWidth ? Number(storedWidth) : NaN;

    if (Number.isFinite(parsedWidth)) {
      return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, parsedWidth));
    }

    return DEFAULT_SIDEBAR_WIDTH;
  });

  const isSidebarOpen = useSidebarStore((state) => state.isSidebarOpen);
  const isSidebarPinned = useSidebarStore((state) => state.isSidebarPinned);
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsSidebarOpen);
  const setIsSidebarPinned = useSidebarStore((state) => state.setIsSidebarPinned);

  const applySidebarWidth = (width: number) => {
    if (!sidebarRef.current) {
      return;
    }

    sidebarRef.current.style.width = `${width}px`;
    sidebarRef.current.style.minWidth = `${width}px`;
    sidebarRef.current.style.maxWidth = `${width}px`;
    sidebarRef.current.style.flexBasis = `${width}px`;
  };

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    applySidebarWidth(sidebarWidth);
  }, [sidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isBillingPage || !isOverlay) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
        setIsSidebarPinned(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBillingPage, isOverlay, isSidebarOpen, setIsSidebarOpen, setIsSidebarPinned]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      const nextWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(
          MIN_SIDEBAR_WIDTH,
          dragStartWidthRef.current + event.clientX - dragStartXRef.current
        )
      );

      sidebarWidthRef.current = nextWidth;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        applySidebarWidth(nextWidth);
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth(sidebarWidthRef.current);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleResizeStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = event.clientX;
    dragStartWidthRef.current = sidebarWidthRef.current;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleBillingShortcutClick = () => {
    if (!isOverlay) {
      return;
    }

    suppressHoverOpenUntilRef.current = Date.now() + 350;
    setIsSidebarPinned(false);
    setIsSidebarOpen(false);
  };

  const handleBillingSidebarMouseLeave = () => {
    if (!isOverlay || isSidebarPinned || isDraggingRef.current) {
      return;
    }

    setIsSidebarOpen(false);
  };

  const shell = (
    <aside
      ref={sidebarRef}
      onMouseLeave={handleBillingSidebarMouseLeave}
      className={cn(
        "bg-sidebar text-sidebar-foreground relative h-full shrink-0 overflow-hidden border-r border-r-black/8",
        isOverlay ? "shadow-2xl" : ""
      )}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        flexBasis: sidebarWidth
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[73px] items-center border-b px-4">
          <motion.div
            initial={false}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.16, ease: "easeInOut" }}
            className="flex items-center gap-3"
          >
            <div className="bg-primary/15 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xl font-semibold">QuickCart</span>
              <span className="text-muted-foreground block truncate text-sm">POS Workspace</span>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col px-4 py-5 pb-24">
          <div className="flex flex-col gap-3">
            <Link
              to="/billing/sales/create"
              className="block w-full"
              onClick={handleBillingShortcutClick}
            >
              <Button
                variant="default"
                size="lg"
                className="group bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full cursor-pointer justify-center gap-3 px-4 text-lg font-medium transition-all hover:shadow-md"
              >
                <ShoppingCart className="h-7 w-7 [stroke-width:2.35] transition-transform duration-300 group-hover:rotate-12" />
                <span>New Sale</span>
              </Button>
            </Link>

            <Link
              to="/billing/estimates/create"
              className="block w-full"
              onClick={handleBillingShortcutClick}
            >
              <Button
                variant="outline"
                size="lg"
                className="group h-11 w-full cursor-pointer justify-center gap-3 px-4 text-lg font-medium transition-all hover:shadow-md"
              >
                <FileText className="h-7 w-7 [stroke-width:2.35] transition-transform duration-300 group-hover:-rotate-12" />
                <span>New Estimate</span>
              </Button>
            </Link>
          </div>

          <nav className="mt-7 flex-1 space-y-2">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  <Link
                    to={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-1.5 text-lg font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-sidebar-foreground font-semibold"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 pb-4">
          <motion.div
            initial={false}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="border-border bg-background/70 flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm"
          >
            <div className="bg-success/20 text-success flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              MS
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Sri Manjunatheshwara Stores
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                kumarkrwelcome@gmail.com
              </span>
            </div>
          </motion.div>
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 h-full w-2 cursor-col-resize"
        />
      </div>
    </aside>
  );

  if (isOverlay) {
    return (
      <>
        {!isSidebarOpen && (
          <div
            className="fixed inset-y-0 left-0 z-40 w-3"
            onMouseEnter={() => {
              if (Date.now() < suppressHoverOpenUntilRef.current) {
                return;
              }

              setIsSidebarPinned(false);
              setIsSidebarOpen(true);
            }}
          />
        )}

        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -12, opacity: 0.995 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0.995 }}
              transition={{ duration: 0.08, ease: "linear" }}
              className="fixed inset-y-0 left-0 z-50"
            >
              {shell}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return shell;
};
