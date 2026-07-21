import quickcartLogo from "@/assets/quickcart.svg";
import { navLinks } from "@/constants/Navlinks";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";
import type { StoreProfile } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
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

  const { data: storeProfile } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const storeInitials = useMemo(() => {
    if (!storeProfile?.storeName) return "";
    const words = storeProfile.storeName.trim().split(/\s+/);
    if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
    return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
  }, [storeProfile?.storeName]);
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
  const isDndDragging = useSidebarStore((state) => state.isDndDragging);

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
      <Link
        to={item.href}
        key={item.href}
        onClick={() => {
          if (isOverlay) {
            setIsSidebarOpen(false);
          }
        }}
        className={cn(
          "relative flex h-12 w-full items-center gap-3 rounded-lg px-2.5 text-base font-medium transition-colors duration-150 outline-none",
          "focus-visible:ring-ring focus-visible:ring-offset-sidebar focus-visible:ring-2 focus-visible:ring-offset-2",
          isActive
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 [&_svg]:size-[22px]",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "bg-sidebar-accent text-sidebar-foreground/55"
          )}
        >
          {item.icon}
        </span>
        <span className="truncate text-base">{item.title}</span>
      </Link>
    );
  };

  const shell = (
    <aside
      ref={sidebarRef}
      onMouseLeave={handleBillingSidebarMouseLeave}
      className={cn(
        "bg-sidebar text-sidebar-foreground border-r-frame relative h-full shrink-0 overflow-hidden border-r",
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
            <div className="bg-background border-frame flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border p-2 shadow-xs">
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

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-2">
            <Link
              to="/billing/sales/create"
              className="block w-full"
              onClick={handleBillingShortcutClick}
            >
              <Button
                variant="default"
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-[background-color,box-shadow] duration-150 hover:shadow-sm"
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
                className="h-12 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-[background-color,box-shadow] duration-150 hover:shadow-sm"
              >
                <FileText className="h-5 w-5" />
                <span>New Estimate</span>
              </Button>
            </Link>
          </div>

          <nav className="mt-7 flex flex-col">
            <div className="flex flex-col">
              <span className="text-sidebar-foreground/50 mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
                Main
              </span>
              <div className="flex flex-col gap-0.5">{mainLinks.map(renderNavItem)}</div>
            </div>

            <div className="mt-6 flex flex-col">
              <span className="text-sidebar-foreground/50 mb-2 px-1 text-xs font-semibold tracking-wider uppercase">
                System
              </span>
              <div className="flex flex-col gap-0.5">{systemLinks.map(renderNavItem)}</div>
            </div>
          </nav>
        </div>

        <div className="border-t-frame shrink-0 border-t px-4 py-3">
          <Link
            to="/settings"
            onClick={() => {
              if (isOverlay) {
                setIsSidebarOpen(false);
              }
            }}
            className="hover:bg-sidebar-accent flex h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150"
          >
            <div className="bg-success/15 text-success flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {storeInitials}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {storeProfile?.storeName}
              </span>
              <span className="text-sidebar-foreground/55 block truncate text-xs">
                {storeProfile?.email}
              </span>
            </div>
          </Link>
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="hover:bg-foreground/5 group absolute top-0 right-0 z-50 flex h-full w-1.5 shrink-0 cursor-col-resize items-center justify-center transition-colors duration-200"
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
              if (isDndDragging) {
                return;
              }
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
