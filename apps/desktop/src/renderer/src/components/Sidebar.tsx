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

const mainLinks = navLinks.filter((item) => item.href !== "/settings");
const systemLinks = navLinks.filter((item) => item.href === "/settings");

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

  const renderNavItem = (item: (typeof navLinks)[number]) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <motion.div
        key={item.href}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      >
        <Link
          to={item.href}
          onClick={() => {
            if (isOverlay) {
              setIsSidebarOpen(false);
            }
          }}
          className={cn(
            "relative flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-base font-medium transition-colors duration-150",
            isActive
              ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <AnimatePresence>
            {isActive && (
              <motion.span
                initial={{ opacity: 0, scaleY: 0.4 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="bg-sidebar-primary absolute top-1/2 left-0 -mt-2 h-4 w-0.5 origin-center rounded-full"
              />
            )}
          </AnimatePresence>
          <span className="shrink-0 [&_svg]:size-5">{item.icon}</span>
          <span className="truncate text-base">{item.title}</span>
        </Link>
      </motion.div>
    );
  };

  const shell = (
    <aside
      ref={sidebarRef}
      onMouseLeave={handleBillingSidebarMouseLeave}
      className={cn(
        "linear-light bg-sidebar text-sidebar-foreground border-r-frame relative h-full shrink-0 overflow-hidden border-r",
        isOverlay && "shadow-xl"
      )}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        flexBasis: sidebarWidth
      }}
    >
      <div className="flex h-full flex-col">
        {/* ── Brand ── */}
        <div className="border-b-frame flex h-14 shrink-0 items-center border-b px-4">
          <Link
            to="/"
            onClick={() => {
              if (isOverlay) {
                setIsSidebarOpen(false);
              }
            }}
            className="flex items-center gap-3"
          >
            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2">
              <img
                src={quickcartLogo}
                alt="QuickCart logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-semibold">QuickCart</span>
              <span className="text-sidebar-foreground/55 block truncate text-sm">Workspace</span>
            </div>
          </Link>
        </div>

        {/* ── Scrollable middle: actions + nav ── */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
          <div className="flex flex-col gap-3">
            <Link
              to="/billing/sales/create"
              className="block w-full"
              onClick={handleBillingShortcutClick}
            >
              <Button
                variant="default"
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-[background-color,box-shadow] duration-150 hover:shadow-sm"
              >
                <ShoppingCart className="h-5 w-5" />
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
                className="h-10 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-[background-color,box-shadow] duration-150 hover:shadow-sm"
              >
                <FileText className="h-5 w-5" />
                <span>New Estimate</span>
              </Button>
            </Link>
          </div>

          <nav className="mt-6 flex flex-col">
            <div className="flex flex-col">
              <span className="text-sidebar-foreground/55 mb-2 px-3 text-xs font-medium tracking-wider uppercase">
                Main
              </span>
              <div className="flex flex-col gap-0.5">{mainLinks.map(renderNavItem)}</div>
            </div>

            <div className="mt-6 flex flex-col">
              <span className="text-sidebar-foreground/55 mb-2 px-3 text-xs font-medium tracking-wider uppercase">
                System
              </span>
              <div className="flex flex-col gap-0.5">{systemLinks.map(renderNavItem)}</div>
            </div>
          </nav>
        </div>

        {/* ── Store profile footer ── */}
        <div className="border-t-frame shrink-0 border-t px-4 py-3">
          {/* TODO: wire to /api/store-profile — name, email, initials are placeholder */}
          <Link
            to="/settings"
            onClick={() => {
              if (isOverlay) {
                setIsSidebarOpen(false);
              }
            }}
            className="hover:bg-sidebar-accent flex items-center gap-3 rounded-xl p-2 transition-colors duration-150"
          >
            <div className="bg-success/15 text-success flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              MS
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Sri Manjunatheshwara Stores
              </span>
              <span className="text-sidebar-foreground/55 block truncate text-xs">
                kumarkrwelcome@gmail.com
              </span>
            </div>
          </Link>
        </div>

        {/* ── Resize handle ── */}
        <div
          onMouseDown={handleResizeStart}
          className="group hover:bg-foreground/5 absolute top-0 right-0 z-50 flex h-full w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors duration-200"
        >
          <div className="bg-border h-6 w-1 rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </div>
      </div>
    </aside>
  );

  if (isOverlay) {
    return (
      <>
        {!isSidebarOpen && (
          <div
            className="fixed inset-y-0 left-0 z-40 w-4 lg:w-3"
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
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -28, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="fixed inset-y-0 left-0 z-50 transform-gpu"
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
