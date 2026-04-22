import quickcartLogo from "@/assets/quickcart.svg";
import { navLinks } from "@/constants/Navlinks";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";
import { FileText, ShoppingCart } from "lucide-react";
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

  // Ensure overlay mode starts closed
  useEffect(() => {
    if (isOverlay) {
      setIsSidebarOpen(false);
      setIsSidebarPinned(false);
    }
  }, [isOverlay, setIsSidebarOpen, setIsSidebarPinned]);

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

      // If user let go of drag while mouse is outside sidebar, we might need to close it (for overlay mode)
      if (isOverlay && !isSidebarPinned) {
        // It's tricky to rely on mouseleave here since we've captured events, but let's assume if it's left open they can click outside to close
      }
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
    // eslint-disable-next-line
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
        "bg-sidebar text-sidebar-foreground relative h-full shrink-0 overflow-x-hidden overflow-y-auto border-r border-r-black/8",
        isOverlay ? "shadow-[20px_0_40px_rgba(0,0,0,0.1)]" : ""
      )}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        flexBasis: sidebarWidth
      }}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-18.25 items-center border-b px-4">
          <motion.div
            initial={false}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.16, ease: "easeInOut" }}
            className="flex items-center gap-3"
          >
            <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl p-2">
              <img
                src={quickcartLogo}
                alt="QuickCart logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xl font-semibold">QuickCart</span>
              <span className="text-muted-foreground block truncate text-sm">Workspace</span>
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
                className="group bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full cursor-pointer justify-center gap-3 px-4 text-lg font-medium transition-all duration-150 hover:shadow-md active:scale-[0.97]"
              >
                <ShoppingCart className="stroke-2.35 h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
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
                className="group h-11 w-full cursor-pointer justify-center gap-3 px-4 text-lg font-medium transition-all duration-150 hover:shadow-md active:scale-[0.97]"
              >
                <FileText className="stroke-2.35 h-7 w-7 transition-transform duration-300 group-hover:-rotate-12" />
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
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (isOverlay) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-1.5 text-[1.05rem] font-medium transition-colors duration-150",
                      isActive
                        ? "bg-secondary text-sidebar-foreground font-semibold"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <span className="shrink-0 [&_svg]:h-[1.35rem] [&_svg]:w-[1.35rem]">
                      {item.icon}
                    </span>
                    <span className="truncate text-lg">{item.title}</span>
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
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="border-border bg-background/80 hover:bg-background/90 flex cursor-pointer items-center gap-3 rounded-xl border p-3 backdrop-blur-md transition-colors duration-200"
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
          className="group absolute top-0 right-0 z-50 flex h-full w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="bg-border h-6 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </aside>
  );

  if (isOverlay) {
    return (
      <>
        {!isSidebarOpen && (
          <div
            className="fixed inset-y-0 left-0 z-40 w-4 lg:w-6"
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
              initial={{ x: -28, opacity: 0.5, scale: 0.98 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -28, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="fixed inset-y-0 left-0 z-50 transform-gpu"
              style={{ transformOrigin: "left center" }}
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
